const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const db = require('./db');          // ensures tables are created
const reportRoutes = require('./routes/report');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
    secret: 'supersecretkey',
    resave: false,
    saveUninitialized: true
}));

// Ensure default user exists after tables are ready
db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
    if (err) {
        console.error("DB error:", err);
        return;
    }
    if(row && row.count === 0) {
        db.run("INSERT INTO users (username, password) VALUES (?, ?)", ["admin", "admin123"]);
        console.log("Default user created: admin / admin123");
    }
});

// Login page
app.get('/', (req, res) => res.render('login'));

// Login POST
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username=? AND password=?', [username, password], (err, row) => {
        if(row) {
            req.session.user_id = row.id;

            // Force password change for default user
            if(username === "admin" && password === "admin123") {
                return res.redirect('/change-password');
            }

            res.redirect('/dashboard');
        } else {
            res.send('Invalid login');
        }
    });
});

// Change password page
app.get('/change-password', (req, res) => {
    if(!req.session.user_id) return res.redirect('/');
    res.render('change-password'); // views/change-password.ejs
});

app.post('/change-password', (req, res) => {
    if(!req.session.user_id) return res.redirect('/');
    const { newPassword } = req.body;
    const userId = req.session.user_id;

    db.run('UPDATE users SET password=? WHERE id=?', [newPassword, userId], () => {
        res.send('Password updated! Please <a href="/">login</a> again.');
    });
});

// Dashboard
app.get('/dashboard', (req, res) => {
    if(!req.session.user_id) return res.redirect('/');
    db.all('SELECT category, SUM(amount) as total FROM expenses WHERE user_id=? GROUP BY category', [req.session.user_id], (err, rows) => {
        res.render('dashboard', { data: rows });
    });
});

// Reports
app.use('/report', reportRoutes);

app.listen(8067, '0.0.0.0', () => console.log('Server running on port 8067'));
