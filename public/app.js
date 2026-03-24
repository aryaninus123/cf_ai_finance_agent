let balance = 1250.75;
let expenses = 342.50;
let savings = 908.25;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let allTransactions = [];

// Tab Management
function switchTab(clickedBtn, tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Add active class to clicked button
    if (clickedBtn) clickedBtn.classList.add('active');
    
    // Handle sidebar visibility based on tab
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const showBtn = document.getElementById('showDashboardBtn');
    
    const isMobile = window.innerWidth <= 768;
    if (tabName === 'analytics' && !isMobile) {
        // Hide sidebar completely on Analytics for full-width layout (desktop only)
        sidebar.style.display = 'none';
        mainContent.classList.add('expanded');
        showBtn.style.display = 'none';
    } else {
        sidebar.style.display = isMobile ? 'flex' : 'block';
        sidebar.classList.remove('hidden');
        mainContent.classList.remove('expanded');
        showBtn.style.display = 'none';
    }
    
    // Load tab-specific data
    if (tabName === 'budget') {
        loadBudgetData();
    } else if (tabName === 'analytics') {
        loadAnalyticsData();
    } else if (tabName === 'goals') {
        loadGoalsTab();
    }
}

// Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const showBtn = document.getElementById('showDashboardBtn');
    
    if (sidebar.classList.contains('hidden')) {
        // Show sidebar
        sidebar.classList.remove('hidden');
        mainContent.classList.remove('expanded');
        showBtn.style.display = 'none';
    } else {
        // Hide sidebar
        sidebar.classList.add('hidden');
        mainContent.classList.add('expanded');
        showBtn.style.display = 'block';
    }
}

// Budget Management
async function addTransactionFromForm() {
    const amount = parseFloat(document.getElementById('amountInput').value);
    const description = document.getElementById('descriptionInput').value;
    const category = document.getElementById('categoryInput').value;
    const type = document.getElementById('typeInput').value;
    const date = document.getElementById('dateInput').value;
    
    if (!amount || !description) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const response = await fetch('/api/add-transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount, description, category, type, date })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Clear form
            document.getElementById('amountInput').value = '';
            document.getElementById('descriptionInput').value = '';
            // Keep date as is for easy multiple entries
            
            // Refresh data
            await updateDashboardData();
            await loadBudgetData();
            
            // Show success message
            showNotification(result.message, 'success');
        } else {
            showNotification(result.error || 'Failed to add transaction', 'error');
        }
    } catch (error) {
        console.error('Error adding transaction:', error);
        showNotification('Failed to add transaction', 'error');
    }
}

async function loadBudgetData() {
    try {
        const response = await fetch('/api/get-summary');
        const data = await response.json();
        
        allTransactions = data.transactions || [];
        
        // Update monthly selector
        updateMonthlySelector();
        
        // Filter transactions for current month and calculate category breakdown
        const monthlyBreakdown = calculateMonthlyBreakdown(currentMonth, currentYear);
        
        // Load category budgets with monthly data
        await loadCategoryBudgets(monthlyBreakdown);
        
        // Load transactions list
        loadTransactionsList();
        
    } catch (error) {
        console.error('Error loading budget data:', error);
    }
}

function calculateMonthlyBreakdown(month, year) {
    const breakdown = {};
    allTransactions.forEach(transaction => {
        if (transaction.type === 'expense') {
            const txDate = new Date(transaction.date || transaction.timestamp);
            if (txDate.getMonth() === month && txDate.getFullYear() === year) {
                const category = transaction.category;
                breakdown[category] = (breakdown[category] || 0) + transaction.amount;
            }
        }
    });
    return breakdown;
}

function updateMonthlySelector() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    
    document.getElementById('currentMonth').textContent = 
        monthNames[currentMonth] + ' ' + currentYear;
}

function changeMonth(direction) {
    currentMonth += direction;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    updateMonthlySelector();
    
    // Recalculate monthly breakdown and update budgets
    const monthlyBreakdown = calculateMonthlyBreakdown(currentMonth, currentYear);
    loadCategoryBudgets(monthlyBreakdown);
    
    // Update transactions list
    loadTransactionsList();
}

async function loadCategoryBudgets(categoryBreakdown) {
    const container = document.getElementById('categoryBudgets');
    const categories = [
        { name: 'food', emoji: '🍕', label: 'Food' },
        { name: 'transportation', emoji: '🚗', label: 'Transportation' },
        { name: 'housing', emoji: '🏠', label: 'Housing' },
        { name: 'entertainment', emoji: '🎬', label: 'Entertainment' },
        { name: 'shopping', emoji: '🛍️', label: 'Shopping' },
        { name: 'healthcare', emoji: '🏥', label: 'Healthcare' }
    ];
    
    // Fetch current budgets
    let budgets = {};
    try {
        const response = await fetch('/api/get-budgets');
        const data = await response.json();
        budgets = data.budgets || {};
    } catch (error) {
        console.error('Error fetching budgets:', error);
        // Use default budgets
        budgets = {
            food: 500, transportation: 300, housing: 1000,
            entertainment: 200, shopping: 300, healthcare: 400
        };
    }
    
    container.innerHTML = categories.map(cat => {
        const spent = categoryBreakdown[cat.name] || 0;
        const budget = budgets[cat.name] || 500;
        const percentage = (spent / budget) * 100; // Don't cap for status calculation
        const displayPercentage = Math.min(percentage, 100); // Cap for progress bar only
        const status = percentage > 100 ? '🚨 Over budget' : percentage > 90 ? '⚠️ Near limit' : '✅ On track';
        
        return '<div class="budget-card" data-category="' + cat.name + '">' +
            '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">' +
                '<div style="display: flex; align-items: center; gap: 0.5rem;">' +
                    '<span style="font-size: 1.5rem;">' + cat.emoji + '</span>' +
                    '<h4 style="margin: 0;">' + cat.label + '</h4>' +
                '</div>' +
                '<button class="edit-budget-btn" data-category="' + cat.name + '" data-budget="' + budget + '" style="background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 36px; height: 36px; color: white; cursor: pointer; font-size: 1.1rem; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center;">⚙️</button>' +
            '</div>' +
            '<div style="margin-bottom: 0.5rem;">' +
                '<div style="display: flex; justify-content: space-between;">' +
                    '<span>$' + spent.toFixed(2) + '</span>' +
                    '<span id="budget-' + cat.name + '">/ $' + budget.toFixed(2) + '</span>' +
                '</div>' +
                '<div style="background: rgba(255,255,255,0.3); height: 8px; border-radius: 4px; margin-top: 0.5rem;">' +
                    '<div style="background: white; height: 100%; width: ' + displayPercentage + '%; border-radius: 4px; transition: width 0.5s ease;"></div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size: 0.9rem; opacity: 0.9;">' + status + '</div>' +
        '</div>';
    }).join('');
    
    // Add event listeners to edit buttons
    setTimeout(() => {
        document.querySelectorAll('.edit-budget-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const category = this.dataset.category;
                const currentBudget = parseFloat(this.dataset.budget);
                editBudget(category, currentBudget);
            });
        });
    }, 100);
}

async function editBudget(category, currentBudget) {
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    const newBudget = prompt('Set budget for ' + categoryName + ':', currentBudget);
    
    if (newBudget === null || newBudget === '') return; // User cancelled
    
    const budgetAmount = parseFloat(newBudget);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
        alert('Please enter a valid budget amount');
        return;
    }
    
    try {
        const response = await fetch('/api/set-budget', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                category: category,
                amount: budgetAmount
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Update the UI immediately
            document.getElementById('budget-' + category).textContent = '/ $' + budgetAmount.toFixed(2);
            
            // Reload the budget data to update progress bars
            await loadBudgetData();
            
            showNotification(result.message, 'success');
        } else {
            showNotification(result.error || 'Failed to update budget', 'error');
        }
    } catch (error) {
        console.error('Error updating budget:', error);
        showNotification('Failed to update budget', 'error');
    }
}

