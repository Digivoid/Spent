<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reports - Spent Tracker</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div class="app-container">
        <!-- Sidebar Navigation -->
        <nav class="sidebar">
            <div class="sidebar-header">
                <h1 class="app-title">Spent</h1>
                <button class="theme-toggle" id="themeToggle" title="Toggle theme">
                    <span class="theme-icon">🌙</span>
                </button>
            </div>

            <div class="nav-menu">
                <a href="/dashboard" class="nav-item">
                    <span class="nav-icon">📊</span>
                    <span>Dashboard</span>
                </a>
                <a href="/all-expenses" class="nav-item">
                    <span class="nav-icon">💰</span>
                    <span>All Expenses</span>
                </a>
                <a href="/expenses/add" class="nav-item">
                    <span class="nav-icon">➕</span>
                    <span>Add Expense</span>
                </a>
                <a href="/report" class="nav-item active">
                    <span class="nav-icon">📈</span>
                    <span>Reports</span>
                </a>
            </div>

            <div class="sidebar-footer">
                <div class="user-info">
                    <div class="user-avatar"><%= username.charAt(0).toUpperCase() %></div>
                    <span class="user-name"><%= username %></span>
                </div>
                <a href="/logout" class="logout-btn">Logout</a>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Header -->
            <header class="page-header">
                <div class="header-content">
                    <h2>Reports</h2>
                    <p class="header-subtitle">Analyze your spending patterns</p>
                </div>
            </header>

            <!-- Report Content -->
            <section style="padding: var(--space-2xl);">
                <div class="card">
                    <div class="card-header">
                        <h3>Expense Report</h3>
                    </div>
                    <div class="card-body">
                        <% if (expenses && expenses.length > 0) { %>
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Category</th>
                                            <th>Description</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <% expenses.forEach(exp => { %>
                                            <tr>
                                                <td><%= new Date(exp.date).toLocaleDateString('de-DE') %></td>
                                                <td>
                                                    <div style="display: flex; align-items: center; gap: 8px;">
                                                        <div style="width: 12px; height: 12px; border-radius: 50%; background-color: <%= exp.color %>; flex-shrink: 0;"></div>
                                                        <%= exp.category %>
                                                    </div>
                                                </td>
                                                <td>
                                                    <% if (exp.subcategory) { %>
                                                        <div><%= exp.subcategory %></div>
                                                    <% } %>
                                                    <% if (exp.note) { %>
                                                        <div style="color: var(--text-secondary); font-size: 13px;"><%= exp.note %></div>
                                                    <% } %>
                                                </td>
                                                <td class="amount-cell">€<%= exp.amount.toFixed(2) %></td>
                                            </tr>
                                        <% }); %>
                                    </tbody>
                                </table>
                            </div>

                            <div style="margin-top: var(--space-2xl); padding: var(--space-lg); background-color: var(--bg-primary); border-radius: var(--radius-md);">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: var(--font-size-lg); font-weight: 600;">Total Expenses:</span>
                                    <span style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--accent);">€<%= total.toFixed(2) %></span>
                                </div>
                            </div>
                        <% } else { %>
                            <div class="empty-state">
                                <p>No expenses to report</p>
                                <a href="/expenses/add" class="btn btn-primary" style="margin-top: var(--space-lg); max-width: 200px;">Add First Expense</a>
                            </div>
                        <% } %>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <script src="/js/theme.js"></script>
</body>
</html>
