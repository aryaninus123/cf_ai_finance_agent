interface Env {
  AI: any;
  FinanceAgent: DurableObjectNamespace;
}

export class FinanceAgent {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  private async ensureInitialized() {
    // Using key-value storage - no initialization needed
    // This method is kept for compatibility but does nothing
    return;
  }


  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Serve the main HTML page
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return this.serveHTML();
    }
    
    // Serve CSS
    if (url.pathname === '/enhanced-styles.css') {
      return this.serveCSS();
    }
    
    // Serve JS
    if (url.pathname === '/enhanced-app.js') {
      return this.serveJS();
    }
    
    // API endpoints
    if (url.pathname === '/api/advice') {
      return this.getAIAdvice(request);
    }
    
    if (url.pathname === '/api/add-transaction') {
      return this.addTransaction(request);
    }
    
    if (url.pathname === '/api/get-summary') {
      return this.getSummary(request);
    }
    
    if (url.pathname === '/api/set-budget' && request.method === 'POST') {
      return this.setBudget(request);
    }
    
    if (url.pathname === '/api/get-budgets') {
      return this.getBudgets(request);
    }
    
    return new Response('Not Found', { status: 404 });
  }

  private async serveHTML(): Promise<Response> {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Personal Finance Assistant</title>
    <link rel="stylesheet" href="/enhanced-styles.css">
</head>
<body>
    <div class="background-effects">
        <div class="floating-shape"></div>
        <div class="floating-shape"></div>
        <div class="floating-shape"></div>
    </div>

    <div class="container">
        <div class="sidebar">
            <div class="logo">
                <h2>💰 Finance AI</h2>
            </div>
            
            <div class="dashboard-section">
                <h3>Dashboard</h3>
                <div class="stat-card">
                    <div class="stat-value" id="balance">$0</div>
                    <div class="stat-label">Balance</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="expenses">$0</div>
                    <div class="stat-label">This Month</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="savings">$0</div>
                    <div class="stat-label">Savings</div>
                </div>
            </div>
        </div>

        <div class="main-content">
            <!-- Tab Navigation -->
            <div class="tab-navigation">
                <button class="tab-btn active" onclick="switchTab('chat')">💬 AI Assistant</button>
                <button class="tab-btn" onclick="switchTab('budget')">📊 Budget Manager</button>
                <button class="tab-btn" onclick="switchTab('analytics')">📈 Analytics</button>
            </div>

            <!-- Chat Tab -->
            <div id="chatTab" class="tab-content active">
                <div class="chat-container">
                    <div class="chat-header">
                        <h1>Your AI Financial Assistant</h1>
                        <p>I have access to all your financial data and can provide intelligent insights!</p>
                    </div>
                    
                    <div class="chat-messages" id="chatMessages">
                    <div class="message ai-message">
                        <div class="message-content">
                            <p>👋 Hello! I'm your AI-powered financial assistant. I can help you:</p>
                            <ul>
                                <li>Track your expenses and income</li>
                                <li>Set and monitor budgets</li>
                                <li>Provide personalized financial advice</li>
                                <li>Give investment recommendations</li>
                            </ul>
                            <p>What would you like to do today?</p>
                        </div>
                    </div>
                </div>
                
                <div class="suggestion-chips">
                    <button class="chip" onclick="sendSuggestion('Add expense')">Add Expense</button>
                    <button class="chip" onclick="sendSuggestion('Set budget')">Set Budget</button>
                    <button class="chip" onclick="sendSuggestion('Financial advice')">Get Advice</button>
                    <button class="chip" onclick="sendSuggestion('Investment tips')">Investment Tips</button>
                </div>
                
                    <div class="chat-input-container">
                        <input type="text" id="chatInput" placeholder="Type your message..." />
                        <button id="sendButton">Send</button>
                    </div>
                </div>
            </div>

            <!-- Budget Tab -->
            <div id="budgetTab" class="tab-content">
                <div class="budget-container">
                    <div class="budget-header">
                        <h1>Budget Manager</h1>
                        <p>Manage your expenses, set budgets, and track spending by category</p>
                    </div>

                    <div class="budget-controls">
                        <div class="add-transaction-form">
                            <h3>Add New Transaction</h3>
                            <div class="form-row">
                                <input type="number" id="amountInput" placeholder="Amount" step="0.01">
                                <input type="text" id="descriptionInput" placeholder="Description">
                                <select id="categoryInput">
                                    <option value="food">🍕 Food</option>
                                    <option value="transportation">🚗 Transportation</option>
                                    <option value="housing">🏠 Housing</option>
                                    <option value="entertainment">🎬 Entertainment</option>
                                    <option value="shopping">🛍️ Shopping</option>
                                    <option value="healthcare">🏥 Healthcare</option>
                                    <option value="other">📦 Other</option>
                                </select>
                                <select id="typeInput">
                                    <option value="expense">💸 Expense</option>
                                    <option value="income">💰 Income</option>
                                </select>
                                <button id="addTransactionBtn">Add</button>
                            </div>
                        </div>
                    </div>

                    <div class="budget-overview">
                        <div class="monthly-selector">
                            <button onclick="changeMonth(-1)">‹</button>
                            <span id="currentMonth">September 2025</span>
                            <button onclick="changeMonth(1)">›</button>
                        </div>
                        
                        <div class="category-budgets" id="categoryBudgets">
                            <!-- Category budget cards will be populated here -->
                        </div>
                    </div>

                    <div class="transactions-list">
                        <h3>Recent Transactions</h3>
                        <div class="transaction-filters">
                            <select id="categoryFilter">
                                <option value="all">All Categories</option>
                                <option value="food">Food</option>
                                <option value="transportation">Transportation</option>
                                <option value="housing">Housing</option>
                                <option value="entertainment">Entertainment</option>
                                <option value="shopping">Shopping</option>
                                <option value="healthcare">Healthcare</option>
                                <option value="other">Other</option>
                            </select>
                            <select id="typeFilter">
                                <option value="all">All Types</option>
                                <option value="expense">Expenses</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                        <div id="transactionsList" class="transactions-container">
                            <!-- Transactions will be populated here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Analytics Tab -->
            <div id="analyticsTab" class="tab-content">
                <div class="analytics-container">
                    <div class="analytics-header">
                        <h1>Financial Analytics</h1>
                        <p>Insights and trends from your financial data</p>
                    </div>
                    
                    <div class="analytics-grid">
                        <div class="analytics-card">
                            <h3>Monthly Spending Trend</h3>
                            <div id="spendingChart" class="chart-placeholder">
                                <p>📊 Chart coming soon...</p>
                            </div>
                        </div>
                        
                        <div class="analytics-card">
                            <h3>Category Breakdown</h3>
                            <div id="categoryChart" class="category-breakdown">
                                <!-- Will be populated with category data -->
                            </div>
                        </div>
                        
                        <div class="analytics-card">
                            <h3>Budget Performance</h3>
                            <div id="budgetPerformance" class="budget-metrics">
                                <!-- Will show budget vs actual spending -->
                            </div>
                        </div>
                        
                        <div class="analytics-card">
                            <h3>AI Insights</h3>
                            <div id="aiInsights" class="insights-container">
                                <p>💡 Getting personalized insights...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    <script src="/enhanced-app.js"></script>
</body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  private async serveCSS(): Promise<Response> {
    const css = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    overflow-x: hidden;
}

.background-effects {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: -1;
}

.floating-shape {
    position: absolute;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    animation: float 20s infinite linear;
}

.floating-shape:nth-child(1) {
    width: 80px;
    height: 80px;
    top: 20%;
    left: 10%;
    animation-delay: 0s;
}

.floating-shape:nth-child(2) {
    width: 120px;
    height: 120px;
    top: 60%;
    right: 15%;
    animation-delay: 7s;
}

.floating-shape:nth-child(3) {
    width: 60px;
    height: 60px;
    bottom: 20%;
    left: 70%;
    animation-delay: 14s;
}

@keyframes float {
    0% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
    50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
    100% { transform: translateY(0px) rotate(360deg); opacity: 0.7; }
}

.container {
    display: flex;
    min-height: 100vh;
}

.sidebar {
    width: 300px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 2rem;
    box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
}

.logo h2 {
    color: #4a5568;
    margin-bottom: 2rem;
    text-align: center;
}

.dashboard-section h3 {
    color: #2d3748;
    margin-bottom: 1rem;
    font-size: 1.2rem;
}

.stat-card {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 15px;
    margin-bottom: 1rem;
    text-align: center;
    transition: transform 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-5px);
}

