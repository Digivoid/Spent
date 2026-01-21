const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const db = require('./db');
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

// Login
app.get('/', (req, res) => res.render('login'));
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username=? AND password=?', [username, password], (err, row) => {
        if(row) {
            req.session.user_id = row.id;
            res.redirect('/dashboard');
        } else {
            res.send('Invalid login');
        }
    });
});

// Dashboard
app.get('/dashboard', (req, res) => {
    if(!req.session.user_id) return res.redirect('/');
    db.all('SELECT category, SUM(amount) as total FROM expenses WHERE user_id=? GROUP BY category', [req.session.user_id], (err, rows) => {
        res.render('dashboard', { data: rows });
    });
});

// Report
app.use('/report', reportRoutes);

app.listen(8067, '0.0.0.0', () => console.log('Server running on port 8067'));