function loadTransactionsList() {
    const container = document.getElementById('transactionsList');
    const categoryFilter = document.getElementById('categoryFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const searchVal = (document.getElementById('searchInput') ? document.getElementById('searchInput').value : '').toLowerCase();
    const minAmt = document.getElementById('minAmount') ? parseFloat(document.getElementById('minAmount').value) : NaN;
    const maxAmt = document.getElementById('maxAmount') ? parseFloat(document.getElementById('maxAmount').value) : NaN;
    const dateFrom = document.getElementById('dateFrom') ? document.getElementById('dateFrom').value : '';
    const dateTo = document.getElementById('dateTo') ? document.getElementById('dateTo').value : '';
    const recurringOnly = document.getElementById('recurringFilter') ? document.getElementById('recurringFilter').checked : false;

    let filteredTransactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.timestamp);
        const matchesMonth = transactionDate.getMonth() === currentMonth &&
                           transactionDate.getFullYear() === currentYear;
        const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
        const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
        const matchesSearch = !searchVal || (transaction.description || '').toLowerCase().includes(searchVal);
        const matchesMin = isNaN(minAmt) || transaction.amount >= minAmt;
        const matchesMax = isNaN(maxAmt) || transaction.amount <= maxAmt;
        const txDate = transaction.date || new Date(transaction.timestamp).toISOString().split('T')[0];
        const matchesFrom = !dateFrom || txDate >= dateFrom;
        const matchesTo = !dateTo || txDate <= dateTo;
        const matchesRecurring = !recurringOnly || isRecurring(transaction);

        return matchesMonth && matchesCategory && matchesType && matchesSearch
            && matchesMin && matchesMax && matchesFrom && matchesTo && matchesRecurring;
    });

    if (filteredTransactions.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #718096;">No transactions found for the selected filters.</div>';
        return;
    }

    container.innerHTML = filteredTransactions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(transaction => {
            const recurring = isRecurring(transaction);
            return `<div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-description">${transaction.description}${recurring ? ' <span style="font-size:0.72rem;background:#667eea;color:white;border-radius:4px;padding:1px 6px;vertical-align:middle;">🔁 recurring</span>' : ''}</div>
                    <div class="transaction-category">${transaction.category} • ${new Date(transaction.timestamp).toLocaleDateString()}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'expense' ? '-' : '+'} $${transaction.amount.toFixed(2)}
                </div>
            </div>`;
        }).join('');
}

// Analytics
function initializeMonthSelector() {
    const monthSelect = document.getElementById('analyticsMonthSelect');
    if (!monthSelect) return;

    const now = new Date();
    const months = [];
    const year = selectedAnalyticsYear;

    // For the selected year, show all months up to today (or all 12 if past year)
    const maxMonth = year < now.getFullYear() ? 11 : now.getMonth();
    for (let m = maxMonth; m >= 0; m--) {
        const date = new Date(year, m, 1);
        const yearMonth = year + '-' + String(m + 1).padStart(2, '0');
        const displayName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        months.push({ value: yearMonth, display: displayName });
    }

    // Default to the most recent month of the selected year
    selectedAnalyticsMonth = months[0].value;

    monthSelect.innerHTML = months.map(m =>
        '<option value="' + m.value + '">' + m.display + '</option>'
    ).join('');

    // Remove old listener by replacing the element
    const newSelect = monthSelect.cloneNode(true);
    monthSelect.parentNode.replaceChild(newSelect, monthSelect);
    newSelect.addEventListener('change', function() {
        selectedAnalyticsMonth = this.value;
        loadAnalyticsData();
    });
}

async function loadAnalyticsData() {
    try {
        const [summaryResponse, budgetsResponse] = await Promise.all([
            fetch('/api/get-summary'),
            fetch('/api/get-budgets')
        ]);

        const data = await summaryResponse.json();
        const budgetData = await budgetsResponse.json();

        // Parse selected month/year
        const targetMonth = selectedAnalyticsMonth ? parseInt(selectedAnalyticsMonth.split('-')[1]) - 1 : new Date().getMonth();
        const targetYear = selectedAnalyticsMonth ? parseInt(selectedAnalyticsMonth.split('-')[0]) : selectedAnalyticsYear;

        // Check if there is any data for the selected year
        const hasHistoricalData = data.transactions.some(t => {
            return new Date(t.timestamp).getFullYear() === selectedAnalyticsYear;
        });

        // Calculate SELECTED MONTH's category breakdown
        const selectedMonthCategoryBreakdown = {};

        data.transactions.forEach(t => {
            if (t.type === 'expense') {
                const txDate = new Date(t.timestamp);
                if (txDate.getMonth() === targetMonth && txDate.getFullYear() === targetYear) {
                    selectedMonthCategoryBreakdown[t.category] = (selectedMonthCategoryBreakdown[t.category] || 0) + t.amount;
                }
            }
        });

        // Load category breakdown with MoM comparison
        loadCategoryAnalyticsWithComparison(selectedMonthCategoryBreakdown, targetMonth, targetYear);

        // Load monthly spending trend
        loadMonthlySpendingTrend(data.transactions, !hasHistoricalData);

        // Load budget performance (use selected month)
        loadBudgetPerformance(selectedMonthCategoryBreakdown, budgetData.budgets);

        // Load spending forecast (always current month)
        loadSpendingForecast(data.transactions, budgetData.budgets);

        // Load spending heatmap
        loadSpendingHeatmap(data.transactions, targetMonth, targetYear);

        // Load AI insights
        loadAIInsights(data);

        // Load AI anomalies
        loadAnomalies();

    } catch (error) {
        console.error('Error loading analytics data:', error);
    }
}

function loadCategoryAnalytics(categoryBreakdown, targetMonth, targetYear) {
    const container = document.getElementById('categoryChart');
    const total = Object.values(categoryBreakdown).reduce((sum, amount) => sum + amount, 0);

    if (total === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096; padding: 2rem;">No spending data for this month</p>';
        return;
    }
    
    container.innerHTML = Object.entries(categoryBreakdown)
        .sort(([,a], [,b]) => b - a)
        .map(([category, amount]) => {
            const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
            const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);
            return '<div class="category-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(102, 126, 234, 0.1); border-radius: 8px; margin-bottom: 8px;">' +
                '<span style="text-transform: capitalize; font-weight: 600; color: #2d3748;">' + capitalizedCategory + '</span>' +
                '<span style="font-weight: 600; color: #4a5568;">$' + amount.toFixed(2) + ' (' + percentage + '%)</span>' +
            '</div>';
        }).join('');
}

function loadMonthlySpendingTrend(transactions, showSampleData = false) {
    const container = document.getElementById('spendingChart');

    // Group transactions by month — show all months of the selected year
    const monthlyData = {};
    const now = new Date();
    const year = selectedAnalyticsYear;
    const maxMonth = year < now.getFullYear() ? 11 : now.getMonth();

    for (let m = 0; m <= maxMonth; m++) {
        const date = new Date(year, m, 1);
        const monthKey = year + '-' + String(m + 1).padStart(2, '0');
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthlyData[monthKey] = { name: monthName, amount: 0 };
    }

    // Aggregate expenses by month from actual transactions
    transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
            const date = new Date(transaction.timestamp);
            const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].amount += transaction.amount;
            }
        }
    });
    
    const monthlyValues = Object.values(monthlyData);
    const maxAmount = Math.max(...monthlyValues.map(m => m.amount));

    // Calculate bar heights (max 180px for better fit)
    const chartBars = monthlyValues.map(month => {
        const height = maxAmount > 0 ? Math.max((month.amount / maxAmount) * 180, 8) : 8;
        const isZero = month.amount === 0;

        return '<div style="display: flex; flex-direction: column; align-items: center; flex: 1; position: relative;">' +
            '<div style="position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; height: 200px; justify-content: flex-end;">' +
                // Amount label
                '<div style="position: absolute; bottom: ' + (height + 10) + 'px; font-size: 0.75rem; color: #2d3748; font-weight: 700; white-space: nowrap;">' +
                    (isZero ? '' : '$' + month.amount.toFixed(0)) +
                '</div>' +
                // Bar
                '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 70%; height: ' + height + 'px; border-radius: 8px 8px 0 0; box-shadow: 0 2px 12px rgba(102, 126, 234, 0.3); transition: all 0.3s ease;"></div>' +
            '</div>' +
            // Month label
            '<div style="font-size: 0.75rem; color: #718096; text-align: center; font-weight: 600; margin-top: 8px; line-height: 1.2;">' + month.name + '</div>' +
        '</div>';
    }).join('');

    const trendMessage = monthlyValues[monthlyValues.length - 1].amount > monthlyValues[monthlyValues.length - 2].amount ?
        '📈 Spending increased this month' : '📉 Spending decreased this month';

    container.innerHTML = '<div style="display: flex; flex-direction: column; width: 100%; padding: 20px; box-sizing: border-box;">' +
        '<div style="display: flex; align-items: flex-end; justify-content: space-around; gap: 8px; min-height: 220px;">' +
            chartBars +
        '</div>' +
        '<div style="text-align: center; color: #4a5568; font-size: 0.85rem; background: rgba(102, 126, 234, 0.1); padding: 10px 20px; border-radius: 20px; font-weight: 500; margin-top: 20px;">' +
            trendMessage +
        '</div>' +
    '</div>';
}

