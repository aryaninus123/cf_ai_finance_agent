import { generateSampleTransactions } from './sample-data';
import { APIHandlers } from './api-handlers';

interface Env {
  AI: any;
  FinanceAgent: DurableObjectNamespace;
}

export class FinanceAgent {
  state: DurableObjectState;
  env: Env;
  apiHandlers: APIHandlers;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.apiHandlers = new APIHandlers(state, env);
  }

  private async ensureInitialized() {
    // Check if we have transactions, if not, add sample data
    const transactions = await this.state.storage.get('transactions') as any[];
    if (!transactions || transactions.length === 0) {
      // Add sample transactions for the last 6 months
      const sampleTransactions = generateSampleTransactions();
      await this.state.storage.put('transactions', sampleTransactions);
    }
  }

  async fetch(request: Request): Promise<Response> {
    // Ensure we have sample data on first request
    await this.ensureInitialized();
    
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
    
    // API endpoints - delegate to API handlers
    if (url.pathname === '/api/advice') {
      return this.apiHandlers.getAIAdvice(request);
    }
    
    if (url.pathname === '/api/add-transaction') {
      return this.apiHandlers.addTransaction(request);
    }
    
    if (url.pathname === '/api/get-summary') {
      return this.apiHandlers.getSummary(request);
    }
    
    // Reset data endpoint (for clearing old sample data)
    if (url.pathname === '/api/reset-data' && request.method === 'POST') {
      const response = await this.apiHandlers.handleResetData();
      await this.ensureInitialized();
      return response;
    }
    
    if (url.pathname === '/api/set-budget' && request.method === 'POST') {
      return this.apiHandlers.setBudget(request);
    }
    
    if (url.pathname === '/api/get-budgets') {
      return this.apiHandlers.getBudgets(request);
    }

    // LLM-powered receipt scanning endpoint
    if (url.pathname === '/api/scan-receipt' && request.method === 'POST') {
      return this.apiHandlers.scanReceiptLLM(request);
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
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <h2>💰 Finance AI</h2>
                </div>
                <button class="sidebar-toggle" id="sidebarToggle">×</button>
            </div>
            
            <div class="dashboard-section">
                <h3>Dashboard</h3>
                <div class="stat-card">
                    <div class="stat-value" id="balance">$0</div>
                    <div class="stat-label">Total Balance</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="income">$0</div>
                    <div class="stat-label">Income This Month</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="expenses">$0</div>
                    <div class="stat-label">Expenses This Month</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="savings">$0</div>
                    <div class="stat-label">Saved This Month</div>
                </div>
            </div>
        </div>

        <div class="main-content">
            <!-- Dashboard Toggle Button (hidden by default) -->
            <button class="show-dashboard-btn" id="showDashboardBtn" style="display: none;">
                📊 Dashboard
            </button>
            
            <!-- Tab Navigation -->
            <div class="tab-navigation">
                <button class="tab-btn active">💬 AI Assistant</button>
                <button class="tab-btn">📊 Budget Manager</button>
                <button class="tab-btn">📈 Analytics</button>
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
                    <button class="chip">Add Expense</button>
                    <button class="chip">Set Budget</button>
                    <button class="chip">Get Advice</button>
                    <button class="chip">Investment Tips</button>
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
                        <div class="input-tabs" style="display:flex;gap:.5rem;margin:0 0 1rem 0;">
                            <button id="tabManual" class="input-tab-btn" style="background:#667eea;color:#fff;border:1px solid #667eea;padding:.6rem 1rem;border-radius:8px;cursor:pointer;">Add Transaction</button>
                            <button id="tabScan" class="input-tab-btn" style="background:rgba(0,0,0,0.05);color:#2d3748;border:1px solid rgba(0,0,0,0.1);padding:.6rem 1rem;border-radius:8px;cursor:pointer;">Scan Receipt</button>
                        </div>

                        <div id="manualSection" class="input-section" style="display:block;">
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
                                    <input type="date" id="dateInput" value="">
                                    <button id="addTransactionBtn">Add</button>
                                </div>
                            </div>
                        </div>

                        <div id="scanSection" class="input-section" style="display:none;">
                            <!-- Scan Receipt -->
                            <div class="scan-receipt-form">
                                <h3>Scan Receipt (LLM)</h3>
                                <p style="color: #718096; font-size: 0.9rem; margin-bottom: 1rem;">Upload a receipt image and AI will extract the transaction details</p>
                                
                                <!-- File Upload Section -->
                                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; background: rgba(102, 126, 234, 0.05); border-radius: 10px;">
                                    <label for="scanFile" class="file-upload-label" style="flex: 1;">
                                        <span class="file-upload-text">Choose File</span>
                                        <span id="fileName" class="file-name"></span>
                                    </label>
                                    <input type="file" id="scanFile" accept="image/*" style="display: none;">
                                    <button id="scanBtn" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Scan</button>
                                </div>
                                
                                <!-- Status Message -->
                                <div style="margin-bottom: 1.5rem; min-height: 24px;">
                                    <span id="scanStatus" class="scan-status" style="color: #667eea; font-weight: 500;"></span>
                                </div>
                                
                                <!-- Transaction Details Form -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                    <input type="number" id="scanAmount" placeholder="Amount ($)" step="0.01" style="padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem;">
                                    <input type="text" id="scanMerchant" placeholder="Merchant/Description" style="padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem;">
                                </div>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                                    <select id="scanCategory" style="padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem; background: white;">
                                        <option value="food">🍕 Food</option>
                                        <option value="transportation">🚗 Transportation</option>
                                        <option value="housing">🏠 Housing</option>
                                        <option value="entertainment">🎬 Entertainment</option>
                                        <option value="shopping">🛍️ Shopping</option>
                                        <option value="healthcare">🏥 Healthcare</option>
                                        <option value="other">📦 Other</option>
                                    </select>
                                    <input type="date" id="scanDate" value="" style="padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem;">
                                </div>
                                
                                <!-- Add Button -->
                                <button id="addScannedBtn" style="width: 100%; padding: 0.875rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: transform 0.2s;">Add Transaction</button>
                            </div>
                        </div>
                    </div>

                    <div class="budget-overview">
                        <div class="monthly-selector">
                            <button>‹</button>
                            <span id="currentMonth">September 2025</span>
                            <button>›</button>
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
                    
                    <div class="analytics-grid-full">
                        <div class="analytics-row-1">
                            <div class="analytics-card-large">
                                <h3>Monthly Spending Trend</h3>
                                <div id="spendingChart" class="chart-container">
                                    <p>📊 Chart coming soon...</p>
                                </div>
                            </div>
                            
                            <div class="analytics-card-medium">
                                <h3>Category Breakdown</h3>
                                <div id="categoryChart" class="category-breakdown">
                                    <!-- Will be populated with category data -->
                                </div>
                            </div>
                        </div>
                        
                        <div class="analytics-row-2">
                            <div class="analytics-card-large">
                                <h3>Budget Performance</h3>
                                <p style="color: #718096; font-size: 0.9rem; margin-bottom: 1rem;">Current month's spending vs. budgets</p>
                                <div id="budgetPerformance" class="budget-metrics-grid">
                                    <!-- Will show budget vs actual spending -->
                                </div>
                            </div>
                            
                            <div class="analytics-card-medium">
                                <h3>AI Insights</h3>
                                <div id="aiInsights" class="insights-container">
                                    <p>💡 Getting personalized insights...</p>
                                </div>
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
    transition: transform 0.3s ease, width 0.3s ease;
    position: relative;
    z-index: 100;
}

.sidebar.hidden {
    transform: translateX(-100%);
    width: 0;
    padding: 0;
    overflow: hidden;
}

.sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.sidebar-toggle {
    background: rgba(239, 68, 68, 0.1);
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    color: #ef4444;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.sidebar-toggle:hover {
    background: rgba(239, 68, 68, 0.2);
    transform: scale(1.1);
}

.show-dashboard-btn {
    position: fixed;
    top: 20px;
    left: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 25px;
    padding: 12px 20px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
    z-index: 1000;
}

.show-dashboard-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.main-content.expanded {
    margin-left: 0;
    width: 100%;
}

.logo h2 {
    color: #4a5568;
    margin: 0;
    text-align: left;
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

.file-upload-label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 12px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.file-upload-label:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.file-upload-text {
    font-weight: 600;
}

.file-name {
    font-size: 0.9rem;
    opacity: 0.9;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

.analytics-grid-full {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 0 2rem 2rem;
    width: 100%;
}

.analytics-row-1, .analytics-row-2 {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
    width: 100%;
}

.analytics-card-large {
    background: rgba(255, 255, 255, 0.95);
    padding: 2rem;
    border-radius: 20px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    min-height: 300px;
}

.analytics-card-medium {
    background: rgba(255, 255, 255, 0.95);
    padding: 2rem;
    border-radius: 20px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    min-height: 300px;
}

.analytics-card-large h3, .analytics-card-medium h3 {
    margin: 0 0 1.5rem 0;
    color: #2d3748;
    font-size: 1.3rem;
    font-weight: 700;
}

.chart-container {
    height: 250px;
    width: 100%;
}

.budget-metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    max-height: 250px;
    overflow-y: auto;
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

/* Budget Performance Cards */
.budget-performance-card {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 0.8rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.05);
}

.budget-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.8rem;
}

.budget-card-header h4 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: #2d3748;
}

