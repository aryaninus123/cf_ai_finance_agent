// Analytics functionality
class AnalyticsManager {
    constructor() {
        this.monthlyTrendChart = null;
        this.selectedMonth = this.getCurrentYearMonth();
        this.init();
    }

    init() {
        this.populateMonthSelector();
        this.setupEventListeners();
    }

    getCurrentYearMonth() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    populateMonthSelector() {
        const select = document.getElementById('analyticsMonth');
        if (!select) return;

        const now = new Date();
        const months = [];

        // Generate last 12 months
        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const displayName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            months.push({ value: yearMonth, display: displayName });
        }

        select.innerHTML = months.map(m =>
            `<option value="${m.value}" ${m.value === this.selectedMonth ? 'selected' : ''}>${m.display}</option>`
        ).join('');
    }

    setupEventListeners() {
        const select = document.getElementById('analyticsMonth');
        if (select) {
            select.addEventListener('change', (e) => {
                this.selectedMonth = e.target.value;
                this.loadAnalytics();
            });
        }
    }

    async loadAnalytics() {
        await Promise.all([
            this.loadCategoryBreakdown(),
            this.loadBudgetPerformance(),
            this.loadAIInsights(),
            this.loadMonthlyTrend()
        ]);
    }

    async loadCategoryBreakdown() {
        try {
            const response = await fetch('/api/summary');
            const data = await response.json();

            const [year, month] = this.selectedMonth.split('-');
            const targetMonth = parseInt(month) - 1;
            const targetYear = parseInt(year);

            // Filter transactions for selected month
            const monthTransactions = data.transactions.filter(t => {
                const txDate = new Date(t.date);
                return txDate.getMonth() === targetMonth &&
                       txDate.getFullYear() === targetYear &&
                       t.type === 'expense';
            });

            // Calculate category breakdown
            const categoryTotals = {};
            let total = 0;
            monthTransactions.forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
                total += t.amount;
            });

            const container = document.getElementById('analyticsCategoryBreakdown');
            if (Object.keys(categoryTotals).length === 0) {
                container.innerHTML = '<p class="no-data">No spending data for this month</p>';
                return;
            }

            const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

            container.innerHTML = sortedCategories.map(([category, amount]) => {
                const percentage = ((amount / total) * 100).toFixed(1);
                return `
                    <div class="category-item">
                        <span class="category-name">${category}</span>
                        <div>
                            <span class="category-amount">$${amount.toFixed(2)}</span>
                            <span class="category-percentage">(${percentage}%)</span>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading category breakdown:', error);
        }
    }

    async loadBudgetPerformance() {
        try {
            const [summaryRes, budgetsRes] = await Promise.all([
                fetch('/api/summary'),
                fetch('/api/budgets')
            ]);

            const summary = await summaryRes.json();
            const budgetsData = await budgetsRes.json();
            const budgets = budgetsData.budgets || {};

            const [year, month] = this.selectedMonth.split('-');
            const targetMonth = parseInt(month) - 1;
            const targetYear = parseInt(year);

            // Calculate spending by category for selected month
            const monthlySpending = {};
            summary.transactions
                .filter(t => {
                    const txDate = new Date(t.date);
                    return txDate.getMonth() === targetMonth &&
                           txDate.getFullYear() === targetYear &&
                           t.type === 'expense';
                })
                .forEach(t => {
                    monthlySpending[t.category] = (monthlySpending[t.category] || 0) + t.amount;
                });

            const container = document.getElementById('analyticsBudgetPerformance');
            const budgetEntries = Object.entries(budgets);

            if (budgetEntries.length === 0) {
                container.innerHTML = '<p class="no-data">No budgets set</p>';
                return;
            }

            container.innerHTML = budgetEntries.map(([category, budget]) => {
                const spent = monthlySpending[category] || 0;
                const percentage = budget > 0 ? (spent / budget) * 100 : 0;

                let status = 'on-track';
                let statusText = 'On track';
                if (percentage > 100) {
                    status = 'over';
                    statusText = 'Over budget';
                } else if (percentage > 90) {
                    status = 'warning';
                    statusText = 'Warning';
                }

                return `
                    <div class="budget-item">
                        <div class="budget-header">
                            <span class="budget-category">${category}</span>
                            <span class="budget-status ${status}">${statusText}</span>
                        </div>
                        <div class="budget-bar">
                            <div class="budget-fill ${status}" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                        <div class="budget-numbers">
                            <span>Spent: $${spent.toFixed(2)}</span>
                            <span>Budget: $${budget.toFixed(2)}</span>
                            <span>${percentage.toFixed(1)}% used</span>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading budget performance:', error);
        }
    }

    async loadAIInsights() {
        try {
            const response = await fetch('/api/ai-insights');
            const data = await response.json();

            const container = document.getElementById('analyticsAIInsights');
            if (data.insights) {
                const insights = data.insights.split('\n').filter(line => line.trim());
                container.innerHTML = insights.map(insight =>
                    `<div class="ai-insight-item">${insight}</div>`
                ).join('');
            } else {
                container.innerHTML = '<p class="no-data">No insights available</p>';
            }
        } catch (error) {
            console.error('Error loading AI insights:', error);
        }
    }

    async loadMonthlyTrend() {
        try {
            const response = await fetch('/api/summary');
            const data = await response.json();

            // Group transactions by month for the last 6 months
            const monthlyData = {};
            const currentDate = new Date(this.selectedMonth + '-01');

            for (let i = 5; i >= 0; i--) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[key] = {
                    expenses: 0,
                    income: 0,
                    label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                };
            }

            // Aggregate transactions
            data.transactions.forEach(t => {
                const txDate = new Date(t.date);
                const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyData[key]) {
                    if (t.type === 'expense') {
                        monthlyData[key].expenses += t.amount;
                    } else if (t.type === 'income') {
                        monthlyData[key].income += t.amount;
                    }
                }
            });

            const labels = Object.values(monthlyData).map(d => d.label);
            const expenses = Object.values(monthlyData).map(d => d.expenses);
            const income = Object.values(monthlyData).map(d => d.income);

            this.renderMonthlyTrendChart(labels, expenses, income);
        } catch (error) {
            console.error('Error loading monthly trend:', error);
        }
    }

    renderMonthlyTrendChart(labels, expenses, income) {
        const canvas = document.getElementById('monthlyTrendChart');
        if (!canvas) return;

        if (this.monthlyTrendChart) {
            this.monthlyTrendChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        this.monthlyTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Expenses',
                        data: expenses,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Income',
                        data: income,
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }
}

// Initialize analytics when section is shown
let analyticsManager = null;

// Enhance the existing showSection function to initialize analytics
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item[data-section="analytics"]');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            setTimeout(() => {
                if (!analyticsManager) {
                    analyticsManager = new AnalyticsManager();
                }
                analyticsManager.loadAnalytics();
            }, 100);
        });
    });
});
