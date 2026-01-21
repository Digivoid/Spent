import matplotlib.pyplot as plt
from db import connect
import os


def category_chart(start, end):
    db = connect()
    rows = db.execute("""
        SELECT category, SUM(amount)
        FROM expenses
        WHERE date BETWEEN ? AND ?
        GROUP BY category
    """, (start, end)).fetchall()

    if not rows:
        return None

    labels, values = zip(*rows)
    plt.clf()
    plt.pie(values, labels=labels, autopct="%1.0f%%")
    path = "static/charts/categories.png"
    os.makedirs("static/charts", exist_ok=True)
    plt.savefig(path)
    return path
