require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
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

// SECURE SESSION
app.use(session({
    secret: process.env.SESSION_SECRET || '64-char-super-secure-random-secret-key-change-in-prod',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

// Database migration - Add time column if missing
db.all("PRAGMA table_info(expenses)", (err, rows) => {
    if (rows && Array.isArray(rows)) {
        const hasTime = rows.some(row => row.name === 'time');
        if (!hasTime) {
            db.run("ALTER TABLE expenses ADD COLUMN time TEXT", (err) => {
                if (!err) console.log("✅ Added time column to expenses table");
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
            console.log("✅ Default admin created: admin/admin123");
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
    console.log(`🔍 Login attempt: username="${username}", password="${password}"`);
    
    db.get("SELECT * FROM users WHERE username=?", [username], async (err, row) => {
        console.log(`📊 Database query result:`, row);
        
        if (row) {
            const match = await bcrypt.compare(password, row.password);
            console.log(`🔐 Password match:`, match);
            
            if (match) {
                req.session.user_id = row.id;
                req.session.username = row.username;
                console.log(`✅ Login successful`);
                if (username === "admin" && password === "admin123") {
                    return res.redirect('/change-credentials');
                }
                res.redirect('/dashboard');
            } else {
                console.log(`❌ Password mismatch`);
                res.render('login', { error: "Invalid password" });
            }
        } else {
            console.log(`❌ User not found`);
            res.render('login', { error: "User not found" });
        }
    });
});

app.post('/change-credentials', requireAuth, (req, res) => {
    const { newUsername, newPassword } = req.body;
    bcrypt.hash(newPassword, 10, (err, hash) => {
        db.run("UPDATE users SET username=?, password=? WHERE id=?", 
            [newUsername, hash, req.session.user_id], 
            () => res.send('✅ Credentials updated! <a href="/">Login</a>')
        );
    });
});

app.post('/reset-password', (req, res) => {
    const { username, newPassword } = req.body;
    bcrypt.hash(newPassword, 10, (err, hash) => {
        db.run("UPDATE users SET password=? WHERE username=?", [hash, username], function() {
            if (this.changes > 0) {
                res.send('✅ Password reset! <a href="/">Login</a>');
            } else {
                res.send('❌ Username not found.');
            }
        });
    });
});

app.get('/dashboard', requireAuth, (req, res) => {
    db.all("SELECT id, category, subcategory, note, date, time, amount, color FROM expenses WHERE user_id=?", 
        [req.session.user_id], (err, rows) => {
        if (!rows) rows = [];
        
        const totalExpenses = rows.reduce((sum, e) => sum + e.amount, 0);
        const recentExpenses = rows.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        
        const chartData = {};
        rows.forEach(e => {
            const key = e.category + (e.subcategory ? ' - ' + e.subcategory : '');
            if (!chartData[key]) {
                chartData[key] = { 
                    id: e.id,
                    total: 0, 
                    color: e.color || '#007bff', 
                    category: e.category, 
                    subcategory: e.subcategory || '',
                    note: e.note || '',
                    date: e.date,
                    time: e.time || ''
                };
            }
            chartData[key].total += e.amount;
        });
        
        // Convert to array
        const chartDataArray = [];
        for (let key in chartData) {
            chartDataArray.push(chartData[key]);
        }
        
        res.render('dashboard', { 
             chartDataArray, 
            totalExpenses, 
            recentExpenses, 
            username: req.session.username 
        });
    });
});

app.use('/expenses', requireAuth, expenseRoutes);
app.use('/report', requireAuth, reportRoutes);

const PORT = process.env.PORT || 8067;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
