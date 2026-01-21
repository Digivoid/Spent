<!DOCTYPE html>
<html>
<head><title>Report</title></head>
<body>
<h1>Expense Report</h1>
<table border="1">
<tr><th>Amount</th><th>Category</th><th>Note</th><th>Date</th></tr>
{% for amt, cat, note, date in report %}
<tr><td>{{ amt }}</td><td>{{ cat }}</td><td>{{ note }}</td><td>{{ date }}</td></tr>
{% endfor %}
</table>
</body>
</html>
