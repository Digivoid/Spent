from flask import Flask, render_template, request, redirect, session
from db import init, connect
from auth import create_user, check_login
from reports import category_chart
import datetime

app = Flask(__name__)
app.secret_key = "change-this"

init()
create_user("admin", "admin")  # change after first login


@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        if check_login(request.form["user"], request.form["pw"]):
            session["user"] = request.form["user"]
            return redirect("/dashboard")
    return render_template("login.html")


@app.route("/dashboard", methods=["GET", "POST"])
def dashboard():
    if "user" not in session:
        return redirect("/")

    db = connect()
    if request.method == "POST":
        db.execute(
            "INSERT INTO expenses VALUES(NULL,?,?,?,?)",
            (request.form["amount"],
             request.form["category"],
             request.form["note"],
             request.form["date"])
        )
        db.commit()

    rows = db.execute(
        "SELECT * FROM expenses ORDER BY date DESC"
    ).fetchall()
    return render_template("dashboard.html", rows=rows)


@app.route("/report")
def report():
    if "user" not in session:
        return redirect("/")

    start = request.args.get("start", "2000-01-01")
    end = request.args.get("end", datetime.date.today().isoformat())
    chart = category_chart(start, end)

    db = connect()
    summary = db.execute("""
        SELECT category, SUM(amount)
        FROM expenses
        WHERE date BETWEEN ? AND ?
        GROUP BY category
    """, (start, end)).fetchall()

    return render_template("report.html",
                           summary=summary, chart=chart)


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")


app.run(host="0.0.0.0", port=8067)
