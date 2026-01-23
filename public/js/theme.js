// Dark/Light Theme Toggle
(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        const themeToggle = document.getElementById('themeToggle');
        const body = document.body;
        
        // Get saved theme or default to dark
        const currentTheme = localStorage.getItem('theme') || 'dark';
        body.setAttribute('data-theme', currentTheme);
        updateIcon(currentTheme);
        
        // Toggle on click
        if (themeToggle) {
            themeToggle.addEventListener('click', function() {
                const theme = body.getAttribute('data-theme');
                const newTheme = theme === 'dark' ? 'light' : 'dark';
                
                body.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                updateIcon(newTheme);
            });
        }
        
        function updateIcon(theme) {
            const icon = document.querySelector('.theme-icon');
            if (icon) {
                icon.textContent = theme === 'dark' ? '☀️' : '🌙';
            }
        }
    });
})();
