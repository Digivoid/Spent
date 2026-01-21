const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./expenses.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS expenses(
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        amount REAL,
        category TEXT,
        note TEXT,
        date TEXT
    )`);
});

module.exports = db;
