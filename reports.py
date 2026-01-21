# reports.py
from app import app
from flask import render_template, request
from report import get_expense_summary, get_expense_report

@app.route("/report", methods=["GET", "POST"])
def report():
    user_id = 1
    summary = get_expense_summary(user_id)
    chart = None
    if request.method == "POST":
        start = request.form.get("start")
        end = request.form.get("end")
    return render_template("report.html", summary=summary, chart=chart)
