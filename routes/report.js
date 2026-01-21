const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    if(!req.session.user_id) return res.redirect('/');
    db.all('SELECT amount, category, note, date FROM expenses WHERE user_id=?', [req.session.user_id], (err, rows) => {
        res.render('report', { report: rows });
    });
});

module.exports = router;
