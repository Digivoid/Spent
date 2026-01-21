const express = require('express');
const router = express.Router();
const db = require('../db');

// Add expense
router.get('/add',(req,res)=>{
    if(!req.session.user_id) return res.redirect('/');
    res.render('add-expense',{ categories: [] });
});
router.post('/add',(req,res)=>{
    if(!req.session.user_id) return res.redirect('/');
    const { amount, category, subcategory, note, date } = req.body;
    db.run("INSERT INTO expenses(user_id,amount,category,subcategory,note,date) VALUES(?,?,?,?,?,?)",
        [req.session.user_id,amount,category,subcategory,note,date],
        ()=>res.redirect('/dashboard'));
});

// Edit expense
router.get('/edit/:id',(req,res)=>{
    if(!req.session.user_id) return res.redirect('/');
    db.get("SELECT * FROM expenses WHERE id=?",[req.params.id],(err,row)=>{
        res.render('edit-expense',{ expense: row });
    });
});
router.post('/edit/:id',(req,res)=>{
    if(!req.session.user_id) return res.redirect('/');
    const { amount, category, subcategory, note, date } = req.body;
    db.run("UPDATE expenses SET amount=?,category=?,subcategory=?,note=?,date=? WHERE id=?",
        [amount,category,subcategory,note,date,req.params.id],()=>res.redirect('/dashboard'));
});

// Delete
router.get('/delete/:id',(req,res)=>{
    if(!req.session.user_id) return res.redirect('/');
    db.run("DELETE FROM expenses WHERE id=?",[req.params.id],()=>res.redirect('/dashboard'));
});

module.exports = router;
