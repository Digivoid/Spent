const express = require('express');
const router = express.Router();
const db = require('../db');

const categoryColors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#fd7e14', '#e83e8c'];

router.get('/edit/:id', (req, res) => {
    db.get("SELECT * FROM expenses WHERE id=? AND user_id=?", 
        [req.params.id, req.session.user_id], (err, expense) => {
        if (expense) {
            res.render('edit-expense', { expense });
        } else {
            res.redirect('/dashboard');
        }
    });
});

router.post('/add', (req, res) => {
    const { amount, category, subcategory, note, date, time } = req.body;
    const color = categoryColors[Math.floor(Math.random() * categoryColors.length)];
    db.run("INSERT INTO expenses(user_id, amount, category, subcategory, note, date, time, color) VALUES(?,?,?,?,?,?,?,?)",
        [req.session.user_id, parseFloat(amount), category, subcategory || '', note || '', date, time || '', color],
        () => res.redirect('/dashboard')
    );
});

router.post('/edit/:id', (req, res) => {
    const { amount, category, subcategory, note, date, time } = req.body;
    db.run("UPDATE expenses SET amount=?, category=?, subcategory=?, note=?, date=?, time=? WHERE id=? AND user_id=?",
        [parseFloat(amount), category, subcategory || '', note || '', date, time || '', req.params.id, req.session.user_id],
        () => res.redirect('/dashboard')
    );
});

router.get('/delete/:id', (req, res) => {
    db.run("DELETE FROM expenses WHERE id=? AND user_id=?", [req.params.id, req.session.user_id], () => res.redirect('/dashboard'));
});

router.post('/add-category', (req, res) => {
    const { category, color } = req.body;
    db.run("INSERT INTO expenses(user_id, category, amount, color, date) VALUES(?,?,?,?,?)",
        [req.session.user_id, category, 0, color, new Date().toISOString().split('T')[0]],
        () => res.json({ success: true })
    );
});

module.exports = router;