.stat-value {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.stat-label {
    font-size: 0.9rem;
    opacity: 0.9;
}

.main-content {
    flex: 1;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* Tab Navigation */
.tab-navigation {
    display: flex;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 15px 15px 0 0;
    padding: 10px;
    gap: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    margin-bottom: 0;
}

.tab-btn {
    padding: 12px 20px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
}

.tab-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.tab-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

/* Tab Content */
.tab-content {
    display: none;
    flex: 1;
    overflow-y: auto;
}

.tab-content.active {
    display: flex;
    flex-direction: column;
}

.chat-container {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    height: calc(100vh - 4rem);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.chat-header {
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
}

.chat-header h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.chat-messages {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
}

.message {
    margin-bottom: 1.5rem;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.message-content {
    max-width: 70%;
    padding: 1rem 1.5rem;
    border-radius: 20px;
    line-height: 1.5;
}

.ai-message .message-content {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    margin-left: 0;
}

.user-message .message-content {
    background: #f7fafc;
    color: #2d3748;
    margin-left: auto;
    border: 1px solid #e2e8f0;
}

.suggestion-chips {
    padding: 1rem 2rem;
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.chip {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.3s ease;
}

.chip:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
}

.chat-input-container {
    padding: 2rem;
    background: #f8f9fa;
    display: flex;
    gap: 1rem;
}

#chatInput {
    flex: 1;
    padding: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 25px;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.3s ease;
}

#chatInput:focus {
    border-color: #667eea;
}

#sendButton {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 25px;
    cursor: pointer;
    font-size: 1rem;
    transition: transform 0.3s ease;
}

#sendButton:hover {
    transform: translateY(-2px);
}

