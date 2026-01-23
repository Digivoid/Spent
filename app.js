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
            recentExpenses, 
            username: req.session.username 
        });
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
