from werkzeug.security import generate_password_hash, check_password_hash
from db import connect


def create_user(username, password):
    db = connect()
    db.execute(
        "INSERT OR IGNORE INTO users VALUES(NULL,?,?)",
        (username, generate_password_hash(password))
    )
    db.commit()


def check_login(username, password):
    db = connect()
    u = db.execute(
        "SELECT password FROM users WHERE username=?",
        (username,)
    ).fetchone()
    return u and check_password_hash(u[0], password)