function loadBudgetPerformance(categoryBreakdown, budgets) {
    const container = document.getElementById('budgetPerformance');
    
    const categories = ['food', 'transportation', 'housing', 'entertainment', 'shopping', 'healthcare'];
    const performanceData = categories.map(category => {
        const spent = categoryBreakdown[category] || 0;
        const budget = budgets[category] || 500;
        const percentage = budget > 0 ? (spent / budget) * 100 : 0;
        
        return {
            category: category.charAt(0).toUpperCase() + category.slice(1),
            spent,
            budget,
            percentage: percentage, // Keep real percentage for status calculation
            displayPercentage: Math.min(percentage, 100), // Capped for progress bar
            status: percentage > 100 ? 'over' : percentage > 90 ? 'warning' : 'good'
        };
    }).filter(item => item.spent > 0); // Only show categories with spending
    
    container.innerHTML = performanceData.map(item => `
        <div class="budget-performance-card">
            <div class="budget-card-header">
                <h4>${item.category}</h4>
                <span class="status-badge ${item.status}">
                    ${item.status === 'over' ? '🚨 Over' : item.status === 'warning' ? '⚠️ Near limit' : '✅ On track'}
                </span>
            </div>
            <div class="budget-amounts">
                <div class="amount-item">
                    <span class="amount-label">Spent</span>
                    <span class="amount-value">$${item.spent.toFixed(2)}</span>
                </div>
                <div class="amount-item">
                    <span class="amount-label">Budget</span>
                    <span class="amount-value">$${item.budget.toFixed(2)}</span>
                </div>
            </div>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill ${item.status}" style="width: ${item.displayPercentage}%;"></div>
                </div>
                <div class="progress-text">${item.percentage.toFixed(1)}% used</div>
            </div>
        </div>
    `).join('');
    
    if (performanceData.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 2rem;">No spending data available for budget comparison.</div>';
    }
}

async function loadAIInsights(data) {
    const container = document.getElementById('aiInsights');

    // Show loading state
    container.innerHTML = '<div style="text-align: center; color: #666; padding: 2rem;"><div class="spinner"></div> Generating AI insights...</div>';

    try {
        // Fetch AI-generated insights
        const response = await fetch('/api/ai-insights');
        const result = await response.json();

        if (result.success && result.insights) {
            // Parse insights (they come as newline-separated strings)
            const insightLines = result.insights.split('\\n').filter(line => line.trim());
            container.innerHTML = insightLines.map(insight =>
                `<p style="margin-bottom: 1rem; line-height: 1.6;">${insight}</p>`
            ).join('');
        } else {
            throw new Error('Failed to load insights');
        }
    } catch (error) {
        console.error('AI insights error:', error);

        // Fallback to basic insights
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let monthlyIncome = 0;
        let monthlyExpenses = 0;
        const monthlyCategories = {};

        data.transactions.forEach(t => {
            const txDate = new Date(t.timestamp);
        if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
            if (t.type === 'income') {
                monthlyIncome += t.amount;
            } else if (t.type === 'expense') {
                monthlyExpenses += t.amount;
                monthlyCategories[t.category] = (monthlyCategories[t.category] || 0) + t.amount;
            }
        }
    });
    
    // Insight 1: Overall financial health
    if (monthlyIncome > 0) {
        const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1);
        if (monthlyIncome > monthlyExpenses) {
            const savings = (monthlyIncome - monthlyExpenses).toFixed(2);
            insights.push(`💰 <strong>Great job!</strong> You're saving ${savingsRate}% of your income this month ($${savings}). Keep it up!`);
        } else {
            const deficit = (monthlyExpenses - monthlyIncome).toFixed(2);
            insights.push(`⚠️ <strong>Heads up:</strong> You're spending $${deficit} more than your income this month. Consider reviewing your expenses.`);
        }
    }
    
    // Insight 2: Highest spending category
    const sortedCategories = Object.entries(monthlyCategories).sort((a, b) => b[1] - a[1]);
    if (sortedCategories.length > 0) {
        const topCategory = sortedCategories[0];
        const percentage = ((topCategory[1] / monthlyExpenses) * 100).toFixed(1);
        const categoryName = topCategory[0].charAt(0).toUpperCase() + topCategory[0].slice(1);
        const amount = topCategory[1].toFixed(2);
        insights.push(`📊 <strong>Top spending:</strong> ${categoryName} accounts for ${percentage}% of your expenses ($${amount} this month).`);
    }
    
    // Insight 3: Budget performance tip
    const budgetsResponse = await fetch('/api/get-budgets');
    const budgetData = await budgetsResponse.json();
    const budgets = budgetData.budgets || {};
    
    let overBudgetCount = 0;
    let nearLimitCount = 0;
    Object.entries(monthlyCategories).forEach(([cat, amount]) => {
        const budget = budgets[cat] || 500;
        const percentage = (amount / budget) * 100;
        if (percentage > 100) overBudgetCount++;
        else if (percentage > 85) nearLimitCount++;
    });
    
        if (overBudgetCount > 0) {
            const word = overBudgetCount > 1 ? 'ies' : 'y';
            insights.push(`🚨 <strong>Budget alert:</strong> You're over budget in ${overBudgetCount} categor${word}. Review these expenses to get back on track.`);
        } else if (nearLimitCount > 0) {
            const word = nearLimitCount > 1 ? 'ies' : 'y';
            insights.push(`⚠️ <strong>Watch out:</strong> You're approaching your budget limit in ${nearLimitCount} categor${word}. Plan ahead for the rest of the month.`);
        } else {
            insights.push(`✅ <strong>Well done!</strong> You're staying within your budgets across all categories. Keep up the good financial habits!`);
        }

        // Display fallback insights
        container.innerHTML = insights.map(insight => `<p style="margin-bottom: 1rem; line-height: 1.6;">${insight}</p>`).join('');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#667eea';
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem; background: ' + bgColor + '; color: white; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 1000; animation: slideIn 0.3s ease;';
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = start + (end - start) * progress;
        element.textContent = '$' + current.toFixed(2);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function updateDashboard() {
    const balanceEl = document.getElementById('balance');
    const incomeEl = document.getElementById('income');
    const expensesEl = document.getElementById('expenses');
    const savingsEl = document.getElementById('savings');
    
    if (balanceEl) animateValue(balanceEl, 0, balance, 2000);
    if (incomeEl) animateValue(incomeEl, 0, 0, 2500); // Will be updated by updateDashboardData()
    if (expensesEl) animateValue(expensesEl, 0, expenses, 2500);
    if (savingsEl) animateValue(savingsEl, 0, savings, 3000);
}

function parseMarkdown(text) {
    // Convert markdown to HTML
    let result = text;

    // Bold: **text** -> <strong>text</strong>
    result = result.replace(/\\*\\*([^\\*]+)\\*\\*/g, '<strong>$1</strong>');

    // Bullet points: • or - at start of line
    result = result.replace(/^[•\\-]\\s+(.+)$/gm, '<li>$1</li>');

    // Wrap consecutive <li> tags in <ul> - simple string-based approach
    if (result.indexOf('<li>') !== -1) {
        const lines = result.split('\\n');
        let inList = false;
        const processed = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.indexOf('<li>') !== -1) {
                if (!inList) {
                    processed.push('<ul>');
                    inList = true;
                }
                processed.push(line);
            } else {
                if (inList) {
                    processed.push('</ul>');
                    inList = false;
                }
                processed.push(line);
            }
        }
        if (inList) {
            processed.push('</ul>');
        }
        result = processed.join('\\n');
    }

    // Line breaks
    result = result.split('\\n\\n').join('</p><p>');
    result = result.split('\\n').join('<br>');

    return result;
}

