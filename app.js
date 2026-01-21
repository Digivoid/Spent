const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');
const expenseRoutes = require('./routes/expenses');
const reportRoutes = require('./routes/report');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: 'supersecretkey',
    resave: false,
    saveUninitialized: true
}));

// Default user
db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
    if (row.count === 0) {
        db.run("INSERT INTO users(username,password) VALUES(?,?)", ["admin","admin123"]);
        console.log("Default user created: admin/admin123");
    }
});

// Routes
app.get('/', (req,res)=>res.render('login',{ error:null }));
app.post('/login',(req,res)=>{
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username=? AND password=?", [username,password], (err,row)=>{
        if(row){
            req.session.user_id = row.id;
            if(username==="admin" && password==="admin123") return res.redirect('/change-credentials');
            res.redirect('/dashboard');
        }else res.render('login',{ error:"Invalid login" });
    });
});

// Change credentials
app.get('/change-credentials',(req,res)=>{
    if(!req.session.user_id) return res.redirect('/');
    res.render('change-credentials');
});
app.post('/change-credentials',(req,res)=>{
    if(!req.session.user_id) return res.redirect('/');
    const { newUsername, newPassword } = req.body;
    db.run("UPDATE users SET username=?,password=? WHERE id=?",
        [newUsername,newPassword,req.session.user_id],
        ()=>res.send('Credentials updated! <a href="/">Login</a>'));
});

// Reset password
app.get('/reset-password',(req,res)=>res.render('reset-password'));
app.post('/reset-password',(req,res)=>{
    const { username,newPassword } = req.body;
    db.run("UPDATE users SET password=? WHERE username=?",[newPassword,username],function(){
        if(this.changes>0) res.send('Password reset successfully! <a href="/">Login</a>');
        else res.send('Username not found.');
    });
});

// Dashboard
app.get('/dashboard',(req,res)=>{
    if(!req.session.user_id) return res.redirect('/');
    db.all("SELECT category,SUM(amount) as total FROM expenses WHERE user_id=? GROUP BY category",
        [req.session.user_id],
        (err,rows)=>res.render('dashboard',{ data: rows }));
});

// Expenses
app.use('/expenses',expenseRoutes);

// Reports
app.use('/report',reportRoutes);

app.listen(8067,'0.0.0.0',()=>console.log("Server running on port 8067"));
