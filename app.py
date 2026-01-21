from flask import Flask, render_template, request, redirect, session
from db import init, connect
from auth import login_required
import reports

app = Flask(__name__)
app.secret_key = "supersecretkey"
init()

@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        db = connect()
        c = db.cursor()
        c.execute("SELECT id FROM users WHERE username=? AND password=?", (username, password))
        user = c.fetchone()
        if user:
            session["user_id"] = user[0]
            return redirect("/dashboard")
        return "Invalid login"
    return render_template("login.html")

@app.route("/dashboard")
@login_required
def dashboard():
    data = reports.get_expense_summary(session["user_id"])
    return render_template("dashboard.html", data=data)

@app.route("/report")
@login_required
def report():
    report_data = reports.get_expense_report(session["user_id"])
    return render_template("report.html", report=report_data)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8067)
