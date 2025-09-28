class FinanceAssistant {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.currentSection = 'chat';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.connectWebSocket();
        this.loadDashboardData();
        this.showSection('chat');
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.showSection(section);
                
                // Update active nav item
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // Chat input
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = button.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/?id=default-user`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                this.isConnected = true;
                this.updateConnectionStatus('connected', 'Connected');
                console.log('WebSocket connected');
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };
            
            this.ws.onclose = () => {
                this.isConnected = false;
                this.updateConnectionStatus('disconnected', 'Disconnected');
                console.log('WebSocket disconnected');
                
                // Attempt to reconnect after 3 seconds
                setTimeout(() => this.connectWebSocket(), 3000);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('disconnected', 'Connection Error');
            };
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            this.updateConnectionStatus('disconnected', 'Connection Failed');
        }
    }

    updateConnectionStatus(status, text) {
        const statusElement = document.getElementById('connectionStatus');
        statusElement.className = `connection-status ${status}`;
        statusElement.querySelector('span').textContent = text;
    }

    handleWebSocketMessage(data) {
        if (data.type === 'state_update') {
            this.handleStateUpdate(data.state);
        } else if (data.type === 'alert') {
            this.showAlert(data.alert);
        } else if (data.type === 'chat_response') {
            this.addMessage('assistant', data.message);
        }
    }

    handleStateUpdate(state) {
        if (state.alerts && state.alerts.length > 0) {
            state.alerts.forEach(alert => this.showAlert(alert));
        }
        
        // Update dashboard if we have new data
        if (state.transactions || state.preferences) {
            this.loadDashboardData();
        }
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
            this.currentSection = sectionId;
            
            // Load section-specific data
            if (sectionId === 'dashboard') {
                this.loadDashboardData();
            } else if (sectionId === 'transactions') {
                this.loadTransactions();
            } else if (sectionId === 'budgets') {
                this.loadBudgets();
            }
        }
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        this.addMessage('user', message);
        input.value = '';
        
        try {
            // Send message to AI for processing
            const response = await fetch('/api/advice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: message })
            });
            
            const data = await response.json();
            
            if (data.advice) {
                this.addMessage('assistant', data.advice);
            } else {
                this.addMessage('assistant', "I'm sorry, I couldn't process your request. Please try again.");
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage('assistant', "I'm having trouble connecting. Please check your connection and try again.");
        }
    }

    addMessage(sender, content) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatar = sender === 'user' ? 
            '<i class="fas fa-user"></i>' : 
            '<i class="fas fa-robot"></i>';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p>${this.formatMessage(content)}</p>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatMessage(content) {
        // Simple formatting for better display
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    handleQuickAction(action) {
        switch (action) {
            case 'add-expense':
                this.showExpenseModal();
                break;
            case 'add-income':
                this.showIncomeModal();
                break;
            case 'view-summary':
                this.showSection('dashboard');
                break;
            case 'set-budget':
                this.showBudgetModal();
                break;
        }
    }

    showExpenseModal() {
        const modal = this.createModal('Add Expense', `
            <div class="form-group">
                <label for="expenseAmount">Amount</label>
                <input type="number" id="expenseAmount" placeholder="0.00" step="0.01" required>
            </div>
            <div class="form-group">
                <label for="expenseDescription">Description</label>
                <input type="text" id="expenseDescription" placeholder="What did you spend on?" required>
            </div>
            <div class="form-group">
                <label for="expenseCategory">Category</label>
                <select id="expenseCategory" required>
                    <option value="">Select category</option>
                    <option value="Food">Food & Dining</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Bills">Bills & Utilities</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label for="expenseDate">Date</label>
                <input type="date" id="expenseDate" required>
            </div>
        `, async () => {
            const amount = parseFloat(document.getElementById('expenseAmount').value);
            const description = document.getElementById('expenseDescription').value;
            const category = document.getElementById('expenseCategory').value;
            const date = document.getElementById('expenseDate').value;
            
            if (amount && description && category && date) {
                await this.addTransaction({
                    amount,
                    description,
                    category,
                    date,
                    type: 'expense'
                });
                this.closeModal();
            }
        });
        
        // Set today's date as default
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    }

    showIncomeModal() {
        const modal = this.createModal('Add Income', `
            <div class="form-group">
                <label for="incomeAmount">Amount</label>
                <input type="number" id="incomeAmount" placeholder="0.00" step="0.01" required>
            </div>
            <div class="form-group">
                <label for="incomeDescription">Description</label>
                <input type="text" id="incomeDescription" placeholder="Source of income" required>
            </div>
            <div class="form-group">
                <label for="incomeCategory">Category</label>
                <select id="incomeCategory" required>
                    <option value="">Select category</option>
                    <option value="Salary">Salary</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Investment">Investment</option>
                    <option value="Business">Business</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label for="incomeDate">Date</label>
                <input type="date" id="incomeDate" required>
            </div>
        `, async () => {
            const amount = parseFloat(document.getElementById('incomeAmount').value);
            const description = document.getElementById('incomeDescription').value;
            const category = document.getElementById('incomeCategory').value;
            const date = document.getElementById('incomeDate').value;
            
            if (amount && description && category && date) {
                await this.addTransaction({
                    amount,
                    description,
                    category,
                    date,
                    type: 'income'
                });
                this.closeModal();
            }
        });
        
        document.getElementById('incomeDate').value = new Date().toISOString().split('T')[0];
    }

    showBudgetModal() {
        const modal = this.createModal('Set Budget', `
            <div class="form-group">
                <label for="budgetCategory">Category</label>
                <select id="budgetCategory" required>
                    <option value="">Select category</option>
                    <option value="Food">Food & Dining</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Bills">Bills & Utilities</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label for="budgetLimit">Budget Limit</label>
                <input type="number" id="budgetLimit" placeholder="0.00" step="0.01" required>
            </div>
            <div class="form-group">
                <label for="budgetPeriod">Period</label>
                <select id="budgetPeriod" required>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                </select>
            </div>
        `, async () => {
            const category = document.getElementById('budgetCategory').value;
            const limit = parseFloat(document.getElementById('budgetLimit').value);
            const period = document.getElementById('budgetPeriod').value;
            
            if (category && limit && period) {
                await this.setBudget({ category, limit, period });
                this.closeModal();
            }
        });
    }

    createModal(title, content, onSave) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="financeApp.closeModal()">Cancel</button>
                    <button class="btn primary" onclick="financeApp.saveModal()">Save</button>
                </div>
            </div>
        `;
        
        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .modal {
                background: white;
                border-radius: 15px;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
            }
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 25px;
                border-bottom: 1px solid #f1f3f4;
            }
            .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #7f8c8d;
            }
            .modal-body {
                padding: 25px;
            }
            .modal-footer {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                padding: 20px 25px;
                border-top: 1px solid #f1f3f4;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // Store the save function
        this.currentModalSave = onSave;
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
        
        // Close on X button
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
        this.currentModalSave = null;
    }

    async saveModal() {
        if (this.currentModalSave) {
            await this.currentModalSave();
        }
    }

    async addTransaction(transaction) {
        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction)
            });
            
            if (response.ok) {
                this.showAlert({
                    type: 'success',
                    message: `${transaction.type === 'income' ? 'Income' : 'Expense'} added successfully!`
                });
                this.loadDashboardData();
            } else {
                throw new Error('Failed to add transaction');
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            this.showAlert({
                type: 'error',
                message: 'Failed to add transaction. Please try again.'
            });
        }
    }

    async setBudget(budget) {
        try {
            const response = await fetch('/api/budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(budget)
            });
            
            if (response.ok) {
                this.showAlert({
                    type: 'success',
                    message: `Budget set for ${budget.category}!`
                });
                this.loadDashboardData();
            } else {
                throw new Error('Failed to set budget');
            }
        } catch (error) {
            console.error('Error setting budget:', error);
            this.showAlert({
                type: 'error',
                message: 'Failed to set budget. Please try again.'
            });
        }
    }

    async loadDashboardData() {
        try {
            const response = await fetch('/api/summary');
            const summary = await response.json();
            
            this.updateDashboard(summary);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    updateDashboard(summary) {
        // Update financial metrics
        document.getElementById('totalIncome').textContent = `$${summary.totalIncome.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `$${summary.totalExpenses.toFixed(2)}`;
        
        const netIncome = document.getElementById('netIncome');
        netIncome.textContent = `$${summary.netIncome.toFixed(2)}`;
        netIncome.className = `metric-value ${summary.netIncome >= 0 ? 'income' : 'expense'}`;
        
        // Update budget status
        const budgetContainer = document.getElementById('budgetStatus');
        if (Object.keys(summary.budgetStatus).length > 0) {
            budgetContainer.innerHTML = Object.entries(summary.budgetStatus)
                .map(([category, status]) => `
                    <div class="budget-item">
                        <div class="budget-header">
                            <span class="budget-category">${category}</span>
                            <span class="budget-amount">$${status.spent.toFixed(2)} / $${status.limit.toFixed(2)}</span>
                        </div>
                        <div class="budget-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min((status.spent / status.limit) * 100, 100)}%"></div>
                            </div>
                            <span class="budget-remaining ${status.remaining < 0 ? 'over-budget' : ''}">
                                ${status.remaining < 0 ? 'Over by' : 'Remaining'}: $${Math.abs(status.remaining).toFixed(2)}
                            </span>
                        </div>
                    </div>
                `).join('');
        } else {
            budgetContainer.innerHTML = '<p class="no-data">No budgets set yet</p>';
        }
        
        // Update category breakdown
        const categoryContainer = document.getElementById('categoryBreakdown');
        if (Object.keys(summary.categoryBreakdown).length > 0) {
            categoryContainer.innerHTML = Object.entries(summary.categoryBreakdown)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount]) => `
                    <div class="category-item">
                        <span class="category-name">${category}</span>
                        <span class="category-amount">$${amount.toFixed(2)}</span>
                    </div>
                `).join('');
        } else {
            categoryContainer.innerHTML = '<p class="no-data">No spending data yet</p>';
        }
    }

    async loadTransactions() {
        try {
            const response = await fetch('/api/transactions');
            const transactions = await response.json();
            
            const container = document.getElementById('transactionList');
            if (transactions.length > 0) {
                container.innerHTML = transactions.map(transaction => `
                    <div class="transaction-item">
                        <div class="transaction-info">
                            <span class="transaction-description">${transaction.description}</span>
                            <span class="transaction-category">${transaction.category}</span>
                        </div>
                        <div class="transaction-details">
                            <span class="transaction-amount ${transaction.type}">
                                ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
                            </span>
                            <span class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="no-data">No transactions to display</p>';
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    }

    showAlert(alert) {
        const container = document.getElementById('alertsContainer');
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${alert.type || 'info'}`;
        alertDiv.innerHTML = `
            <div class="alert-content">
                <strong>${this.getAlertTitle(alert.type)}</strong>
                <p>${alert.message || JSON.stringify(alert)}</p>
            </div>
        `;
        
        container.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    getAlertTitle(type) {
        const titles = {
            'budget_warning': 'Budget Alert',
            'budget_exceeded': 'Budget Exceeded',
            'spending_warning': 'Spending Alert',
            'savings_reminder': 'Savings Reminder',
            'weekly_insights': 'Weekly Insights',
            'success': 'Success',
            'error': 'Error',
            'warning': 'Warning'
        };
        return titles[type] || 'Notification';
    }
}

// Global functions for modal interactions
window.saveSettings = async function() {
    const currency = document.getElementById('currency').value;
    const savingsGoal = parseFloat(document.getElementById('savingsGoal').value) || undefined;
    const alertsEnabled = document.getElementById('alertsEnabled').checked;
    
    try {
        const response = await fetch('/api/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'default',
                preferredCurrency: currency,
                savingsGoal,
                alertsEnabled,
                budgets: [] // Will be preserved on backend
            })
        });
        
        if (response.ok) {
            financeApp.showAlert({
                type: 'success',
                message: 'Settings saved successfully!'
            });
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        financeApp.showAlert({
            type: 'error',
            message: 'Failed to save settings.'
        });
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.financeApp = new FinanceAssistant();
});