.typing-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.typing-dots {
    display: flex;
    gap: 0.25rem;
}

.typing-dot {
    width: 8px;
    height: 8px;
    background: #667eea;
    border-radius: 50%;
    animation: typing 1.4s infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-10px); }
}

@media (max-width: 768px) {
    .container {
        flex-direction: column;
    }
    
    .sidebar {
        width: 100%;
        padding: 1rem;
    }
    
    .main-content {
        padding: 1rem;
    }
    
    .chat-container {
        height: calc(100vh - 300px);
    }
}

/* Budget Manager Styles */
.budget-container {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 0 0 20px 20px;
    height: calc(100vh - 6rem);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.budget-header {
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 0 0 20px 20px;
    margin-bottom: 2rem;
}

.budget-header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
}

.budget-header p {
    margin: 0;
    opacity: 0.9;
}

.budget-controls {
    padding: 0 2rem 2rem;
}

.add-transaction-form {
    background: rgba(255, 255, 255, 0.8);
    padding: 1.5rem;
    border-radius: 15px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.add-transaction-form h3 {
    margin: 0 0 1rem 0;
    color: #2d3748;
}

.form-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.form-row input, .form-row select, .form-row button {
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.form-row input:focus, .form-row select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-row button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    cursor: pointer;
    font-weight: 600;
}

.form-row button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.budget-overview {
    padding: 0 2rem 2rem;
}

.monthly-selector {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
}

.monthly-selector button {
    background: rgba(102, 126, 234, 0.1);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    font-size: 1.2rem;
    color: #667eea;
    transition: all 0.3s ease;
}

.monthly-selector button:hover {
    background: rgba(102, 126, 234, 0.2);
    transform: scale(1.1);
}

.monthly-selector span {
    font-size: 1.3rem;
    font-weight: 600;
    color: #2d3748;
}

.category-budgets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.budget-card {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 15px;
    box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
}

.transactions-list {
    padding: 0 2rem 2rem;
}

.transactions-list h3 {
    color: #2d3748;
    margin-bottom: 1rem;
}

.transaction-filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

.transaction-filters select {
    padding: 8px 12px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    background: white;
}

.transactions-container {
    background: rgba(255, 255, 255, 0.8);
    border-radius: 15px;
    max-height: 400px;
    overflow-y: auto;
}

.transaction-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.transaction-item:last-child {
    border-bottom: none;
}

.transaction-info {
    display: flex;
    flex-direction: column;
}

.transaction-description {
    font-weight: 600;
    color: #2d3748;
}

.transaction-category {
    font-size: 0.9rem;
    color: #718096;
}

.transaction-amount {
    font-weight: 600;
    font-size: 1.1rem;
}

.transaction-amount.expense {
    color: #e53e3e;
}

.transaction-amount.income {
    color: #38a169;
}

/* Analytics Styles */
.analytics-container {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 0 0 20px 20px;
    height: calc(100vh - 6rem);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.analytics-header {
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 0 0 20px 20px;
    margin-bottom: 2rem;
}

.analytics-header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
}

.analytics-header p {
    margin: 0;
    opacity: 0.9;
}

.analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    padding: 0 2rem 2rem;
}