function addMessage(content, isUser = false) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;

    // Parse markdown for AI messages
    const formattedContent = isUser ? content : parseMarkdown(content);

    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${formattedContent}</p>
        </div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
        <span>AI is thinking...</span>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

async function loadConversationHistory() {
    try {
        const response = await fetch('/api/conversation/history?conversationId=default');
        const data = await response.json();

        if (data.success && data.messages && data.messages.length > 0) {
            const messagesContainer = document.getElementById('chatMessages');
            if (messagesContainer) {
                // Clear the container first
                messagesContainer.innerHTML = '';

                // Display each message from history
                data.messages.forEach(msg => {
                    if (msg.role === 'user' || msg.role === 'assistant') {
                        addMessage(msg.content, msg.role === 'user');
                    }
                });
            }
        }
    } catch (error) {
        console.log('Could not load conversation history:', error);
    }
}

async function clearConversationHistory() {
    try {
        const response = await fetch('/api/conversation/clear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ conversationId: 'default' })
        });

        const data = await response.json();

        if (data.success) {
            // Clear the chat display
            const messagesContainer = document.getElementById('chatMessages');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }
            // Show a confirmation message
            addMessage('Conversation history cleared!', false);
        }
    } catch (error) {
        console.log('Could not clear conversation history:', error);
    }
}

async function sendMessage(message) {
    if (!message.trim()) return;
    
    addMessage(message, true);
    showTypingIndicator();
    
    try {
        const response = await fetch('/api/advice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message, conversationId: 'default' })
        });
        
        const data = await response.json();
        hideTypingIndicator();
        addMessage(data.response || 'I apologize, but I am having trouble processing your request right now. Please try again later.');

        // If function(s) were called, log them
        if (data.functionsCalled && data.functionsCalled.length > 0) {
            console.log(`✅ Multi-Step Execution: ${data.stepsExecuted} function(s) executed:`);
            data.functionsCalled.forEach((funcName, i) => {
                const result = data.functionResults[i];
                console.log(`  ${i + 1}. ${funcName} - ${result.success ? '✅' : '❌'} ${result.message}`);
            });
        } else if (data.functionCalled) {
            console.log(`✅ Function executed: ${data.functionCalled}`, data.functionResult);
        }

        // If any action was taken, update the dashboard
        if (data.action || data.functionsCalled) {
            await updateDashboardData();
        }
    } catch (error) {
        hideTypingIndicator();
        addMessage('I am experiencing some technical difficulties. Please try again in a moment.');
    }
}

async function updateDashboardData() {
    try {
        const response = await fetch('/api/get-summary');
        const data = await response.json();

        // Update dashboard with real data
        balance = data.balance; // Total balance (all-time income - all-time expenses)
        const income = data.monthlyIncome; // Current month's income
        expenses = data.monthlyExpenses; // Current month's expenses
        savings = Math.max(0, data.monthlyIncome - data.monthlyExpenses); // This month's savings (income - expenses)

        // Animate to new values
        const balanceEl = document.getElementById('balance');
        const incomeEl = document.getElementById('income');
        const expensesEl = document.getElementById('expenses');
        const savingsEl = document.getElementById('savings');

        if (balanceEl && incomeEl && expensesEl && savingsEl) {
            animateValue(balanceEl, parseFloat(balanceEl.textContent.replace('$', '')) || 0, balance, 1000);
            animateValue(incomeEl, parseFloat(incomeEl.textContent.replace('$', '')) || 0, income, 1000);
            animateValue(expensesEl, parseFloat(expensesEl.textContent.replace('$', '')) || 0, expenses, 1000);
            animateValue(savingsEl, parseFloat(savingsEl.textContent.replace('$', '')) || 0, savings, 1000);
        }
    } catch (error) {
        console.log('Could not update dashboard data');
    }
}

function sendSuggestion(suggestion) {
    const responses = {
        'Add expense': 'I can help you add an expense! Just tell me the amount, category, and description. For example: "Add $50 grocery expense"',
        'Set budget': 'Let us set up a budget! Tell me the category and amount. For example: "Set $500 monthly food budget"',
        'Financial advice': 'Based on your spending patterns, I recommend: 1) Try the 50/30/20 rule (50% needs, 30% wants, 20% savings), 2) Track your expenses daily, 3) Build an emergency fund of 3-6 months expenses.',
        'Investment tips': 'Here are some investment tips for beginners: 1) Start with low-cost index funds, 2) Diversify your portfolio, 3) Invest regularly (dollar-cost averaging), 4) Do not try to time the market, 5) Consider your risk tolerance and time horizon.'
    };

    addMessage(suggestion, true);
    setTimeout(() => {
        addMessage(responses[suggestion] || 'I can help you with that! Please provide more details about what you would like to do.');
    }, 1000);
}

// Global variables for analytics year/month
let selectedAnalyticsMonth = null;
let selectedAnalyticsYear = new Date().getFullYear();

function switchAnalyticsYear(year) {
    selectedAnalyticsYear = year;

    // Update button styles
    const btn2025 = document.getElementById('yearBtn2025');
    const btn2026 = document.getElementById('yearBtn2026');
    if (btn2025 && btn2026) {
        const activeStyle = 'padding: 6px 18px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; background: #667eea; color: white; box-shadow: 0 2px 8px rgba(102,126,234,0.4); transition: all 0.2s;';
        const inactiveStyle = 'padding: 6px 18px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; background: transparent; color: #718096; transition: all 0.2s;';
        btn2025.style.cssText = year === 2025 ? activeStyle : inactiveStyle;
        btn2026.style.cssText = year === 2026 ? activeStyle : inactiveStyle;
    }

    // Rebuild month selector for the new year
    initializeMonthSelector();
    loadAnalyticsData();
}


document.addEventListener('DOMContentLoaded', function() {
    // Load real data first, then animate
    updateDashboardData();

    // Default analytics to current year (2026) and initialize month selector
    selectedAnalyticsYear = new Date().getFullYear();
    initializeMonthSelector();

    // Load conversation history
    loadConversationHistory();
    
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const clearChatBtn = document.getElementById('clearChatBtn');

    if (sendButton && chatInput) {
    sendButton.addEventListener('click', () => {
        const message = chatInput.value;
        if (message.trim()) {
            sendMessage(message);
            chatInput.value = '';
        }
    });
    }

    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the conversation history?')) {
                clearConversationHistory();
            }
        });
    }
    
    if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = chatInput.value;
            if (message.trim()) {
                sendMessage(message);
                chatInput.value = '';
            }
        }
    });
    }
    
    // Budget tab event listeners
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', addTransactionFromForm);
    }
    
    // Set today's date as default
    const dateInput = document.getElementById('dateInput');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    // Filter event listeners
    const categoryFilter = document.getElementById('categoryFilter');
    const typeFilter = document.getElementById('typeFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', loadTransactionsList);
    }
    if (typeFilter) {
        typeFilter.addEventListener('change', loadTransactionsList);
    }

    // Scan receipt event listeners
    const scanFileInput = document.getElementById('scanFile');
    const fileNameSpan = document.getElementById('fileName');
    if (scanFileInput && fileNameSpan) {
        scanFileInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                fileNameSpan.textContent = file.name;
            }
        });
    }
    
    const scanBtn = document.getElementById('scanBtn');
    if (scanBtn) scanBtn.addEventListener('click', scanReceiptFromFile);
    const addScannedBtn = document.getElementById('addScannedBtn');
    if (addScannedBtn) addScannedBtn.addEventListener('click', addScannedTransaction);
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const text = this.textContent;
            const tabName = text.includes('AI') ? 'chat'
                : text.includes('Budget') ? 'budget'
                : text.includes('Analytics') ? 'analytics'
                : 'goals';
            switchTab(this, tabName);
        });
    });
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    const showDashboardBtn = document.getElementById('showDashboardBtn');
    if (showDashboardBtn) showDashboardBtn.addEventListener('click', toggleSidebar);
    
    // Suggestion chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', function() {
            const text = this.textContent.trim();
            sendSuggestion(text);
        });
    });
    
    // Input section tabs
    const tabManual = document.getElementById('tabManual');
    const tabScan = document.getElementById('tabScan');
    if (tabManual) tabManual.addEventListener('click', () => switchInputSection('manual'));
    if (tabScan) tabScan.addEventListener('click', () => switchInputSection('scan'));
    
    // Monthly navigation
    const monthlySelector = document.querySelector('.monthly-selector');
    if (monthlySelector) {
        const prevBtn = monthlySelector.querySelector('button:first-child');
        const nextBtn = monthlySelector.querySelector('button:last-child');
        if (prevBtn) prevBtn.addEventListener('click', () => changeMonth(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => changeMonth(1));
    }
});

