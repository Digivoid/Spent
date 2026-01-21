import sqlite3
import os

# Make a folder for the database
DB_DIR = "data"
os.makedirs(DB_DIR, exist_ok=True)

DB = os.path.join(DB_DIR, "expenses.db")


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
        amount REAL,
        category TEXT,
        note TEXT,
        date TEXT
    )""")

    db.commit()