.status-badge {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 10px;
    white-space: nowrap;
}

.status-badge.good {
    background: rgba(56, 161, 105, 0.15);
    color: #38a169;
}

.status-badge.warning {
    background: rgba(221, 107, 32, 0.15);
    color: #dd6b20;
}

.status-badge.over {
    background: rgba(229, 62, 62, 0.15);
    color: #e53e3e;
}

.budget-amounts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem;
    margin-bottom: 0.8rem;
}

.amount-item {
    text-align: center;
}

.amount-label {
    display: block;
    font-size: 0.65rem;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
}

.amount-value {
    display: block;
    font-size: 0.85rem;
    font-weight: 700;
    color: #2d3748;
}

.progress-container {
    margin-top: 0.8rem;
}

.progress-bar {
    background: #e2e8f0;
    height: 6px;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 4px;
}

.progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
}

.progress-fill.good {
    background: #38a169;
}

.progress-fill.warning {
    background: #dd6b20;
}

.progress-fill.over {
    background: #e53e3e;
}

.progress-text {
    text-align: center;
    font-size: 0.7rem;
    color: #4a5568;
    font-weight: 500;
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
    
    if (tabName === 'analytics') {
        // Hide sidebar completely on Analytics for full-width layout
        sidebar.style.display = 'none';
        mainContent.classList.add('expanded');
        showBtn.style.display = 'none'; // No dashboard button on Analytics
    } else {
        // Show sidebar on other tabs
        sidebar.style.display = 'block';
        sidebar.classList.remove('hidden');
        mainContent.classList.remove('expanded');
        showBtn.style.display = 'none';
    }
    
    // Load tab-specific data
    if (tabName === 'budget') {
        loadBudgetData();
    } else if (tabName === 'analytics') {
        loadAnalyticsData();
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
        
        // Check if we need sample historical data for demonstration
        const hasHistoricalData = data.transactions.some(t => {
            const transactionDate = new Date(t.timestamp);
            const currentMonth = new Date().getMonth();
            return transactionDate.getMonth() !== currentMonth;
        });
        
        // Calculate CURRENT MONTH's category breakdown for budget performance
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const currentMonthCategoryBreakdown = {};
        
        data.transactions.forEach(t => {
            if (t.type === 'expense') {
                const txDate = new Date(t.timestamp);
                if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
                    currentMonthCategoryBreakdown[t.category] = (currentMonthCategoryBreakdown[t.category] || 0) + t.amount;
                }
            }
        });
        
        // Load category breakdown (use all-time for overall spending distribution)
        loadCategoryAnalytics(data.categoryBreakdown);
        
        // Load monthly spending trend
        loadMonthlySpendingTrend(data.transactions, !hasHistoricalData);
        
        // Load budget performance (use CURRENT MONTH only)
        loadBudgetPerformance(currentMonthCategoryBreakdown, budgetData.budgets);
        
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
            const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);
            return '<div class="category-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(102, 126, 234, 0.1); border-radius: 8px; margin-bottom: 8px;">' +
                '<span style="text-transform: capitalize; font-weight: 600; color: #2d3748;">' + capitalizedCategory + '</span>' +
                '<span style="font-weight: 600; color: #4a5568;">$' + amount.toFixed(2) + ' (' + percentage + '%)</span>' +
            '</div>';
        }).join('');
}