// ===== Scan Receipt (LLM) helpers =====
function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function scanReceiptFromFile() {
    const status = document.getElementById('scanStatus');
    const input = document.getElementById('scanFile');
    const file = input && input.files && input.files[0];
    if (!file) { 
        showNotification('Please choose an image file', 'error');
        return; 
    }
    
    try {
        if (status) status.textContent = 'Analyzing...';
        showNotification('Scanning receipt... This may take a moment', 'info');
        
        const dataURL = await fileToDataURL(file);
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
        
        const response = await fetch('/api/scan-receipt', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataURL, filename: file.name }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const res = await response.json();
        console.log('Scanner response:', res);
        
        if (!response.ok || !res.success) {
            throw new Error(res?.error || 'Scan failed');
        }

        // Client-side sanitation/fallbacks
        let outAmount = res.amount;
        let outMerchant = (typeof res.merchant === 'string') ? res.merchant : '';
        let outDate = res.date;
        
        console.log('Raw extraction:', { amount: outAmount, merchant: outMerchant, date: outDate });
        
        if (!outMerchant || (outMerchant.trim().startsWith('{') && res.raw_text)) {
            outMerchant = clientMerchantFromText(res.raw_text || '');
            console.log('Fallback merchant extraction:', outMerchant);
        }
        if ((!outAmount || outAmount < 5) && res.raw_text) {
            const cand = clientBestTotalFromText(res.raw_text);
            if (!isNaN(cand)) {
                outAmount = Number(cand.toFixed(2));
                console.log('Fallback amount extraction:', outAmount);
            }
        }

        document.getElementById('scanAmount').value = outAmount ?? '';
        document.getElementById('scanMerchant').value = outMerchant ?? '';
        document.getElementById('scanCategory').value = res.category ?? 'other';
        document.getElementById('scanDate').value = outDate ?? new Date().toISOString().slice(0,10);
        
        if (status) status.textContent = res.note || 'Scanned!';
        
        // Check results and notify user
        if (res.note && res.note.includes('dev mode')) {
            showNotification('⚠️ Vision AI works best in production. Please enter details manually for now.', 'error');
        } else if (!outAmount || outAmount === 0) {
            showNotification('⚠️ Could not extract amount. Please enter manually.', 'error');
        } else if (!outMerchant || outMerchant.length < 2) {
            showNotification('⚠️ Could not extract merchant. Please review and edit.', 'error');
        } else {
            showNotification(`✅ Scanned! Found $${outAmount} from "${outMerchant}". Please review before adding.`, 'success');
        }
    } catch (e) {
        console.error('Receipt scan error:', e);
        if (status) status.textContent = 'Scan failed';
        
        // Check if it was a timeout
        if (e.name === 'AbortError') {
            showNotification('⏱️ Scan timed out. AI service may be slow. Please enter details manually.', 'error');
        } else if (e.message.includes('fetch') || e.message.includes('network') || e.message.includes('Network')) {
            showNotification('❌ Network error. AI service unavailable. Please enter details manually.', 'error');
        } else {
            showNotification('❌ Scan failed: ' + (e?.message || 'Unknown error') + '. Please enter details manually.', 'error');
        }
        
        // Pre-fill with defaults so user can manually enter
        const today = new Date().toISOString().slice(0,10);
        if (!document.getElementById('scanDate').value) {
            document.getElementById('scanDate').value = today;
        }
    }
}

