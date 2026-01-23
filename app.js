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

app.use(session({
    secret: process.env.SESSION_SECRET || 'super-secure-secret-change-in-production-1234567890',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

// Database migration for time column
db.get("PRAGMA table_info(expenses)", (err, rows) => {
    const hasTime = rows.some(row => row.name === 'time');
    if (!hasTime) {
        db.run("ALTER TABLE expenses ADD COLUMN time TEXT", err => {
            if (err) console.log('Time column already exists or migration failed');
        });
    }
});

// Default admin user
bcrypt.hash('admin123', 10, (err, hash) => {
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (row && row.count === 0) {
            db.run("INSERT INTO users (username, password) VALUES (?, ?)", ["admin", hash]);
            console.log("Default admin created: admin/admin123");
        }
    });
});

const requireAuth = (req, res, next) => {
    if (!req.session.user_id) return res.redirect('/');
    next();
};

// Routes
app.get('/', (req, res) => res.render('login', { error: null }));
app.get('/reset-password', (req, res) => res.render('reset-password'));
app.get('/change-credentials', requireAuth, (req, res) => res.render('change-credentials'));

app.post('/login', (req, res) => {
    const { username