function loadMonthlySpendingTrend(transactions, showSampleData = false) {
    const container = document.getElementById('spendingChart');
    
    // Group transactions by month
    const monthlyData = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthlyData[monthKey] = { name: monthName, amount: 0 };
    }
    
    // If showing sample data for demonstration
    if (showSampleData) {
        const monthKeys = Object.keys(monthlyData);
        const sampleAmounts = [180, 220, 320, 280, 350, 0]; // Sample historical data
        monthKeys.forEach((key, index) => {
            if (index < monthKeys.length - 1) { // Don't override current month
                monthlyData[key].amount = sampleAmounts[index];
            }
        });
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
    
    const chartBars = monthlyValues.map(month => {
                    const height = maxAmount > 0 ? (month.amount / maxAmount) * 140 : 5;
        return '<div style="display: flex; flex-direction: column; align-items: center; min-width: 60px; flex: 1; max-width: 80px;">' +
            '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 100%; height: ' + height + 'px; border-radius: 6px 6px 0 0; margin-bottom: 8px; position: relative; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);">' +
                '<div style="position: absolute; top: -30px; left: 50%; transform: translateX(-50%); font-size: 0.75rem; color: #4a5568; font-weight: 700; white-space: nowrap;">$' + month.amount.toFixed(0) + '</div>' +
            '</div>' +
            '<div style="font-size: 0.7rem; color: #718096; text-align: center; font-weight: 500; line-height: 1.2;">' + month.name + '</div>' +
        '</div>';
    }).join('');
    
    const trendMessage = monthlyValues[monthlyValues.length - 1].amount > monthlyValues[monthlyValues.length - 2].amount ? 
        'Spending increased this month' : 'Spending decreased this month';
    
    container.innerHTML = '<div style="display: flex; flex-direction: column; height: 250px; width: 100%; padding: 15px; box-sizing: border-box;">' +
        '<div style="display: flex; align-items: end; height: 180px; gap: 12px; margin-bottom: 15px; justify-content: space-between;">' +
            chartBars +
        '</div>' +
        '<div style="text-align: center; color: #4a5568; font-size: 0.85rem; background: rgba(102, 126, 234, 0.1); padding: 8px 16px; border-radius: 20px; font-weight: 500;">' +
            '💡 ' + trendMessage +
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
    
    container.innerHTML = performanceData.map(item => \`
        <div class="budget-performance-card">
            <div class="budget-card-header">
                <h4>\${item.category}</h4>
                <span class="status-badge \${item.status}">
                    \${item.status === 'over' ? '🚨 Over' : item.status === 'warning' ? '⚠️ Near limit' : '✅ On track'}
                </span>
            </div>
            <div class="budget-amounts">
                <div class="amount-item">
                    <span class="amount-label">Spent</span>
                    <span class="amount-value">$\${item.spent.toFixed(2)}</span>
                </div>
                <div class="amount-item">
                    <span class="amount-label">Budget</span>
                    <span class="amount-value">$\${item.budget.toFixed(2)}</span>
                </div>
            </div>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill \${item.status}" style="width: \${item.displayPercentage}%;"></div>
                </div>
                <div class="progress-text">\${item.percentage.toFixed(1)}% used</div>
            </div>
        </div>
    \`).join('');
    
    if (performanceData.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 2rem;">No spending data available for budget comparison.</div>';
    }
}

async function loadAIInsights(data) {
    const container = document.getElementById('aiInsights');
    
    // Generate smart insights based on actual data
    const insights = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate current month's spending
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
            insights.push(\`💰 <strong>Great job!</strong> You're saving \${savingsRate}% of your income this month ($\${savings}). Keep it up!\`);
        } else {
            const deficit = (monthlyExpenses - monthlyIncome).toFixed(2);
            insights.push(\`⚠️ <strong>Heads up:</strong> You're spending $\${deficit} more than your income this month. Consider reviewing your expenses.\`);
        }
    }
    
    // Insight 2: Highest spending category
    const sortedCategories = Object.entries(monthlyCategories).sort((a, b) => b[1] - a[1]);
    if (sortedCategories.length > 0) {
        const topCategory = sortedCategories[0];
        const percentage = ((topCategory[1] / monthlyExpenses) * 100).toFixed(1);
        const categoryName = topCategory[0].charAt(0).toUpperCase() + topCategory[0].slice(1);
        const amount = topCategory[1].toFixed(2);
        insights.push(\`📊 <strong>Top spending:</strong> \${categoryName} accounts for \${percentage}% of your expenses ($\${amount} this month).\`);
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
        insights.push(\`🚨 <strong>Budget alert:</strong> You're over budget in \${overBudgetCount} categor\${word}. Review these expenses to get back on track.\`);
    } else if (nearLimitCount > 0) {
        const word = nearLimitCount > 1 ? 'ies' : 'y';
        insights.push(\`⚠️ <strong>Watch out:</strong> You're approaching your budget limit in \${nearLimitCount} categor\${word}. Plan ahead for the rest of the month.\`);
    } else {
        insights.push(\`✅ <strong>Well done!</strong> You're staying within your budgets across all categories. Keep up the good financial habits!\`);
    }
    
    // Display insights
    container.innerHTML = insights.map(insight => \`<p style="margin-bottom: 1rem; line-height: 1.6;">\${insight}</p>\`).join('');
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
    
    if (sendButton && chatInput) {
    sendButton.addEventListener('click', () => {
        const message = chatInput.value;
        if (message.trim()) {
            sendMessage(message);
            chatInput.value = '';
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
            const tabName = this.textContent.includes('AI') ? 'chat' : 
                           this.textContent.includes('Budget') ? 'budget' : 'analytics';
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
            showNotification(\`✅ Scanned! Found $\${outAmount} from "\${outMerchant}". Please review before adding.\`, 'success');
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
        showNotification(\`✅ Added $\${amount.toFixed(2)} expense for "\${description}"\`, 'success');
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
`;

    return new Response(js, {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }

}