function clientBestTotalFromText(text) {
    if (!text || typeof text !== 'string') return NaN;
    const cands = [];
    const push = (n, s) => { if (!isNaN(n)) cands.push({ n, s }); };
    let m;
    const reLbl1 = /([A-Za-z ]{0,20})[: ]*([€$£]?\s*\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/gi;
    while ((m = reLbl1.exec(text)) !== null) {
        const lbl = (m[1] || '').toLowerCase();
        const n = parseFloat(m[2].replace(/[, ]/g,'.').replace(/[^0-9.]/g,''));
        let s = 0; if (/grand\s*total|total\b/.test(lbl)) s+=4; if (/subtotal/.test(lbl)) s+=2; if (/tax|vat|tip/.test(lbl)) s-=3; push(n,s);
    }
    const reLbl2 = /([€$£]?\s*\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*([A-Za-z ]{0,20})/gi;
    while ((m = reLbl2.exec(text)) !== null) {
        const lbl = (m[2] || '').toLowerCase();
        const n = parseFloat(m[1].replace(/[, ]/g,'.').replace(/[^0-9.]/g,''));
        let s = 0; if (/grand\s*total|total\b/.test(lbl)) s+=4; if (/subtotal/.test(lbl)) s+=2; if (/tax|vat|tip/.test(lbl)) s-=3; push(n,s);
    }
    const reBare = /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g;
    while ((m = reBare.exec(text)) !== null) {
        const n = parseFloat(m[1].replace(/[, ]/g,'.')); push(n,0);
    }
    if (cands.length === 0) return NaN;
    cands.sort((a,b)=> (b.s-a.s) || (b.n-a.n));
    return cands[0].n;
}

function clientMerchantFromText(text) {
    if (!text || typeof text !== 'string') return '';
    const lines = text.split(/\\r?\\n/).map(l=>l.trim()).filter(Boolean).slice(0,8);
    const cands = lines.filter(l=>/[A-Za-z]/.test(l) && l.length>=3);
    const prefer = cands.find(l=>/(foods?|market|store|restaurant|fast|chips|fish)/i.test(l));
    return (prefer || cands[0] || '').replace(/["']/g,'').trim();
}

async function addScannedTransaction() {
    const amountInput = document.getElementById('scanAmount');
    const descriptionInput = document.getElementById('scanMerchant');
    const categoryInput = document.getElementById('scanCategory');
    const dateInput = document.getElementById('scanDate');
    
    const amount = parseFloat(amountInput.value);
    const description = descriptionInput.value.trim();
    const category = categoryInput.value;
    const date = dateInput.value;
    
    // Better validation
    if (isNaN(amount) || amount <= 0) {
        showNotification('❌ Please enter a valid amount greater than 0', 'error');
        amountInput.focus();
        return;
    }
    if (!description || description.length < 2) {
        showNotification('❌ Please enter a description/merchant name', 'error');
        descriptionInput.focus();
        return;
    }
    if (!date) {
        showNotification('❌ Please select a date', 'error');
        dateInput.focus();
        return;
    }
    
    try {
        const response = await fetch('/api/add-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, description, category, type: 'expense', date })
        });
        const res = await response.json();
        if (!response.ok) throw new Error(res?.error || 'Failed');
        
        // Clear form
        amountInput.value = '';
        descriptionInput.value = '';
        dateInput.value = '';
        
        await updateDashboardData();
        await loadBudgetData();
        showNotification(`✅ Added $${amount.toFixed(2)} expense for "${description}"`, 'success');
    } catch (e) { 
        console.error('Add transaction error:', e);
        showNotification('Failed to add scanned expense: ' + (e?.message || 'Unknown error'), 'error'); 
    }
}

function switchInputSection(which) {
    const manual = document.getElementById('manualSection');
    const scan = document.getElementById('scanSection');
    const tabManual = document.getElementById('tabManual');
    const tabScan = document.getElementById('tabScan');
    if (!manual || !scan || !tabManual || !tabScan) return;
    if (which === 'manual') {
        manual.style.display = 'block';
        scan.style.display = 'none';
        tabManual.style.background = '#667eea';
        tabManual.style.color = '#fff';
        tabManual.style.borderColor = '#667eea';
        tabScan.style.background = 'rgba(0,0,0,0.05)';
        tabScan.style.color = '#2d3748';
        tabScan.style.borderColor = 'rgba(0,0,0,0.1)';
    } else {
        manual.style.display = 'none';
        scan.style.display = 'block';
        tabScan.style.background = '#667eea';
        tabScan.style.color = '#fff';
        tabScan.style.borderColor = '#667eea';
        tabManual.style.background = 'rgba(0,0,0,0.05)';
        tabManual.style.color = '#2d3748';
        tabManual.style.borderColor = 'rgba(0,0,0,0.1)';
    }
}

// ===== Scan Receipt (LLM) helpers =====

// ===== DARK MODE =====
(function() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        const btn = document.getElementById('darkModeToggle');
        if (btn) btn.textContent = '☀️';
    }
})();

document.addEventListener('DOMContentLoaded', function() {
    const dmBtn = document.getElementById('darkModeToggle');
    if (dmBtn) {
        dmBtn.addEventListener('click', function() {
            const isDark = document.body.classList.toggle('dark-mode');
            this.textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('darkMode', isDark);
        });
    }

    // ===== ALERT BELL =====
    const bellBtn = document.getElementById('alertBellBtn');
    if (bellBtn) {
        bellBtn.addEventListener('click', async function() {
            const panel = document.getElementById('alertPanel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            if (panel.style.display === 'block') await loadAlertHistory();
        });
    }

    // ===== EXPORT CSV =====
    const exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportTransactionsCSV);
    }

    // ===== SEARCH / FILTERS =====
    ['searchInput','minAmount','maxAmount','dateFrom','dateTo','recurringFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', loadTransactionsList);
    });

    // ===== GOALS TAB =====
    const addGoalBtn = document.getElementById('addGoalBtn');
    if (addGoalBtn) addGoalBtn.addEventListener('click', () => {
        const form = document.getElementById('addGoalForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    const saveGoalBtn = document.getElementById('saveGoalBtn');
    if (saveGoalBtn) saveGoalBtn.addEventListener('click', saveGoal);

    // ===== AI AUTOSUGGEST =====
    initCategoryAutosuggest();

    // ===== NET WORTH =====
    const addAssetBtn = document.getElementById('addAssetBtn');
    if (addAssetBtn) addAssetBtn.addEventListener('click', () => addNetWorthItem('asset'));
    const addLiabilityBtn = document.getElementById('addLiabilityBtn');
    if (addLiabilityBtn) addLiabilityBtn.addEventListener('click', () => addNetWorthItem('liability'));
    const saveNetWorthBtn = document.getElementById('saveNetWorthBtn');
    if (saveNetWorthBtn) saveNetWorthBtn.addEventListener('click', saveNetWorth);
});

// ===== EXPORT CSV =====
function exportTransactionsCSV() {
    if (!allTransactions || allTransactions.length === 0) {
        showNotification('No transactions to export', 'error');
        return;
    }
    const headers = ['Date','Description','Category','Type','Amount'];
    const rows = allTransactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(t => [
            t.date || new Date(t.timestamp).toISOString().split('T')[0],
            '"' + (t.description || '').replace(/"/g, '""') + '"',
            t.category,
            t.type,
            t.amount.toFixed(2)
        ].join(','));
    const csv = [headers.join(','), ...rows].join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions-' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('CSV exported!', 'success');
}

// ===== ALERT HISTORY =====
async function loadAlertHistory() {
    const container = document.getElementById('alertList');
    try {
        const res = await fetch('/api/alerts');
        const data = await res.json();
        const badge = document.getElementById('alertBadge');
        if (data.alerts && data.alerts.length > 0) {
            if (badge) badge.style.display = 'block';
            container.innerHTML = data.alerts.map(a => {
                const color = a.severity === 'error' ? '#f56565' : '#ed8936';
                const icon = a.severity === 'error' ? '🚨' : '⚠️';
                return '<div style="padding:12px;border-left:4px solid ' + color + ';background:#f7fafc;border-radius:8px;margin-bottom:10px;">' +
                    '<div style="font-weight:600;color:#2d3748;margin-bottom:4px;">' + icon + ' ' + a.month + '</div>' +
                    '<div style="font-size:0.9rem;color:#4a5568;">' + a.message + '</div>' +
                    '<div style="font-size:0.8rem;color:#718096;margin-top:4px;">Spent: $' + a.spent.toFixed(2) + ' / Budget: $' + a.limit.toFixed(2) + '</div>' +
                '</div>';
            }).join('');
        } else {
            if (badge) badge.style.display = 'none';
            container.innerHTML = '<p style="color:#718096;text-align:center;padding:2rem 0;">No alerts. You are on track! \u2705</p>';
        }
    } catch (e) {
        container.innerHTML = '<p style="color:#f56565;text-align:center;">Failed to load alerts.</p>';
    }
}

// ===== GOALS =====
let netWorthData = { assets: [], liabilities: [] };

async function loadGoalsTab() {
    await Promise.all([loadGoals(), loadNetWorthData()]);
}

async function loadGoals() {
    const container = document.getElementById('goalsList');
    try {
        const res = await fetch('/api/goals');
        const data = await res.json();
        if (!data.goals || data.goals.length === 0) {
            container.innerHTML = '<p style="color:#718096;text-align:center;padding:2rem 0;">No goals yet. Add one above!</p>';
            return;
        }
        // Get net savings from summary for monthly rate
        let monthlySavings = 0;
        try {
            const sumRes = await fetch('/api/get-summary');
            const sumData = await sumRes.json();
            monthlySavings = Math.max(0, sumData.monthlyIncome - sumData.monthlyExpenses);
        } catch(e) {}

        container.innerHTML = data.goals.map(g => {
            const pct = Math.min((g.current / g.target) * 100, 100);
            const remaining = Math.max(0, g.target - g.current);
            const monthsLeft = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : null;
            const deadlineStr = g.deadline ? ' · Due ' + new Date(g.deadline).toLocaleDateString('en-US', {month:'short',year:'numeric'}) : '';
            return `<div style="background:#f7fafc;border-radius:12px;padding:1rem;margin-bottom:0.75rem;position:relative;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <div>
                        <div style="font-weight:700;color:#2d3748;">${g.name}</div>
                        <div style="font-size:0.8rem;color:#718096;">$${g.current.toFixed(0)} of $${g.target.toFixed(0)}${deadlineStr}</div>
                    </div>
                    <div style="display:flex;gap:6px;align-items:center;">
                        <button onclick="toggleGoalAdvice('${g.id}', this)" style="padding:4px 10px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.75rem;font-weight:600;">🤖 AI Advice</button>
                        <button onclick="deleteGoal('${g.id}')" style="background:none;border:none;color:#f56565;cursor:pointer;font-size:1.1rem;">🗑</button>
                    </div>
                </div>
                <div style="background:#e2e8f0;height:8px;border-radius:4px;margin:0.75rem 0;">
                    <div style="background:linear-gradient(135deg,#667eea,#764ba2);height:100%;width:${pct.toFixed(1)}%;border-radius:4px;transition:width 0.5s;"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:#718096;">
                    <span>${pct.toFixed(1)}% complete</span>
                    <span>${monthsLeft !== null ? '~' + monthsLeft + ' months to go' : '$' + remaining.toFixed(0) + ' remaining'}</span>
                </div>
                <div id="goalAdvice_${g.id}" style="display:none;margin-top:0.75rem;padding:0.75rem;background:linear-gradient(135deg,rgba(102,126,234,0.08),rgba(118,75,162,0.08));border-radius:8px;border-left:3px solid #667eea;font-size:0.85rem;color:#2d3748;line-height:1.6;"></div>
            </div>`;
        }).join('');
    } catch(e) {
        container.innerHTML = '<p style="color:#f56565;">Failed to load goals.</p>';
    }
}

async function saveGoal() {
    const name = document.getElementById('goalName').value.trim();
    const target = parseFloat(document.getElementById('goalTarget').value);
    const current = parseFloat(document.getElementById('goalCurrent').value) || 0;
    const deadline = document.getElementById('goalDeadline').value;
    if (!name || !target) { showNotification('Please enter a name and target amount', 'error'); return; }
    await fetch('/api/goals', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name, target, current, deadline })
    });
    document.getElementById('addGoalForm').style.display = 'none';
    document.getElementById('goalName').value = '';
    document.getElementById('goalTarget').value = '';
    document.getElementById('goalCurrent').value = '';
    document.getElementById('goalDeadline').value = '';
    showNotification('Goal saved!', 'success');
    await loadGoals();
}

