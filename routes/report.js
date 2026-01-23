const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    db.all("SELECT * FROM expenses WHERE user_id=? ORDER BY date DESC", [req.session.user_id], (err, rows) => {
        if (err) {
            console.error(err);
            return res.send('Error loading report');
        }
        
        const expenses = rows || [];
        const total = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        res.render('report', { 
            expenses: expenses,
            total: total,
            username: req.session.username 
        });
    });
});

module.exports = router;
