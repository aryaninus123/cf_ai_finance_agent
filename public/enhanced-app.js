class EnhancedFinanceAssistant {
  constructor() {
    this.isConnected = false;
    this.currentSection = 'chat';
    this.messageCount = 1;
    this.sessionStartTime = Date.now();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateConnectionStatus('connected', 'Connected');
    this.loadDashboardData();
    this.startSessionTimer();
    this.setupSuggestionChips();
    this.setupEnhancedFeatures();
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

    // Chat input (support both messageInput and chatInput ids)
    const messageInput = document.getElementById('messageInput') || document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    
    if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });
    }
    
    if (sendButton) {
      sendButton.addEventListener('click', () => {
        this.sendMessage();
      });
    }

    // Enhanced input features
    const voiceButton = document.getElementById('voiceButton');
    const attachButton = document.getElementById('attachButton');
    
    if (voiceButton) {
      voiceButton.addEventListener('click', () => {
        this.toggleVoiceInput();
      });
    }
    
    if (attachButton) {
      attachButton.addEventListener('click', () => {
        this.handleFileAttach();
      });
    }

    // Dashboard refresh
    const refreshButton = document.getElementById('refreshDashboard');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        this.refreshDashboard();
      });
    }

    // Time filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const period = e.target.dataset.period;
        this.updateDashboardPeriod(period);
      });
    });
  }

  setupSuggestionChips() {
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const text = chip.dataset.text;
        if (text) {
          document.getElementById('messageInput').value = text;
          this.sendMessage();
        }
      });
    });
  }

  setupEnhancedFeatures() {
    // Add subtle animations to cards
    const cards = document.querySelectorAll('.dashboard-card, .nav-item, .suggestion-chip');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-2px)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
      });
    });

    // Enhanced message animations
    this.observeMessages();
  }

  observeMessages() {
    const messagesContainer = document.getElementById('chatMessages');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    // Observe existing messages
    messagesContainer.querySelectorAll('.message').forEach(message => {
      observer.observe(message);
    });

    // Store observer for new messages
    this.messageObserver = observer;
  }

  updateConnectionStatus(status, text) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
      statusElement.className = `connection-status ${status}`;
      const titleElement = statusElement.querySelector('.status-title');
      const subtitleElement = statusElement.querySelector('.status-subtitle');
      
      if (titleElement) titleElement.textContent = status === 'connected' ? 'Connected' : 'Disconnected';
      if (subtitleElement) {
        subtitleElement.textContent = status === 'connected' ? 'Real-time sync active' : 'Attempting to reconnect...';
      }
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
    
    // Show typing indicator
    this.showTypingIndicator();
    
    // Add user message to chat
    this.addMessage('user', message);
    input.value = '';
    
    // Update message count
    this.messageCount++;
    this.updateMessageCount();
    
    try {
      // Send message to AI for processing
      const response = await fetch('/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: message })
      });
      
      const data = await response.json();
      
      // Hide typing indicator
      this.hideTypingIndicator();
      
      if (data.advice) {
        this.addMessage('assistant', data.advice);
      } else {
        this.addMessage('assistant', "I'm sorry, I couldn't process your request. Please try again.");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.hideTypingIndicator();
      this.addMessage('assistant', "I'm having trouble connecting. Please check your connection and try again.");
    }
  }

  showTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.style.display = 'flex';
    }
  }

  hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  addMessage(sender, content) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const avatar = sender === 'user' ? 
      '<i class="fas fa-user"></i>' : 
      '<i class="fas fa-robot"></i>';
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const senderName = sender === 'user' ? 'You' : 'FinanceAI';
    
    messageDiv.innerHTML = `
      <div class="message-avatar">
        ${sender === 'assistant' ? '<div class="avatar-glow"></div>' : ''}
        ${avatar}
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="sender-name">${senderName}</span>
          <span class="message-time">${time}</span>
        </div>
        <div class="message-text">
          <p>${this.formatMessage(content)}</p>
        </div>
      </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Observe new message for animations
    if (this.messageObserver) {
      this.messageObserver.observe(messageDiv);
    }
    
    // Update message count
    this.messageCount++;
    this.updateMessageCount();
  }

  formatMessage(content) {
    // Enhanced message formatting
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  updateMessageCount() {
    const countElement = document.getElementById('messageCount');
    if (countElement) {
      countElement.textContent = this.messageCount;
    }
  }

  startSessionTimer() {
    setInterval(() => {
      const elapsed = Date.now() - this.sessionStartTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      
      const timeElement = document.getElementById('sessionTime');
      if (timeElement) {
        timeElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  async loadDashboardData() {
    try {
      const response = await fetch('/api/summary');
      const summary = await response.json();
      this.updateDashboard(summary);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Show sample data for demo
      this.updateDashboard({
        totalIncome: 3500,
        totalExpenses: 2100,
        netIncome: 1400,
        categoryBreakdown: {
          'Food': 650,
          'Transportation': 300,
          'Entertainment': 200,
          'Shopping': 400,
          'Bills': 550
        },
        budgetStatus: {
          'Food': { spent: 650, limit: 800, remaining: 150 },
          'Transportation': { spent: 300, limit: 400, remaining: 100 }
        }
      });
    }
  }

  updateDashboard(summary) {
    // Update financial metrics with animation
    this.animateValue('totalIncome', 0, summary.totalIncome, 1000);
    this.animateValue('totalExpenses', 0, summary.totalExpenses, 1000);
    
    const netIncome = document.getElementById('netIncome');
    if (netIncome) {
      this.animateValue('netIncome', 0, summary.netIncome, 1000);
      netIncome.className = `metric-value ${summary.netIncome >= 0 ? 'income' : 'expense'}`;
    }
  }

  animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * easeOut;
      
      element.textContent = `$${current.toFixed(2)}`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  refreshDashboard() {
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
      refreshBtn.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        refreshBtn.style.transform = 'rotate(0deg)';
      }, 500);
    }
    
    this.loadDashboardData();
    this.showAlert({
      type: 'success',
      message: 'Dashboard refreshed successfully!'
    });
  }

  updateDashboardPeriod(period) {
    console.log(`Updating dashboard for ${period} days`);
    // In a real app, this would fetch data for the specified period
    this.loadDashboardData();
  }

  toggleVoiceInput() {
    const voiceBtn = document.getElementById('voiceButton');
    if (!voiceBtn) return;
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      if (!this.recognition) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        
        this.recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          document.getElementById('messageInput').value = transcript;
          voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        };
        
        this.recognition.onerror = () => {
          voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
          this.showAlert({
            type: 'error',
            message: 'Voice recognition failed. Please try again.'
          });
        };
      }
      
      if (this.isListening) {
        this.recognition.stop();
        this.isListening = false;
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      } else {
        this.recognition.start();
        this.isListening = true;
        voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
      }
    } else {
      this.showAlert({
        type: 'warning',
        message: 'Voice recognition not supported in this browser.'
      });
    }
  }

  handleFileAttach() {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.txt,.pdf';
    fileInput.style.display = 'none';
    
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.processFile(file);
      }
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }

  processFile(file) {
    this.showAlert({
      type: 'info',
      message: `Processing ${file.name}... (Feature coming soon!)`
    });
  }

  async loadTransactions() {
    // Placeholder for transaction loading
    console.log('Loading transactions...');
  }

  async loadBudgets() {
    // Placeholder for budget loading
    console.log('Loading budgets...');
  }

  showAlert(alert) {
    const container = document.getElementById('alertsContainer');
    if (!container) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alert.type || 'info'}`;
    
    const iconMap = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    
    const icon = iconMap[alert.type] || 'info-circle';
    
    alertDiv.innerHTML = `
      <div class="alert-content">
        <div class="alert-header">
          <i class="fas fa-${icon}"></i>
          <strong>${this.getAlertTitle(alert.type)}</strong>
        </div>
        <p>${alert.message}</p>
      </div>
    `;
    
    container.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.style.animation = 'alertSlideOut 0.3s ease forwards';
        setTimeout(() => alertDiv.remove(), 300);
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
      'warning': 'Warning',
      'info': 'Information'
    };
    return titles[type] || 'Notification';
  }
}

// Enhanced animations
const style = document.createElement('style');
style.textContent = `
  @keyframes alertSlideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100%); }
  }
  
  .message.visible {
    animation: messageSlide 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .alert-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .alert-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
  
  .alert-header i {
    font-size: 16px;
  }
  
  .alert.success .alert-header i { color: #00f2fe; }
  .alert.error .alert-header i { color: #f5576c; }
  .alert.warning .alert-header i { color: #ffa726; }
  .alert.info .alert-header i { color: #4facfe; }
`;

document.head.appendChild(style);

// Initialize the enhanced app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.financeApp = new EnhancedFinanceAssistant();
  
  // Add some demo functionality
  setTimeout(() => {
    if (window.financeApp) {
      window.financeApp.showAlert({
        type: 'success',
        message: 'Welcome to your Personal Finance Assistant! 🎉'
      });
    }
  }, 1000);
});