async function deleteGoal(id) {
    await fetch('/api/goals/delete', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ id })
    });
    showNotification('Goal deleted', 'info');
    await loadGoals();
}

// ===== NET WORTH =====
async function loadNetWorthData() {
    try {
        const res = await fetch('/api/net-worth');
        const data = await res.json();
        netWorthData = { assets: data.assets || [], liabilities: data.liabilities || [] };
        renderNetWorth();
    } catch(e) { renderNetWorth(); }
}

function renderNetWorth() {
    const assetsList = document.getElementById('assetsList');
    const liabilitiesList = document.getElementById('liabilitiesList');
    const totalEl = document.getElementById('netWorthTotal');
    const totalAssets = netWorthData.assets.reduce((s, a) => s + a.amount, 0);
    const totalLiab = netWorthData.liabilities.reduce((s, l) => s + l.amount, 0);
    const net = totalAssets - totalLiab;
    if (totalEl) totalEl.textContent = (net >= 0 ? '+' : '') + '$' + net.toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0});
    if (assetsList) assetsList.innerHTML = netWorthData.assets.length === 0
        ? '<p style="color:#718096;font-size:0.85rem;">No assets added</p>'
        : netWorthData.assets.map((a, i) => '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:0.88rem;">' +
            '<span style="color:#2d3748;">' + a.name + '</span>' +
            '<span style="color:#48bb78;font-weight:600;">+$' + a.amount.toLocaleString() + '</span>' +
            '<button onclick="removeNetWorthItem(&quot;asset&quot;,' + i + ')" style="background:none;border:none;color:#f56565;cursor:pointer;font-size:0.85rem;">&#x2715;</button>' +
        '</div>').join('');
    if (liabilitiesList) liabilitiesList.innerHTML = netWorthData.liabilities.length === 0
        ? '<p style="color:#718096;font-size:0.85rem;">No liabilities added</p>'
        : netWorthData.liabilities.map((l, i) => '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:0.88rem;">' +
            '<span style="color:#2d3748;">' + l.name + '</span>' +
            '<span style="color:#f56565;font-weight:600;">-$' + l.amount.toLocaleString() + '</span>' +
            '<button onclick="removeNetWorthItem(&quot;liability&quot;,' + i + ')" style="background:none;border:none;color:#f56565;cursor:pointer;font-size:0.85rem;">&#x2715;</button>' +
        '</div>').join('');
}

function addNetWorthItem(type) {
    const nameEl = document.getElementById(type === 'asset' ? 'assetName' : 'liabilityName');
    const amountEl = document.getElementById(type === 'asset' ? 'assetAmount' : 'liabilityAmount');
    const name = nameEl.value.trim();
    const amount = parseFloat(amountEl.value);
    if (!name || !amount) { showNotification('Enter name and amount', 'error'); return; }
    netWorthData[type === 'asset' ? 'assets' : 'liabilities'].push({ name, amount });
    nameEl.value = ''; amountEl.value = '';
    renderNetWorth();
}

function removeNetWorthItem(type, index) {
    netWorthData[type === 'asset' ? 'assets' : 'liabilities'].splice(index, 1);
    renderNetWorth();
}

async function saveNetWorth() {
    await fetch('/api/net-worth', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(netWorthData)
    });
    showNotification('Net worth saved!', 'success');
}

// ===== SPENDING FORECAST =====
function loadSpendingForecast(transactions, budgets) {
    const container = document.getElementById('spendingForecast');
    if (!container) return;
    const now = new Date();
    const daysElapsed = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    let monthSpent = 0;
    const catSpent = {};
    transactions.forEach(t => {
        if (t.type === 'expense' && t.date && t.date.startsWith(ym)) {
            monthSpent += t.amount;
            catSpent[t.category] = (catSpent[t.category] || 0) + t.amount;
        }
    });
    const dailyRate = monthSpent / daysElapsed;
    const projected = dailyRate * daysInMonth;
    const daysLeft = daysInMonth - daysElapsed;
    const budgetLeft = Object.values(budgets).reduce((s, v) => s + v, 0) - monthSpent;
    const atRisk = Object.entries(catSpent).filter(([cat, spent]) => {
        const proj = (spent / daysElapsed) * daysInMonth;
        return proj > (budgets[cat] || 500);
    });

    container.innerHTML =
        '<div style="text-align:center;padding:1rem;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;color:white;margin-bottom:1rem;">' +
            '<div style="font-size:1.8rem;font-weight:800;">$' + projected.toFixed(0) + '</div>' +
            '<div style="opacity:0.85;font-size:0.85rem;">Projected month-end spend</div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;font-size:0.88rem;color:#4a5568;margin-bottom:0.75rem;">' +
            '<span>📅 ' + daysLeft + ' days left</span>' +
            '<span>💸 $' + dailyRate.toFixed(0) + '/day avg</span>' +
            '<span>' + (budgetLeft >= 0 ? '✅ $' + budgetLeft.toFixed(0) + ' buffer' : '🚨 $' + Math.abs(budgetLeft).toFixed(0) + ' over') + '</span>' +
        '</div>' +
        (atRisk.length > 0
            ? '<div style="font-size:0.85rem;font-weight:600;color:#ed8936;margin-bottom:0.5rem;">⚠️ At risk of exceeding budget:</div>' +
              atRisk.map(([cat]) => '<div style="font-size:0.82rem;color:#718096;padding:2px 0;">• ' + cat.charAt(0).toUpperCase() + cat.slice(1) + '</div>').join('')
            : '<div style="font-size:0.85rem;color:#48bb78;font-weight:600;">✅ All categories on track</div>');
}

