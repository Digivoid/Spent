// Chart Initialization - Complete File
function initChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error('Canvas not found:', canvasId);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#F5F5F7' : '#1D1D1D';

    try {
        new Chart(ctx, {
            type: 'doughnut',
             data,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            padding: 20,
                            font: {
                                size: 13,
                                family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? 'rgba(26, 35, 50, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: isDark ? 'rgba(0, 169, 255, 0.5)' : 'rgba(0, 122, 255, 0.5)',
                        borderWidth: 1,
                        padding: 12,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 12
                        },
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += '€' + context.parsed.toFixed(2);
                                return label;
                            }
                        }
                    }
                }
            }
        });
        console.log('Chart successfully created');
    } catch (error) {
        console.error('Error creating chart:', error);
    }
}
