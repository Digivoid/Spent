require('dotenv').config();
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const db = require('./db');
const expenseRoutes = require('./routes/expenses');
const reportRoutes = require('./routes/report');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Create sessions directory
if (!fs.existsSync('./data/sessions')) {
    fs.mkdirSync('./data/sessions', { recursive: true });
}

// FILE-BASED SESSION STORE (persists across restarts)
app.use(session({
    store: new FileStore({ path: './data/sessions' }),
    secret: process.env.SESSION_SECRET || '64-char-super-secure-random-secret-key-change-in-prod',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));

// Database migration - Add time column if missing
db.all("PRAGMA table_info(expenses)", (err, rows) => {
    if (rows && Array.isArray(rows)) {
        const hasTime = rows.some(row => row.name === 'time');
        if (!hasTime) {
            db.run("ALTER TABLE expenses ADD COLUMN time TEXT", (err) => {
                if (!err) console.log("Added time column to expenses table");
            });
        }
    }
});

// Default admin user (hashed password)
const defaultPassword = 'admin123';
bcrypt.hash(defaultPassword, 10, (err, hash) => {
    db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
        if (row && row.count === 0) {
            db.run("INSERT INTO users(username, password) VALUES(?,?)", ["admin", hash]);
            console.log("Default admin created: admin/admin123");
        }
    });
});

// Middleware to check auth
const requireAuth = (req, res, next) => {
    if (!req.session.user_id) return res.redirect('/');
    next();
};