// ===== SPENDING HEATMAP =====
function loadSpendingHeatmap(transactions, targetMonth, targetYear) {
    const container = document.getElementById('spendingHeatmap');
    if (!container) return;
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const firstDay = new Date(targetYear, targetMonth, 1).getDay();
    const ym = targetYear + '-' + String(targetMonth + 1).padStart(2, '0');
    const dailySpend = {};
    transactions.forEach(t => {
        if (t.type === 'expense' && t.date && t.date.startsWith(ym)) {
            const day = parseInt(t.date.split('-')[2]);
            dailySpend[day] = (dailySpend[day] || 0) + t.amount;
        }
    });
    const maxSpend = Math.max(...Object.values(dailySpend), 1);
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    let html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;font-size:0.72rem;">';
    days.forEach(d => { html += '<div style="text-align:center;color:#718096;font-weight:600;padding:2px;">' + d + '</div>'; });
    for (let i = 0; i < firstDay; i++) html += '<div></div>';
    for (let d = 1; d <= daysInMonth; d++) {
        const spent = dailySpend[d] || 0;
        const intensity = spent / maxSpend;
        const r = Math.round(102 + intensity * 153);
        const g = Math.round(126 - intensity * 80);
        const b = Math.round(234 - intensity * 180);
        const bg = spent === 0 ? '#f0f4ff' : 'rgb(' + r + ',' + g + ',' + b + ')';
        const textColor = intensity > 0.5 ? 'white' : '#2d3748';
        html += '<div title="' + (spent > 0 ? '$' + spent.toFixed(0) : 'No spend') + '" style="aspect-ratio:1;background:' + bg + ';border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:default;transition:transform 0.15s;" onmouseover="this.style.transform=\'scale(1.15)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
            '<div style="color:' + textColor + ';font-weight:600;">' + d + '</div>' +
            (spent > 0 ? '<div style="color:' + textColor + ';font-size:0.65rem;opacity:0.9;">$' + spent.toFixed(0) + '</div>' : '') +
        '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
}

// ===== MONTH-OVER-MONTH COMPARISON (patch into loadCategoryAnalytics) =====
function loadCategoryAnalyticsWithComparison(categoryBreakdown, targetMonth, targetYear) {
    const container = document.getElementById('categoryChart');
    const total = Object.values(categoryBreakdown).reduce((s, a) => s + a, 0);
    if (total === 0) {
        container.innerHTML = '<p style="text-align:center;color:#718096;padding:2rem;">No spending data for this month</p>';
        return;
    }
    // Previous month breakdown
    const prevMonth = targetMonth === 0 ? 11 : targetMonth - 1;
    const prevYear = targetMonth === 0 ? targetYear - 1 : targetYear;
    const prevYm = prevYear + '-' + String(prevMonth + 1).padStart(2, '0');
    const prevBreakdown = {};
    allTransactions.forEach(t => {
        if (t.type === 'expense' && t.date && t.date.startsWith(prevYm)) {
            prevBreakdown[t.category] = (prevBreakdown[t.category] || 0) + t.amount;
        }
    });
    container.innerHTML = Object.entries(categoryBreakdown)
        .sort(([,a],[,b]) => b - a)
        .map(([cat, amount]) => {
            const pct = ((amount / total) * 100).toFixed(1);
            const prev = prevBreakdown[cat] || 0;
            const delta = amount - prev;
            const deltaStr = prev === 0 ? '' : (delta >= 0 ? ' <span style="color:#f56565;font-size:0.8rem;">↑ $' + delta.toFixed(0) + '</span>' : ' <span style="color:#48bb78;font-size:0.8rem;">↓ $' + Math.abs(delta).toFixed(0) + '</span>');
            const cap = cat.charAt(0).toUpperCase() + cat.slice(1);
            return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(102,126,234,0.08);border-radius:8px;margin-bottom:6px;">' +
                '<span style="font-weight:600;color:#2d3748;">' + cap + '</span>' +
                '<span style="color:#4a5568;font-weight:600;">$' + amount.toFixed(2) + ' (' + pct + ')' + deltaStr + '</span>' +
            '</div>';
        }).join('');
}

// ===== AI AUTO-CATEGORIZER =====
let categoryDebounceTimer = null;

function initCategoryAutosuggest() {
    const descInput = document.getElementById('descriptionInput');
    if (!descInput) return;
    descInput.addEventListener('input', function() {
        clearTimeout(categoryDebounceTimer);
        const val = this.value.trim();
        const suggestionEl = document.getElementById('categorySuggestion');
        if (!val || val.length < 3) {
            if (suggestionEl) suggestionEl.style.display = 'none';
            return;
        }
        categoryDebounceTimer = setTimeout(async () => {
            try {
                const res = await fetch('/api/suggest-category', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({ description: val })
                });
                const data = await res.json();
                const cat = data.category;
                const suggestedCat = document.getElementById('suggestedCat');
                if (suggestionEl && suggestedCat && cat && cat !== 'other') {
                    const labels = {food:'🍕 Food',transportation:'🚗 Transportation',housing:'🏠 Housing',entertainment:'🎬 Entertainment',shopping:'🛍️ Shopping',healthcare:'🏥 Healthcare',income:'💰 Income'};
                    suggestedCat.textContent = labels[cat] || cat;
                    suggestionEl.style.display = 'block';
                    suggestedCat.onclick = function() {
                        const sel = document.getElementById('categoryInput');
                        if (sel) sel.value = cat;
                        suggestionEl.style.display = 'none';
                        showNotification('Category set to ' + (labels[cat] || cat), 'success');
                    };
                }
            } catch(e) {}
        }, 600);
    });
}

// ===== AI ANOMALY DETECTION =====
async function loadAnomalies() {
    const container = document.getElementById('anomalyList');
    if (!container) return;
    try {
        const res = await fetch('/api/anomalies');
        const data = await res.json();
        if (!data.anomalies || data.anomalies.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:#48bb78;padding:1.5rem;font-weight:600;">✅ No unusual transactions detected this month. Your spending looks normal!</div>';
            return;
        }
        container.innerHTML = data.anomalies.map(a => {
            const severity = a.ratio >= 4 ? '#f56565' : '#ed8936';
            const icon = a.ratio >= 4 ? '🚨' : '⚠️';
            return '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-left:4px solid ' + severity + ';background:rgba(245,101,101,0.05);border-radius:8px;margin-bottom:8px;">' +
                '<div>' +
                    '<div style="font-weight:600;color:#2d3748;">' + icon + ' ' + a.description + '</div>' +
                    '<div style="font-size:0.82rem;color:#718096;margin-top:2px;">' + a.message + '</div>' +
                '</div>' +
                '<div style="text-align:right;min-width:80px;">' +
                    '<div style="font-weight:800;color:' + severity + ';">$' + a.amount.toFixed(2) + '</div>' +
                    '<div style="font-size:0.75rem;color:#718096;">' + a.ratio.toFixed(1) + 'x avg</div>' +
                '</div>' +
            '</div>';
        }).join('');
    } catch(e) {
        container.innerHTML = '<p style="color:#718096;text-align:center;padding:1rem;">Could not load anomalies.</p>';
    }
}

// ===== AI GOAL ADVISOR =====
async function fetchGoalAdvice(goal) {
    const adviceKey = 'goalAdvice_v2_' + goal.id;
    const cached = sessionStorage.getItem(adviceKey);
    if (cached) return cached;

    try {
        const sumRes = await fetch('/api/get-summary');
        const sumData = await sumRes.json();
        const monthlySavings = Math.max(0, sumData.monthlyIncome - sumData.monthlyExpenses);

        // Build category breakdown from last 30 days
        const now = new Date();
        const ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
        const catBreakdown = {};
        (sumData.transactions || []).forEach(t => {
            if (t.type === 'expense' && t.date && t.date.startsWith(ym)) {
                catBreakdown[t.category] = (catBreakdown[t.category] || 0) + t.amount;
            }
        });

        const res = await fetch('/api/goal-advice', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
                goal,
                categoryBreakdown: catBreakdown,
                monthlySavings,
                monthlyIncome: sumData.monthlyIncome
            })
        });
        const data = await res.json();
        const advice = data.advice || 'No advice available.';
        if (data.success) sessionStorage.setItem(adviceKey, advice);
        return advice;
    } catch(e) {
        return 'Could not generate advice right now.';
    }
}

// ===== GOAL ADVICE TOGGLE =====
async function toggleGoalAdvice(goalId, btn) {
    const panel = document.getElementById('goalAdvice_' + goalId);
    if (!panel) return;
    if (panel.style.display !== 'none') {
        panel.style.display = 'none';
        return;
    }
    panel.style.display = 'block';
    panel.innerHTML = '<span style="color:#667eea;">🤖 Generating personalized advice...</span>';

    // Fetch the goal details
    const res = await fetch('/api/goals');
    const data = await res.json();
    const goal = (data.goals || []).find(g => g.id === goalId);
    if (!goal) { panel.innerHTML = 'Goal not found.'; return; }

    const advice = await fetchGoalAdvice(goal);
    // Format numbered lines
    const formatted = advice.split('\n').map(line => line.trim()).filter(Boolean)
        .map(line => '<div style="margin-bottom:0.4rem;">' + line + '</div>').join('');
    panel.innerHTML = '<div style="font-weight:600;color:#667eea;margin-bottom:0.5rem;">💡 AI Recommendations:</div>' + formatted;
}

// ===== RECURRING TRANSACTIONS =====
const RECURRING_KEYWORDS = ['rent','netflix','spotify','disney','gym','subscription','salary','insurance','internet','phone','electric','utilities','amazon prime','hulu'];

function isRecurring(t) {
    const desc = (t.description || '').toLowerCase();
    return RECURRING_KEYWORDS.some(k => desc.includes(k));
}