.analytics-card {
    background: rgba(255, 255, 255, 0.8);
    padding: 1.5rem;
    border-radius: 15px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.analytics-card h3 {
    margin: 0 0 1rem 0;
    color: #2d3748;
}

.chart-placeholder {
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 10px;
    color: #667eea;
}

.category-breakdown {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.category-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 8px;
}

.budget-metrics {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.budget-metric {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(79, 172, 254, 0.1);
    border-radius: 10px;
}

.insights-container {
    background: rgba(118, 75, 162, 0.1);
    padding: 1rem;
    border-radius: 10px;
    color: #2d3748;
}

/* Budget Settings Button Styles */
.edit-budget-btn:hover {
    background: rgba(255, 255, 255, 0.4) !important;
    transform: translateY(-2px) rotate(90deg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.edit-budget-btn:active {
    transform: translateY(0) rotate(180deg);
}

.edit-budget-btn {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}`;

    return new Response(css, {
      headers: { 'Content-Type': 'text/css' }
    });
  }

  private async serveJS(): Promise<Response> {
    const js = `let balance = 1250.75;
let expenses = 342.50;
let savings = 908.25;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let allTransactions = [];

// Tab Management
function switchTab(tabName) {
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
    event.target.classList.add('active');
    
    // Load tab-specific data
    if (tabName === 'budget') {
        loadBudgetData();
    } else if (tabName === 'analytics') {
        loadAnalyticsData();
    }
}

// Budget Management
async function addTransactionFromForm() {
    const amount = parseFloat(document.getElementById('amountInput').value);
    const description = document.getElementById('descriptionInput').value;
    const category = document.getElementById('categoryInput').value;
    const type = document.getElementById('typeInput').value;
    
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
            body: JSON.stringify({ amount, description, category, type })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Clear form
            document.getElementById('amountInput').value = '';
            document.getElementById('descriptionInput').value = '';
            
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
        
        // Load category budgets
        await loadCategoryBudgets(data.categoryBreakdown);
        
        // Load transactions list
        loadTransactionsList();
        
    } catch (error) {
        console.error('Error loading budget data:', error);
    }
}

function updateMonthlySelector() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    
    document.getElementById('currentMonth').textContent = 
        \`\${monthNames[currentMonth]} \${currentYear}\`;
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
        const percentage = Math.min((spent / budget) * 100, 100);
        
        return \`
            <div class="budget-card" data-category="\${cat.name}">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.5rem;">\${cat.emoji}</span>
                        <h4 style="margin: 0;">\${cat.label}</h4>
                    </div>
                    <button class="edit-budget-btn" onclick="editBudget('\${cat.name}', \${budget})" style="background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 36px; height: 36px; color: white; cursor: pointer; font-size: 1.1rem; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center;">⚙️</button>
                </div>
                <div style="margin-bottom: 0.5rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>$\${spent.toFixed(2)}</span>
                        <span id="budget-\${cat.name}">/ $\${budget.toFixed(2)}</span>
                    </div>
                    <div style="background: rgba(255,255,255,0.3); height: 8px; border-radius: 4px; margin-top: 0.5rem;">
                        <div style="background: white; height: 100%; width: \${percentage}%; border-radius: 4px; transition: width 0.5s ease;"></div>
                    </div>
                </div>
                <div style="font-size: 0.9rem; opacity: 0.9;">
                    \${percentage > 90 ? '⚠️ Near limit' : percentage > 100 ? '🚨 Over budget' : '✅ On track'}
                </div>
            </div>
        \`;
    }).join('');
}

async function editBudget(category, currentBudget) {
    const newBudget = prompt(\`Set budget for \${category.charAt(0).toUpperCase() + category.slice(1)}:\`, currentBudget);
    
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
            document.getElementById(\`budget-\${category}\`).textContent = \`/ $\${budgetAmount.toFixed(2)}\`;
            
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
    
    let filteredTransactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.timestamp);
        const matchesMonth = transactionDate.getMonth() === currentMonth && 
                           transactionDate.getFullYear() === currentYear;
        const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
        const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
        
        return matchesMonth && matchesCategory && matchesType;
    });
    
    if (filteredTransactions.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #718096;">No transactions found for the selected filters.</div>';
        return;
    }
    
    container.innerHTML = filteredTransactions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(transaction => \`
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-description">\${transaction.description}</div>
                    <div class="transaction-category">\${transaction.category} • \${new Date(transaction.timestamp).toLocaleDateString()}</div>
                </div>
                <div class="transaction-amount \${transaction.type}">
                    \${transaction.type === 'expense' ? '-' : '+'} $\${transaction.amount.toFixed(2)}
                </div>
            </div>
        \`).join('');
}

// Analytics
async function loadAnalyticsData() {
    try {
        const [summaryResponse, budgetsResponse] = await Promise.all([
            fetch('/api/get-summary'),
            fetch('/api/get-budgets')
        ]);
        
        const data = await summaryResponse.json();
        const budgetData = await budgetsResponse.json();
        
        // Load category breakdown
        loadCategoryAnalytics(data.categoryBreakdown);
        
        // Load monthly spending trend
        loadMonthlySpendingTrend(data.transactions);
        
        // Load budget performance
        loadBudgetPerformance(data.categoryBreakdown, budgetData.budgets);
        
        // Load AI insights
        loadAIInsights(data);
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
    }
}

function loadCategoryAnalytics(categoryBreakdown) {
    const container = document.getElementById('categoryChart');
    const total = Object.values(categoryBreakdown).reduce((sum, amount) => sum + amount, 0);
    
    container.innerHTML = Object.entries(categoryBreakdown)
        .sort(([,a], [,b]) => b - a)
        .map(([category, amount]) => {
            const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
            return \`
                <div class="category-item">
                    <span style="text-transform: capitalize;">\${category}</span>
                    <span>$\${amount.toFixed(2)} (\${percentage}%)</span>
                </div>
            \`;
        }).join('');
}

function loadMonthlySpendingTrend(transactions) {
    const container = document.getElementById('spendingChart');
    
    // Group transactions by month
    const monthlyData = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = \`\${date.getFullYear()}-\${String(date.getMonth() + 1).padStart(2, '0')}\`;
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthlyData[monthKey] = { name: monthName, amount: 0 };
    }
    
    // Aggregate expenses by month
    transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
            const date = new Date(transaction.timestamp);
            const monthKey = \`\${date.getFullYear()}-\${String(date.getMonth() + 1).padStart(2, '0')}\`;
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].amount += transaction.amount;
            }
        }
    });
    
    const monthlyValues = Object.values(monthlyData);
    const maxAmount = Math.max(...monthlyValues.map(m => m.amount));
    
    container.innerHTML = \`
        <div style="display: flex; flex-direction: column; height: 200px;">
            <div style="display: flex; align-items: end; height: 150px; gap: 8px; margin-bottom: 10px;">
                \${monthlyValues.map(month => {
                    const height = maxAmount > 0 ? (month.amount / maxAmount) * 120 : 0;
                    return \`
                        <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 100%; height: \${height}px; border-radius: 4px 4px 0 0; margin-bottom: 5px; position: relative;">
                                <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 0.7rem; color: #666; font-weight: 600;">$\${month.amount.toFixed(0)}</div>
                            </div>
                            <div style="font-size: 0.7rem; color: #666; text-align: center;">\${month.name}</div>
                        </div>
                    \`;
                }).join('')}
            </div>
            <div style="text-align: center; color: #666; font-size: 0.8rem;">
                💡 \${monthlyValues[monthlyValues.length - 1].amount > monthlyValues[monthlyValues.length - 2].amount ? 
                    'Spending increased this month' : 'Spending decreased this month'}
            </div>
        </div>
    \`;
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
            percentage: Math.min(percentage, 100),
            status: percentage > 100 ? 'over' : percentage > 90 ? 'warning' : 'good'
        };
    }).filter(item => item.spent > 0); // Only show categories with spending
    
    container.innerHTML = performanceData.map(item => \`
        <div class="budget-metric">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 600;">\${item.category}</span>
                <span style="font-size: 0.9rem; color: \${item.status === 'over' ? '#e53e3e' : item.status === 'warning' ? '#dd6b20' : '#38a169'};">
                    \${item.status === 'over' ? '🚨 Over' : item.status === 'warning' ? '⚠️ Near limit' : '✅ On track'}
                </span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px;">
                <span>$\${item.spent.toFixed(2)} spent</span>
                <span>$\${item.budget.toFixed(2)} budget</span>
            </div>
            <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: \${item.status === 'over' ? '#e53e3e' : item.status === 'warning' ? '#dd6b20' : '#38a169'}; height: 100%; width: \${item.percentage}%; border-radius: 4px; transition: width 0.5s ease;"></div>
            </div>
        </div>
    \`).join('');
    
    if (performanceData.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 2rem;">No spending data available for budget comparison.</div>';
    }
}

async function loadAIInsights(data) {
    const container = document.getElementById('aiInsights');
    
    // Generate AI insights based on data
    try {
        const response = await fetch('/api/advice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: \`Analyze my financial data and provide insights. I have a balance of $\${data.balance}, total expenses of $\${data.totalExpenses}, total income of $\${data.totalIncome}, and my spending breakdown is: \${JSON.stringify(data.categoryBreakdown)}. Give me 3 specific actionable recommendations.\`
            })
        });
        
        const result = await response.json();
        container.innerHTML = \`<p>\${result.response}</p>\`;
    } catch (error) {
        container.innerHTML = '<p>💡 Based on your spending patterns, consider setting monthly budgets for each category and tracking your progress regularly.</p>';
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: \${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#667eea'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    \`;
    
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
    const expensesEl = document.getElementById('expenses');
    const savingsEl = document.getElementById('savings');
    
    animateValue(balanceEl, 0, balance, 2000);
    animateValue(expensesEl, 0, expenses, 2500);
    animateValue(savingsEl, 0, savings, 3000);
}

function addMessage(content, isUser = false) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = \`message \${isUser ? 'user-message' : 'ai-message'}\`;
    
    messageDiv.innerHTML = \`
        <div class="message-content">
            <p>\${content}</p>
        </div>
    \`;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = \`
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
        <span>AI is thinking...</span>
    \`;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
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
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        hideTypingIndicator();
        addMessage(data.response || 'I apologize, but I\\'m having trouble processing your request right now. Please try again later.');
        
        // If a transaction was added, update the dashboard
        if (data.action === 'expense_added' || data.action === 'income_added') {
            await updateDashboardData();
        }
    } catch (error) {
        hideTypingIndicator();
        addMessage('I\\'m experiencing some technical difficulties. Please try again in a moment.');
    }
}

async function updateDashboardData() {
    try {
        const response = await fetch('/api/get-summary');
        const data = await response.json();
        
        // Update dashboard with real data
        balance = data.balance;
        expenses = data.totalExpenses;
        savings = Math.max(0, data.balance * 0.2); // Assume 20% of balance is savings
        
        // Animate to new values
        const balanceEl = document.getElementById('balance');
        const expensesEl = document.getElementById('expenses');
        const savingsEl = document.getElementById('savings');
        
        if (balanceEl && expensesEl && savingsEl) {
            animateValue(balanceEl, parseFloat(balanceEl.textContent.replace('$', '')) || 0, balance, 1000);
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
        'Set budget': 'Let\\'s set up a budget! Tell me the category and amount. For example: "Set $500 monthly food budget"',
        'Financial advice': 'Based on your spending patterns, I recommend: 1) Try the 50/30/20 rule (50% needs, 30% wants, 20% savings), 2) Track your expenses daily, 3) Build an emergency fund of 3-6 months expenses.',
        'Investment tips': 'Here are some investment tips for beginners: 1) Start with low-cost index funds, 2) Diversify your portfolio, 3) Invest regularly (dollar-cost averaging), 4) Don\\'t try to time the market, 5) Consider your risk tolerance and time horizon.'
    };
    
    addMessage(suggestion, true);
    setTimeout(() => {
        addMessage(responses[suggestion] || 'I can help you with that! Please provide more details about what you\\'d like to do.');
    }, 1000);
}

document.addEventListener('DOMContentLoaded', function() {
    // Load real data first, then animate
    updateDashboardData();
    
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    
    sendButton.addEventListener('click', () => {
        const message = chatInput.value;
        if (message.trim()) {
            sendMessage(message);
            chatInput.value = '';
        }
    });
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = chatInput.value;
            if (message.trim()) {
                sendMessage(message);
                chatInput.value = '';
            }
        }
    });
    
    // Budget tab event listeners
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', addTransactionFromForm);
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
});`;

    return new Response(js, {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }

  private async getAIAdvice(request: Request): Promise<Response> {
    try {
      const body = await request.json() as { message: string };
      const { message } = body;
      
      // Get current financial data to provide context to AI (using same method as getSummary)
      const transactions = await this.state.storage.get('transactions') as any[] || [];
      
      // Calculate totals
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Category breakdown
      const categoryBreakdown: { [key: string]: number } = {};
      transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
          categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
        });

      const balance = totalIncome - totalExpenses;
      const financialContext = {
        balance,
        totalIncome,
        totalExpenses,
        categoryBreakdown,
        transactionCount: transactions.length,
        recentTransactions: transactions.slice(-5) // Last 5 transactions
      };
      
      // Check if this is an expense command - simpler pattern
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('add') && lowerMessage.includes('expense')) {
        // Extract amount and description
        const amountMatch = message.match(/\$?(\d+(?:\.\d{2})?)/);
        if (amountMatch) {
          const amount = parseFloat(amountMatch[1]);
          // Extract description (everything between amount and 'expense')
          let description = message.replace(/add/i, '').replace(/\$?\d+(?:\.\d{2})?/, '').replace(/expense/i, '').trim();
          if (!description) description = 'expense';
          const category = this.categorizeExpense(description);
          
          // Add the transaction directly
          try {
            // Use simple key-value storage directly
            const transaction = {
              id: crypto.randomUUID(),
              amount,
              description,
              category,
              type: 'expense' as 'expense',
              date: new Date().toISOString().split('T')[0],
              timestamp: Date.now()
            };
            
            const existingTransactions = await this.state.storage.get('transactions') as any[] || [];
            existingTransactions.push(transaction);
            await this.state.storage.put('transactions', existingTransactions);
            
            return new Response(JSON.stringify({
              response: `✅ Successfully added $${amount} ${category} expense for "${description}". Your expense has been tracked!`,
              action: 'expense_added',
              transaction
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (error) {
            console.error('Error adding transaction via AI:', error);
          }
        }
      }
      
      // Check if this is an income command
      const incomeMatch = message.match(/add\s+\$?(\d+(?:\.\d{2})?)\s+(.+?)\s+income/i);
      if (incomeMatch) {
        const amount = parseFloat(incomeMatch[1]);
        const description = incomeMatch[2].trim();
        
        const addResponse = await this.addTransaction(new Request('', {
          method: 'POST',
          body: JSON.stringify({
            amount,
            description,
            category: 'income',
            type: 'income'
          })
        }));
        
        const result = await addResponse.json() as any;
        if (result.success) {
          return new Response(JSON.stringify({
            response: `✅ Successfully added $${amount} income for "${description}". Great job earning money!`,
            action: 'income_added',
            transaction: result.transaction
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Try to use Cloudflare AI for other queries
      try {
        // Create a more concise system prompt
        const systemPrompt = `You are a personal finance assistant. The user has:
- Balance: $${financialContext.balance.toFixed(2)}
- Income: $${financialContext.totalIncome.toFixed(2)}
- Expenses: $${financialContext.totalExpenses.toFixed(2)}
- Top spending: ${Object.entries(financialContext.categoryBreakdown)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 3)
  .map(([cat, amt]) => `${cat} $${amt.toFixed(2)}`)
  .join(', ')}

Give personalized financial advice based on their data. Keep responses under 150 words.`;

        const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            }
          ]
        });

        // Better response handling
        const aiResponse = response as any;
        let responseText = '';
        
        if (aiResponse && aiResponse.response) {
          responseText = aiResponse.response;
        } else if (aiResponse && typeof aiResponse === 'string') {
          responseText = aiResponse;
        } else {
          // Create a personalized fallback based on financial data
          responseText = `Based on your current finances: You have a balance of $${financialContext.balance.toFixed(2)} with $${financialContext.totalExpenses.toFixed(2)} in expenses. Your top spending category is ${Object.entries(financialContext.categoryBreakdown).sort(([,a], [,b]) => b - a)[0]?.[0] || 'other'} at $${Object.entries(financialContext.categoryBreakdown).sort(([,a], [,b]) => b - a)[0]?.[1]?.toFixed(2) || '0'}. ${financialContext.balance > 0 ? 'You\'re doing well keeping a positive balance!' : 'Consider reducing expenses to improve your balance.'}`;
        }

        return new Response(JSON.stringify({
          response: responseText
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (aiError) {
        console.error('AI Error:', aiError);
        // Provide intelligent fallback with actual financial data
        const intelligentFallback = `Based on your financial data: You currently have a balance of $${financialContext.balance.toFixed(2)}. You've spent $${financialContext.totalExpenses.toFixed(2)} across ${financialContext.transactionCount} transactions. Your highest spending category is ${Object.entries(financialContext.categoryBreakdown).sort(([,a], [,b]) => b - a)[0]?.[0] || 'other'} at $${Object.entries(financialContext.categoryBreakdown).sort(([,a], [,b]) => b - a)[0]?.[1]?.toFixed(2) || '0'}. ${financialContext.balance > financialContext.totalExpenses * 0.3 ? 'Your finances look healthy!' : 'Consider creating a budget to better manage expenses.'}`;
        
        return new Response(JSON.stringify({
          response: intelligentFallback
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        response: 'I can help you manage your finances! Try asking about budgeting, saving, or investment strategies.'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private categorizeExpense(description: string): string {
    const desc = description.toLowerCase();
    if (desc.includes('food') || desc.includes('grocery') || desc.includes('restaurant') || desc.includes('lunch') || desc.includes('dinner')) return 'food';
    if (desc.includes('gas') || desc.includes('transport') || desc.includes('uber') || desc.includes('taxi') || desc.includes('bus')) return 'transportation';
    if (desc.includes('rent') || desc.includes('mortgage') || desc.includes('utilities') || desc.includes('electric') || desc.includes('water')) return 'housing';
    if (desc.includes('movie') || desc.includes('entertainment') || desc.includes('game') || desc.includes('concert')) return 'entertainment';
    if (desc.includes('clothes') || desc.includes('clothing') || desc.includes('shopping')) return 'shopping';
    if (desc.includes('health') || desc.includes('medical') || desc.includes('doctor') || desc.includes('pharmacy')) return 'healthcare';
    return 'other';
  }

  private getDefaultResponse(message: string): string {
    const msg = message.toLowerCase();
    if (msg.includes('budget')) {
      return 'I can help you with budgeting! Try the 50/30/20 rule: 50% for needs, 30% for wants, 20% for savings. What specific budgeting area would you like help with?';
    }
    if (msg.includes('save') || msg.includes('saving')) {
      return 'Great question about saving! Start by tracking your expenses, then look for areas to cut back. Even saving $50/month adds up to $600/year!';
    }
    if (msg.includes('invest')) {
      return 'For investing, consider starting with low-cost index funds, diversify your portfolio, and think long-term. What\'s your investment timeline?';
    }
    if (msg.includes('expense') || msg.includes('add')) {
      return 'To add an expense, use this format: "Add $50 grocery expense" or "Add $25 gas expense". I\'ll track it for you!';
    }
    return 'I can help you manage your finances! Try asking about budgeting, saving, investment strategies, or add expenses like "Add $50 grocery expense".';
  }

  private async addTransaction(request: Request): Promise<Response> {
    try {
      const body = await request.json() as { amount: number; description: string; category: string; type: 'income' | 'expense' };
      
      // Create new transaction
      const transaction = {
        id: crypto.randomUUID(),
        amount: body.amount,
        description: body.description,
        category: body.category,
        type: body.type,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now()
      };
      
      // Use simple key-value storage for now (more reliable)
      const existingTransactions = await this.state.storage.get('transactions') as any[] || [];
      existingTransactions.push(transaction);
      await this.state.storage.put('transactions', existingTransactions);
      
      return new Response(JSON.stringify({
        success: true,
        transaction,
        message: `Successfully added ${body.type} of $${body.amount} for ${body.description}`
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      return new Response(JSON.stringify({
        success: false,
        message: `Failed to add transaction: ${error}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async getSummary(request: Request): Promise<Response> {
    try {
      // Get all transactions from key-value storage
      const transactions = await this.state.storage.get('transactions') as any[] || [];
      
      // Calculate totals
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const balance = totalIncome - totalExpenses;
      
      // Category breakdown
      const categoryBreakdown: Record<string, number> = {};
      transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
          categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
        });
      
      // Sort transactions by timestamp (newest first)
      const sortedTransactions = transactions
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 10);
      
      return new Response(JSON.stringify({
        balance: Number(balance.toFixed(2)),
        totalIncome: Number(totalIncome.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        categoryBreakdown,
        transactions: sortedTransactions
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error getting summary:', error);
      return new Response(JSON.stringify({
        balance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        categoryBreakdown: {},
        transactions: []
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async setBudget(request: Request): Promise<Response> {
    try {
      const body = await request.json() as { category: string; amount: number };
      
      // Get existing budgets
      const existingBudgets = await this.state.storage.get('budgets') as Record<string, number> || {};
      
      // Update the budget for the category
      existingBudgets[body.category] = body.amount;
      
      // Save back to storage
      await this.state.storage.put('budgets', existingBudgets);
      
      return new Response(JSON.stringify({
        success: true,
        message: `Budget for ${body.category} set to $${body.amount.toFixed(2)}`,
        budgets: existingBudgets
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Failed to set budget',
        details: error
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async getBudgets(request: Request): Promise<Response> {
    try {
      // Get budgets from storage, with default values
      const budgets = await this.state.storage.get('budgets') as Record<string, number> || {};
      
      // Set default budgets if none exist
      const defaultBudgets = {
        food: 500,
        transportation: 300,
        housing: 1000,
        entertainment: 200,
        shopping: 300,
        healthcare: 400,
        other: 200
      };
      
      // Merge with defaults
      const finalBudgets = { ...defaultBudgets, ...budgets };
      
      return new Response(JSON.stringify({
        success: true,
        budgets: finalBudgets
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Failed to get budgets',
        details: error
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}