// Routes
app.get('/', (req, res) => res.render('login', { error: null }));
app.get('/reset-password', (req, res) => res.render('reset-password'));
app.get('/change-credentials', requireAuth, (req, res) => res.render('change-credentials'));

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt: username="${username}"`);
    
    db.get("SELECT * FROM users WHERE username=?", [username], async (err, row) => {
        if (row) {
            const match = await bcrypt.compare(password, row.password);
            
            if (match) {
                req.session.user_id = row.id;
                req.session.username = row.username;
                console.log(`Login successful for ${username}`);
                
                if (username === "admin" && password === "admin123") {
                    return res.redirect('/change-credentials');
                }
                res.redirect('/dashboard');
            } else {
                console.log(`Invalid password for ${username}`);
                res.render('login', { error: "Invalid credentials" });
            }
        } else {
            console.log(`User ${username} not found`);
            res.render('login', { error: "Invalid credentials" });
        }
    });
});

app.post('/change-credentials', requireAuth, (req, res) => {
    const { newUsername, newPassword } = req.body;
    
    if (!newUsername || !newPassword) {
        return res.send('Error: Username and password are required! <a href="/change-credentials">Back</a>');
    }
    
    bcrypt.hash(newPassword, 10, (err, hash) => {
        db.run("UPDATE users SET username=?, password=? WHERE id=?", 
            [newUsername, hash, req.session.user_id], 
            () => {
                console.log(`Credentials updated for user ${req.session.user_id}`);
                res.send('Credentials updated! <a href="/">Login</a>');
            }
        );
    });
});

app.post('/reset-password', (req, res) => {
    const { username, newPassword } = req.body;
    
    if (!username || !newPassword) {
        return res.send('Error: Username and password are required! <a href="/reset-password">Back</a>');
    }
    
    bcrypt.hash(newPassword, 10, (err, hash) => {
        db.run("UPDATE users SET password=? WHERE username=?", [hash, username], function() {
            if (this.changes > 0) {
                console.log(`Password reset for user ${username}`);
                res.send('Password reset! <a href="/">Login</a>');
            } else {
                console.log(`User ${username} not found for reset`);
                res.send('Error: Username not found. <a href="/reset-password">Back</a>');
            }
        });
    });
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send('Error logging out');
        }
        res.redirect('/');
    });
});

// Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
    db.all("SELECT id, category, subcategory, note, date, time, amount, color FROM expenses WHERE user_id=? ORDER BY date DESC", 
        [req.session.user_id], (err, rows) => {
        
        if (err) {
            console.error('Dashboard error:', err);
            return res.send('Database error');
        }
        
        if (!rows) rows = [];
        
        const totalExpenses = rows.reduce((sum, e) => sum + (e.amount || 0), 0);
        const recentExpenses = rows.slice(0, 5);
        
        // This month spending
        const now = new Date();
        const thisMonthExpenses = rows.filter(e => {
            const expDate = new Date(e.date);
            return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
        });
        const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        
        // Biggest expense
        const biggestExpense = rows.length > 0 ? Math.max(...rows.map(e => e.amount || 0)) : 0;
        
        // Top category
        const categoryTotals = {};
        rows.forEach(e => {
            if (!categoryTotals[e.category]) {
                categoryTotals[e.category] = 0;
            }
            categoryTotals[e.category] += e.amount || 0;
        });
        
        let topCategory = 'None';
        let maxAmount = 0;
        for (let cat in categoryTotals) {
            if (categoryTotals[cat] > maxAmount) {
                maxAmount = categoryTotals[cat];
                topCategory = cat;
            }
        }
        
        const chartData = {};
        rows.forEach(e => {
            const key = e.category + (e.subcategory ? ' - ' + e.subcategory : '');
            if (!chartData[key]) {
                chartData[key] = { 
                    id: e.id,
                    total: 0, 
                    color: e.color || '#00A9FF', 
                    category: e.category, 
                    subcategory: e.subcategory || '',
                    note: e.note || '',
                    date: e.date,
                    time: e.time || ''
                };
            }
            chartData[key].total += e.amount || 0;
        });
        
        const data = [];
        for (let key in chartData) {
            data.push(chartData[key]);
        }
        
        res.render('dashboard', { 
             data, 
            totalExpenses: parseFloat(totalExpenses || 0).toFixed(2),
            thisMonthTotal: parseFloat(thisMonthTotal || 0).toFixed(2),
            biggestExpense: parseFloat(biggestExpense || 0).toFixed(2),
            topCategory: topCategory,
            recentExpenses, 
            username: req.session.username 
        });
    });
});

// Graph/Analytics page
app.get('/graph', requireAuth, (req, res) => {
    db.all("SELECT id, category, subcategory, note, date, time, amount, color FROM expenses WHERE user_id=? ORDER BY date DESC", 
        [req.session.user_id], (err, rows) => {
        
        if (err) {
            console.error('Graph error:', err);
            return res.send('Database error');
        }
        
        if (!rows) rows = [];
        
        const total = rows.reduce((sum, e) => sum + (e.amount || 0), 0);
        
        const chartData = {};
        rows.forEach(e => {
            const key = e.category + (e.subcategory ? ' - ' + e.subcategory : '');
            if (!chartData[key]) {
                chartData[key] = { 
                    id: e.id,
                    total: 0, 
                    color: e.color || '#00A9FF', 
                    category: e.category, 
                    subcategory: e.subcategory || ''
                };
            }
            chartData[key].total += e.amount || 0;
        });
        
        const data = [];
        for (let key in chartData) {
            data.push(chartData[key]);
        }
        
        // Sort by total descending
        data.sort((a, b) => b.total - a.total);
        
        res.render('graph', { 
             data,
            total: total,
            username: req.session.username 
        });
    });
});

// Settings page
app.get('/settings', requireAuth, (req, res) => {
    db.all("SELECT DISTINCT category AS name FROM expenses WHERE user_id=? ORDER BY category", 
        [req.session.user_id], (err, categories) => {
        
        res.render('settings', { 
            username: req.session.username,
            categories: categories || []
        });
    });
});

// Change username
app.post('/settings/change-username', requireAuth, (req, res) => {
    const { newUsername } = req.body;
    
    if (!newUsername || newUsername.length < 3) {
        return res.send('Username must be at least 3 characters. <a href="/settings">Back</a>');
    }
    
    db.run("UPDATE users SET username=? WHERE id=?", [newUsername, req.session.user_id], (err) => {
        if (err) {
            return res.send('Error updating username. <a href="/settings">Back</a>');
        }
        req.session.username = newUsername;
        res.redirect('/settings');
    });
});

// Change password
app.post('/settings/change-password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.send('All fields required. <a href="/settings">Back</a>');
    }
    
    if (newPassword !== confirmPassword) {
        return res.send('Passwords do not match. <a href="/settings">Back</a>');
    }
    
    if (newPassword.length < 6) {
        return res.send('Password must be at least 6 characters. <a href="/settings">Back</a>');
    }
    
    db.get("SELECT password FROM users WHERE id=?", [req.session.user_id], async (err, row) => {
        if (err || !row) {
            return res.send('Error. <a href="/settings">Back</a>');
        }
        
        const match = await bcrypt.compare(currentPassword, row.password);
        if (!match) {
            return res.send('Current password incorrect. <a href="/settings">Back</a>');
        }
        
        const hash = await bcrypt.hash(newPassword, 10);
        db.run("UPDATE users SET password=? WHERE id=?", [hash, req.session.user_id], (err) => {
            if (err) {
                return res.send('Error updating password. <a href="/settings">Back</a>');
            }
            res.send('Password updated successfully! <a href="/settings">Back to Settings</a>');
        });
    });
});

// Set recovery ID
app.post('/settings/set-recovery', requireAuth, (req, res) => {
    const { recoveryId } = req.body;
    
    db.run("UPDATE users SET recovery_id=? WHERE id=?", [recoveryId, req.session.user_id], (err) => {
        if (err) {
            return res.send('Error setting recovery ID. <a href="/settings">Back</a>');
        }
        res.redirect('/settings');
    });
});

// Delete category
app.post('/settings/delete-category', requireAuth, (req, res) => {
    const { categoryName } = req.body;
    
    // Note: This doesn't delete expenses, just removes the category from the list
    // Categories are derived from expenses, so this is informational only
    res.send('Categories cannot be deleted independently. Delete all expenses in this category instead. <a href="/settings">Back</a>');
});

// Delete all data
app.post('/settings/delete-all-data', requireAuth, (req, res) => {
    db.run("DELETE FROM expenses WHERE user_id=?", [req.session.user_id], (err) => {
        if (err) {
            return res.json({ success: false });
        }
        res.json({ success: true });
    });
});

// All Expenses
app.get('/all-expenses', requireAuth, (req, res) => {
    db.all("SELECT id, category, subcategory, note, date, time, amount, color FROM expenses WHERE user_id=? ORDER BY date DESC", 
        [req.session.user_id], (err, rows) => {
        
        if (err) {
            console.error('Error:', err);
            return res.send('Database error');
        }
        
        res.render('all-expenses', { 
            expenses: rows || [],
            username: req.session.username 
        });
    });
});

// Category View
app.get('/expenses/category/:category', requireAuth, (req, res) => {
    const { category } = req.params;
    
    db.all("SELECT id, category, subcategory, note, date, time, amount, color FROM expenses WHERE user_id=? AND category=? ORDER BY date DESC", 
        [req.session.user_id, category], (err, rows) => {
        
        if (err) {
            console.error('Error:', err);
            return res.send('Database error');
        }
        
        const expenses = rows || [];
        const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        
        res.render('category-view', { 
            category: decodeURIComponent(category),
            expenses: expenses,
            total: total,
            username: req.session.username 
        });
    });
});

app.use('/expenses', requireAuth, expenseRoutes);
app.use('/report', requireAuth, reportRoutes);

const PORT = process.env.PORT || 8067;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
