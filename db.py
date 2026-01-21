import sqlite3
DB = "expenses.db"

def connect():
    return sqlite3.connect(DB, check_same_thread=False)

def init():
    db = connect()
    c = db.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS expenses(
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        amount REAL,
        category TEXT,
        note TEXT,
        date TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )""")
    db.commit()
