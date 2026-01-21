const express = require('express');
const router = express.Router();
const db = require('../db');

const categoryColors = ['#007bff','#28a745','#dc3545','#ffc107','#17a2b8','#6f42c1','#fd7e14'];

// Add expense
router.post('/add',(req,res)=>{
    const { amount, category, subcategory, note, date } = req.body;
    const color = categoryColors[Math.floor(Math.random()*categoryColors.length)];
    db.run("INSERT INTO expenses(user_id,amount,category,subcategory,note,date,color) VALUES(?,?,?,?,?,?,?)",
        [req.session.user_id,amount,category,subcategory,note,date,color],()=>res.redirect('/dashboard'));
});

// Edit expense
router.post('/edit/:id',(req,res)=>{
    const { amount, category, subcategory, note, date } = req.body;
    db.run("UPDATE expenses SET amount=?, category=?, subcategory=?, note=?, date=? WHERE id=?",
        [amount,category,subcategory,note,date,req.params.id],()=>res.redirect('/dashboard'));
});

// Delete expense
router.get('/delete/:id',(req,res)=>{
    db.run("DELETE FROM expenses WHERE id=?",[req.params.id],()=>res.redirect('/dashboard'));
});

// Add category
router.post('/add-category',(req,res)=>{
    const { category, subcategory, color } = req.body;
    db.run("INSERT INTO expenses(user_id,category,subcategory,amount,color,date) VALUES(?,?,?,?,?,?)",
        [req.session.user_id,category,subcategory||'',0,color,new Date().toISOString()],
        ()=>res.sendStatus(200));
});

// Update category
router.post('/update-category',(req,res)=>{
    const { id, field, value } = req.body;
    db.run(`UPDATE expenses SET ${field}=? WHERE id=?`, [value,id], ()=>res.sendStatus(200));
});

// Delete category
router.post('/delete-category',(req,res)=>{
    const { id } = req.body;
    db.run("DELETE FROM expenses WHERE id=?", [id], ()=>res.sendStatus(200));
});

module.exports = router;
