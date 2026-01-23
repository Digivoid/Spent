const express = require('express');
const router = express.Router();
const db = require('../db');

// GET add expense page
router.get('/add', (req, res) => {
    db.all("SELECT DISTINCT name FROM categories WHERE user_id=? ORDER BY name", 
        [req.session.user_id], (err, rows) => {
        const categories = rows || [];
        res.render('add-expense', { categories, username: req.session.username });
    });
});

// POST add expense
router.post('/add', (req, res) => {
    const { category, subcategory, note, date, time, amount, color } = req.body;
    
    if (!category || !amount || !date) {
        return res.send('❌ Category, amount, and date are required! <a href="/expenses/add">Back</a>');
    }
    
    db.run(
        "INSERT INTO expenses(user_id, category, subcategory, note, date, time, amount, color) VALUES(?,?,?,?,?,?,?,?)",
        [req.session.user_id, category, subcategory || '', note || '', date, time || '', parseFloat(amount), color || '#007bff'],
        (err) => {
            if (err) {
                console.error('Error adding expense:', err);
                return res.send('❌ Error adding expense! <a href="/expenses/add">Back</a>');
            }
            console.log(`✅ Expense added: ${category} - €${amount}`);
            res.redirect('/dashboard');
        }
    );
});

// GET add category
router.get('/add-category', (req, res) => {
    res.render('add-category', { username: req.session.username });
});

// POST add category
router.post('/add-category', (req, res) => {
    const { newCategory } = req.body;
    
    if (!newCategory || newCategory.trim() === '') {
        return res.send('❌ Category name required! <a href="/expenses/add-category">Back</a>');
    }
    
    db.run(
        "INSERT OR IGNORE INTO categories(user_id, name) VALUES(?,?)",
        [req.session.user_id, newCategory.trim()],
        (err) => {
            if (err) {
                console.error('Error adding category:', err);
                return res.send('❌ Error adding category! <a href="/expenses/add-category">Back</a>');
            }
            console.log(`✅ Category added: ${newCategory}`);
            res.redirect('/expenses/add');
        }
    );
});

// DELETE expense
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    db.run("DELETE FROM expenses WHERE id=? AND user_id=?", [id, req.session.user_id], function() {
        if (this.changes > 0) {
            console.log(`✅ Expense ${id} deleted`);
            res.json({ success: true });
        } else {
            res.status(403).json({ success: false, error: 'Unauthorized' });
        }
    });
});

// GET all expenses (for dashboard refresh)
router.get('/list', (req, res) => {
    db.all("SELECT id, category, subcategory, note, date, time, amount, color FROM expenses WHERE user_id=? ORDER BY date DESC", 
        [req.session.user_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

module.exports = router;
