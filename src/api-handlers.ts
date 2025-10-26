// API handlers for the Finance AI application
// This file contains all API endpoint logic extracted from simple-agent.ts

import { ReceiptScanner } from './receipt-scanner';
import { initializeKnowledgeBase } from './knowledge-base';
import { retrieveContext, buildRAGPrompt, indexTransaction, suggestCategory } from './rag-handler';
import { createVectorDB, getVectorDBName } from './vector-db-factory';

interface Env {
  AI: any;
  VECTORIZE?: any;
  CHROMA_URL?: string;
  CHROMA_API_KEY?: string;
  CHROMA_TENANT?: string;
  CHROMA_DATABASE?: string;
  FinanceAgent: DurableObjectNamespace;
  ENVIRONMENT?: string;
}

// Function calling tool definitions
interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

interface FunctionCall {
  name: string;
  arguments: string;
}

interface FunctionResult {
  success: boolean;
  data?: any;
  message: string;
  action?: string;
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  messages: ConversationMessage[];
  startTime: number;
  lastUpdated: number;
}

export class APIHandlers {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  // ========== CONVERSATION MEMORY METHODS ==========

  /**
   * Save a message to the conversation history
   */
  async saveMessage(role: 'user' | 'assistant' | 'system', content: string, conversationId: string = 'default'): Promise<void> {
    const conversations = await this.state.storage.get('conversations') as Record<string, Conversation> || {};

    if (!conversations[conversationId]) {
      conversations[conversationId] = {
        id: conversationId,
        messages: [],
        startTime: Date.now(),
        lastUpdated: Date.now()
      };
    }

    const message: ConversationMessage = {
      role,
      content,
      timestamp: Date.now()
    };

    conversations[conversationId].messages.push(message);
    conversations[conversationId].lastUpdated = Date.now();

    // Limit conversation history to last 50 messages to prevent memory bloat
    if (conversations[conversationId].messages.length > 50) {
      conversations[conversationId].messages = conversations[conversationId].messages.slice(-50);
    }

    await this.state.storage.put('conversations', conversations);
  }

  /**
   * Load conversation history
   */
  async loadConversation(conversationId: string = 'default'): Promise<ConversationMessage[]> {
    const conversations = await this.state.storage.get('conversations') as Record<string, Conversation> || {};
    return conversations[conversationId]?.messages || [];
  }

  /**
   * Get conversation context formatted for LLM
   */
  async getConversationContext(conversationId: string = 'default', limit: number = 10): Promise<string> {
    const messages = await this.loadConversation(conversationId);
    const recentMessages = messages.slice(-limit);

    if (recentMessages.length === 0) {
      return '';
    }

    return '\n\nPREVIOUS CONVERSATION:\n' + recentMessages.map(msg => {
      const roleLabel = msg.role === 'user' ? 'User' : 'Assistant';
      return `${roleLabel}: ${msg.content}`;
    }).join('\n') + '\n\n';
  }

  /**
   * Clear conversation history
   */
  async clearConversation(conversationId: string = 'default'): Promise<void> {
    const conversations = await this.state.storage.get('conversations') as Record<string, Conversation> || {};
    if (conversations[conversationId]) {
      delete conversations[conversationId];
      await this.state.storage.put('conversations', conversations);
    }
  }

  /**
   * Get all conversations
   */
  async getAllConversations(): Promise<Record<string, Conversation>> {
    return await this.state.storage.get('conversations') as Record<string, Conversation> || {};
  }

  // ========== FUNCTION CALLING DEFINITIONS ==========

  /**
   * Get available functions that AI can call
   */
  getAvailableFunctions(): FunctionDefinition[] {
    return [
      {
        name: 'add_transaction',
        description: 'Add a new expense or income transaction to the user\'s financial records',
        parameters: {
          type: 'object',
          properties: {
            amount: {
              type: 'number',
              description: 'The transaction amount in dollars (positive number)'
            },
            description: {
              type: 'string',
              description: 'Brief description of the transaction (e.g., "Grocery shopping", "Monthly salary")'
            },
            category: {
              type: 'string',
              enum: ['food', 'transportation', 'housing', 'entertainment', 'shopping', 'healthcare', 'other'],
              description: 'The spending category'
            },
            type: {
              type: 'string',
              enum: ['expense', 'income'],
              description: 'Whether this is an expense or income'
            },
            date: {
              type: 'string',
              description: 'Transaction date in YYYY-MM-DD format (optional, defaults to today)'
            }
          },
          required: ['amount', 'description', 'category', 'type']
        }
      },
      {
        name: 'set_budget',
        description: 'Set or update the monthly budget limit for a specific spending category',
        parameters: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: ['food', 'transportation', 'housing', 'entertainment', 'shopping', 'healthcare', 'other'],
              description: 'The category to set the budget for'
            },
            amount: {
              type: 'number',
              description: 'The monthly budget limit in dollars'
            }
          },
          required: ['category', 'amount']
        }
      },
      {
        name: 'get_spending_summary',
        description: 'Get detailed spending information for a specific category or time period',
        parameters: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: ['food', 'transportation', 'housing', 'entertainment', 'shopping', 'healthcare', 'other', 'all'],
              description: 'The category to analyze, or "all" for all categories'
            },
            month: {
              type: 'string',
              description: 'Month name (e.g., "October", "November") or "current" for current month'
            }
          },
          required: []
        }
      },
      {
        name: 'get_budget_status',
        description: 'Check budget status across all categories to see if user is over/under budget',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'delete_transaction',
        description: 'Delete a specific transaction by its description or recent transaction',
        parameters: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'The description of the transaction to delete'
            }
          },
          required: ['description']
        }
      }
    ];
  }

  // ========== FUNCTION CALL HANDLERS ==========

  /**
   * Execute a function call requested by the AI
   */
  async executeFunction(functionCall: FunctionCall): Promise<FunctionResult> {
    const { name, arguments: argsStr } = functionCall;

    try {
      const args = JSON.parse(argsStr);

      switch (name) {
        case 'add_transaction':
          return await this.handleAddTransaction(args);

        case 'set_budget':
          return await this.handleSetBudget(args);

        case 'get_spending_summary':
          return await this.handleGetSpendingSummary(args);

        case 'get_budget_status':
          return await this.handleGetBudgetStatus();

        case 'delete_transaction':
          return await this.handleDeleteTransaction(args);

        default:
          return {
            success: false,
            message: `Unknown function: ${name}`
          };
      }
    } catch (error) {
      console.error(`Error executing function ${name}:`, error);
      return {
        success: false,
        message: `Error executing ${name}: ${error}`
      };
    }
  }

  /**
   * Handler: Add transaction
   */
  private async handleAddTransaction(args: any): Promise<FunctionResult> {
    const { amount, description, category, type, date } = args;

    const transactionDate = date || new Date().toISOString().slice(0, 10);
    const transaction = {
      id: crypto.randomUUID(),
      amount: parseFloat(amount),
      description,
      category,
      type,
      date: transactionDate,
      timestamp: new Date(transactionDate + 'T12:00:00').getTime()
    };

    const transactions = await this.state.storage.get('transactions') as any[] || [];
    transactions.push(transaction);
    await this.state.storage.put('transactions', transactions);

    return {
      success: true,
      data: transaction,
      message: `Added ${type} of $${amount} for "${description}" in ${category} category`,
      action: `${type}_added`
    };
  }

  /**
   * Handler: Set budget
   */
  private async handleSetBudget(args: any): Promise<FunctionResult> {
    const { category, amount } = args;

    const budgets = await this.state.storage.get('budgets') as Record<string, number> || {};
    const oldBudget = budgets[category] || 0;
    budgets[category] = parseFloat(amount);
    await this.state.storage.put('budgets', budgets);

    return {
      success: true,
      data: { category, amount, oldBudget },
      message: `Budget for ${category} ${oldBudget > 0 ? `updated from $${oldBudget} to` : 'set to'} $${amount}/month`
    };
  }

  /**
   * Handler: Get spending summary
   */
  private async handleGetSpendingSummary(args: any): Promise<FunctionResult> {
    const { category, month } = args;
    const transactions = await this.state.storage.get('transactions') as any[] || [];

    let filtered = transactions.filter(t => t.type === 'expense');

    // Filter by category if specified
    if (category && category !== 'all') {
      filtered = filtered.filter(t => t.category === category);
    }

    // Filter by month if specified
    if (month && month !== 'current') {
      const monthMap: Record<string, number> = {
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
      };
      const targetMonth = monthMap[month.toLowerCase()];
      if (targetMonth !== undefined) {
        const currentYear = new Date().getFullYear();
        filtered = filtered.filter(t => {
          if (!t.date) return false;
          const [year, m] = t.date.split('-');
          return parseInt(year) === currentYear && parseInt(m) - 1 === targetMonth;
        });
      }
    }

    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    const count = filtered.length;

    // Get category breakdown
    const breakdown: Record<string, number> = {};
    filtered.forEach(t => {
      breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
    });

    return {
      success: true,
      data: {
        total,
        count,
        category: category || 'all',
        month: month || 'all time',
        breakdown,
        transactions: filtered.slice(-5) // Last 5 transactions
      },
      message: `Found ${count} transaction(s) totaling $${total.toFixed(2)}`
    };
  }

  /**
   * Handler: Get budget status
   */
  private async handleGetBudgetStatus(): Promise<FunctionResult> {
    const transactions = await this.state.storage.get('transactions') as any[] || [];
    const budgets = await this.state.storage.get('budgets') as Record<string, number> || {};

    // Calculate current month spending by category
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const monthlySpending: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense' && t.date && t.date.startsWith(currentYearMonth))
      .forEach(t => {
        monthlySpending[t.category] = (monthlySpending[t.category] || 0) + t.amount;
      });

    // Compare with budgets
    const status: Record<string, any> = {};
    const overBudget: string[] = [];
    const underBudget: string[] = [];

    for (const [category, budget] of Object.entries(budgets)) {
      const spent = monthlySpending[category] || 0;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;
      const remaining = budget - spent;

      status[category] = {
        budget,
        spent,
        remaining,
        percentage: percentage.toFixed(1),
        status: spent > budget ? 'over' : spent > budget * 0.9 ? 'warning' : 'good'
      };

      if (spent > budget) {
        overBudget.push(category);
      } else if (spent < budget * 0.8) {
        underBudget.push(category);
      }
    }

    return {
      success: true,
      data: {
        status,
        overBudget,
        underBudget,
        totalBudget: Object.values(budgets).reduce((sum, b) => sum + b, 0),
        totalSpent: Object.values(monthlySpending).reduce((sum, s) => sum + s, 0)
      },
      message: `Budget status: ${overBudget.length} over budget, ${underBudget.length} under budget`
    };
  }

  /**
   * Handler: Delete transaction
   */
  private async handleDeleteTransaction(args: any): Promise<FunctionResult> {
    const { description } = args;
    const transactions = await this.state.storage.get('transactions') as any[] || [];

    // Find matching transaction (case-insensitive)
    const index = transactions.findIndex(t =>
      t.description.toLowerCase().includes(description.toLowerCase())
    );

    if (index === -1) {
      return {
        success: false,
        message: `No transaction found matching "${description}"`
      };
    }

    const deleted = transactions.splice(index, 1)[0];
    await this.state.storage.put('transactions', transactions);

    return {
      success: true,
      data: deleted,
      message: `Deleted transaction: ${deleted.description} ($${deleted.amount})`
    };
  }

  async handleResetData(): Promise<Response> {
    await this.state.storage.deleteAll();
    // Note: ensureInitialized will be called from the main class
    return new Response(JSON.stringify({ success: true, message: 'Data reset with new sample transactions' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async getAIAdvice(request: Request): Promise<Response> {
    try {
      const body = await request.json() as { message: string; conversationId?: string };
      const { message, conversationId = 'default' } = body;

      // Save user message to conversation history
      await this.saveMessage('user', message, conversationId);

      // Get current financial data to provide context to AI
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

      // ========== HYBRID APPROACH: Use deterministic code for precise calculations ==========
      // For questions requiring exact calculations, use regex + direct computation
      // For general advice, use LLM
      
      const financialContext = {
        balance,
        totalIncome,
        totalExpenses,
        categoryBreakdown,
        transactionCount: transactions.length,
        recentTransactions: transactions.slice(-5)
      };
      
      // Check for specific financial questions that need precise answers
      const dayQuestion = message.match(/which day.*spend.*(most|least|highest|lowest)|what day.*(most|least).*spending|(highest|lowest).*spending.*day|least.*money.*day/i);
      const monthQuestion = message.match(/how much.*(did|do|have).*spend.*(in|during|for)\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)/i);
      const balanceQuestion = message.match(/what.*my.*balance|how much.*have|current.*balance/i);
      const categoryQuestion = message.match(/how much.*(did|do|have).*spend.*on\s+(\w+)/i);
      
      // Handle day-specific questions with DETERMINISTIC calculation
      if (dayQuestion) {
        const isLeast = /least|lowest/.test(message.toLowerCase());
        const monthMatch = message.match(/(?:in|of)\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i);
        const dailySpending = this.calculateDailySpending(transactions, monthMatch ? monthMatch[1] : null);
        
        if (dailySpending.found) {
          const day = isLeast ? dailySpending.lowestDay : dailySpending.highestDay;
          const superlative = isLeast ? 'lowest' : 'highest';
          const responseText = `${day.date} was your ${superlative} spending day${monthMatch ? ` in ${monthMatch[1]}` : ''} with $${day.amount.toFixed(2)} spent across ${day.transactionCount} transaction${day.transactionCount > 1 ? 's' : ''}. ${day.topCategory ? `Most of it went to ${day.topCategory.category} ($${day.topCategory.amount.toFixed(2)}).` : ''}`;

          // Save assistant response
          await this.saveMessage('assistant', responseText, conversationId);

          return new Response(JSON.stringify({
            response: responseText
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          const responseText = `I couldn't find daily spending data${monthMatch ? ` for ${monthMatch[1]}` : ''}. Your transactions show total spending of $${financialContext.totalExpenses.toFixed(2)}.`;

          // Save assistant response
          await this.saveMessage('assistant', responseText, conversationId);

          return new Response(JSON.stringify({
            response: responseText
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Handle monthly spending questions with DETERMINISTIC calculation
      if (monthQuestion) {
        const monthName = monthQuestion[3].toLowerCase();
        const monthlySpending = this.calculateMonthlySpending(transactions, monthName);

        if (monthlySpending.found) {
          const responseText = `In ${monthlySpending.monthName}, you spent $${monthlySpending.amount.toFixed(2)} across ${monthlySpending.transactionCount} transactions. ${monthlySpending.topCategory ? `Your highest spending was in ${monthlySpending.topCategory.category} ($${monthlySpending.topCategory.amount.toFixed(2)}).` : ''}`;
          await this.saveMessage('assistant', responseText, conversationId);
          return new Response(JSON.stringify({
            response: responseText
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          const responseText = `I don't have spending data for ${monthName}. Your available data shows spending in the current month ($${financialContext.totalExpenses.toFixed(2)}).`;
          await this.saveMessage('assistant', responseText, conversationId);
          return new Response(JSON.stringify({
            response: responseText
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Handle balance questions with DETERMINISTIC calculation
      if (balanceQuestion) {
        const responseText = `Your current balance is $${financialContext.balance.toFixed(2)}. You have $${financialContext.totalIncome.toFixed(2)} in total income and $${financialContext.totalExpenses.toFixed(2)} in expenses across ${financialContext.transactionCount} transactions.`;
        await this.saveMessage('assistant', responseText, conversationId);
        return new Response(JSON.stringify({
          response: responseText
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Handle category questions with DETERMINISTIC calculation
      if (categoryQuestion) {
        const category = categoryQuestion[2].toLowerCase();
        const categoryAmount = financialContext.categoryBreakdown[category] || 0;

        if (categoryAmount > 0) {
          const percentage = ((categoryAmount / financialContext.totalExpenses) * 100).toFixed(1);
          const responseText = `You've spent $${categoryAmount.toFixed(2)} on ${category}, which is ${percentage}% of your total expenses ($${financialContext.totalExpenses.toFixed(2)}).`;
          await this.saveMessage('assistant', responseText, conversationId);
          return new Response(JSON.stringify({
            response: responseText
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          const responseText = `You haven't recorded any spending in the ${category} category yet. Your current spending categories are: ${Object.keys(financialContext.categoryBreakdown).join(', ')}.`;
          await this.saveMessage('assistant', responseText, conversationId);
          return new Response(JSON.stringify({
            response: responseText
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // LEGACY TRANSACTION PARSER DISABLED - Function calling now handles all actions
      // The old parseTransactionIntent was conflicting with function calling
      // Now we rely entirely on the LLM with function definitions to handle actions

      // ========== PURE LLM APPROACH ==========
      // Let the AI figure out what the user is asking and compute the answer

      // Prepare detailed financial data for the LLM
      const monthlyData = this.calculateMonthlyBreakdownForAllMonths(transactions);
      const dailySpendingData = this.calculateDailySpendingSummary(transactions); // Pre-calculate daily spending
      const categoryData = Object.entries(categoryBreakdown)
        .sort(([,a], [,b]) => b - a)
        .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
        .join(', ');

      // ========== RAG ENHANCEMENT ==========
      // Retrieve relevant context from knowledge base and transaction history
      let ragContext;
      try {
        const vectorDB = createVectorDB(this.env);
        ragContext = await retrieveContext(
          message,
          transactions,
          this.env.AI,
          vectorDB
        );
      } catch (ragError) {
        console.log('RAG retrieval skipped:', ragError);
        ragContext = { knowledgeEntries: [], similarTransactions: [] };
      }

      const financialSummary = {
        balance,
        income: totalIncome,
        expenses: totalExpenses,
        categoryBreakdown
      };

      // Build enhanced prompt with RAG context (for informational queries)
      const ragEnhancedPrompt = buildRAGPrompt(message, ragContext, financialSummary);

      // Get conversation history as proper message objects (last 5 messages for context)
      const conversationHistory = await this.loadConversation(conversationId);
      const recentMessages = conversationHistory.slice(-5);

      // Get available functions for function calling
      const functions = this.getAvailableFunctions();
      const functionDescriptions = functions.map(f =>
        `- ${f.name}: ${f.description}`
      ).join('\n');

      // Build a comprehensive system prompt with ALL financial data, conversation history, AND function calling
      const systemPrompt = `You are an intelligent financial assistant with complete access to the user's financial data AND the ability to take actions.

CRITICAL RULES:
1. NEVER make up numbers or guess - use ONLY the data provided below
2. NEVER do math calculations yourself - all totals are pre-calculated for you
3. Be specific with numbers - always include dollar amounts and transaction counts
4. If you don't have data for a specific period, say so clearly
5. Keep responses concise (under 100 words) and focused on the current question
6. DO NOT repeat information from previous messages
7. Answer ONLY what the user is currently asking
8. Use conversation history ONLY for context, not to repeat responses

AVAILABLE ACTIONS - Call these functions when the user wants to DO something:
${functionDescriptions}

MULTI-STEP ACTIONS:
You can call MULTIPLE functions in sequence for complex requests. Each function call should be on its own line.

WHEN TO USE FUNCTION CALLS:
- User wants to SET/UPDATE/CHANGE a budget → use set_budget
- User wants to ADD/RECORD an expense or income → use add_transaction
- User wants to DELETE/REMOVE a transaction → use delete_transaction
- User wants to CHECK budget status → use get_budget_status
- User wants to ANALYZE spending → use get_spending_summary

FORMAT for function calls (MUST match exactly):
FUNCTION_CALL: {"name": "function_name", "arguments": {"param": "value"}}

SINGLE-STEP EXAMPLES:
User: "Set my food budget to $500"
→ FUNCTION_CALL: {"name": "set_budget", "arguments": {"category": "food", "amount": 500}}

User: "I spent $50 on groceries"
→ FUNCTION_CALL: {"name": "add_transaction", "arguments": {"amount": 50, "description": "groceries", "category": "food", "type": "expense"}}

MULTI-STEP EXAMPLES:
User: "I spent $50 on groceries. Am I over budget on food?"
→ FUNCTION_CALL: {"name": "add_transaction", "arguments": {"amount": 50, "description": "groceries", "category": "food", "type": "expense"}}
→ FUNCTION_CALL: {"name": "get_budget_status", "arguments": {}}

User: "Add $100 gas, $50 food, and $200 shopping"
→ FUNCTION_CALL: {"name": "add_transaction", "arguments": {"amount": 100, "description": "gas", "category": "transportation", "type": "expense"}}
→ FUNCTION_CALL: {"name": "add_transaction", "arguments": {"amount": 50, "description": "food", "category": "food", "type": "expense"}}
→ FUNCTION_CALL: {"name": "add_transaction", "arguments": {"amount": 200, "description": "shopping", "category": "shopping", "type": "expense"}}

User: "Set food budget to $600, entertainment to $250"
→ FUNCTION_CALL: {"name": "set_budget", "arguments": {"category": "food", "amount": 600}}
→ FUNCTION_CALL: {"name": "set_budget", "arguments": {"category": "entertainment", "amount": 250}}

For INFORMATIONAL questions (no action needed), respond normally with text.

${ragContext.knowledgeEntries && ragContext.knowledgeEntries.length > 0 ? `
RELEVANT FINANCIAL KNOWLEDGE BASE:
━━━━━━━━━━━━━━━━━━━━
${ragContext.knowledgeEntries.map((entry, idx) =>
  `${idx + 1}. ${entry.category.toUpperCase()}:\n${entry.content}\n`
).join('\n')}
━━━━━━━━━━━━━━━━━━━━

Use the above knowledge base articles to provide expert financial advice when relevant.
` : ''}

USER'S FINANCIAL DATA:
━━━━━━━━━━━━━━━━━━━━
Current Balance: $${balance.toFixed(2)}
Total Income: $${totalIncome.toFixed(2)}
Total Expenses: $${totalExpenses.toFixed(2)}
Total Transactions: ${transactions.length}

SPENDING BY CATEGORY (all-time):
${categoryData || 'No expenses recorded yet'}

MONTHLY SPENDING BREAKDOWN (2025):
${monthlyData}

DAILY SPENDING BREAKDOWN (recent months):
${dailySpendingData}

━━━━━━━━━━━━━━━━━━━━

Now answer the user's question using ONLY the data above OR call a function to perform an action. Be precise and cite specific numbers.`;

      try {
        // Build messages array with conversation history
        const messages: any[] = [
          { role: 'system', content: systemPrompt }
        ];

        // Add recent conversation messages for context
        for (const msg of recentMessages) {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }

        // Add current user message
        messages.push({ role: 'user', content: message });

        // Add timeout to prevent infinite waiting
        const response = await Promise.race([
          this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: messages,
            max_tokens: 512 // Reduced since we're providing pre-calculated data
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI request timed out after 30 seconds')), 30000)
          )
        ]) as any;

        const aiResponse = response as any;
        let responseText = aiResponse?.response || '';

        if (!responseText) {
          responseText = `I have access to your financial data: Balance is $${balance.toFixed(2)}, with $${totalExpenses.toFixed(2)} in total expenses across ${transactions.length} transactions. What would you like to know?`;
        }

        // Check if AI wants to call function(s) - MULTI-STEP SUPPORT
        // Extract ALL FUNCTION_CALL patterns from the response
        const functionCallPattern = /FUNCTION_CALL:\s*(\{[^}]*\{[^}]*\}[^}]*\}|\{[^}]*\})/gi;
        const functionCallMatches: RegExpMatchArray[] = Array.from(responseText.matchAll(functionCallPattern)) as RegExpMatchArray[];

        if (functionCallMatches.length > 0) {
          try {
            const functionCalls: FunctionCall[] = [];

            // Parse all function calls
            for (const match of functionCallMatches) {
              let jsonStr = match[1];

              // Find the complete JSON object by counting braces
              let braceCount = 0;
              let endIndex = 0;
              for (let i = 0; i < jsonStr.length; i++) {
                if (jsonStr[i] === '{') braceCount++;
                if (jsonStr[i] === '}') braceCount--;
                if (braceCount === 0) {
                  endIndex = i + 1;
                  break;
                }
              }

              if (endIndex > 0) {
                jsonStr = jsonStr.substring(0, endIndex);
              }

              const parsedCall = JSON.parse(jsonStr);

              // Convert arguments to string if it's an object
              const functionCall: FunctionCall = {
                name: parsedCall.name,
                arguments: typeof parsedCall.arguments === 'string'
                  ? parsedCall.arguments
                  : JSON.stringify(parsedCall.arguments)
              };

              functionCalls.push(functionCall);
            }

            console.log(`[Multi-Step] AI wants to execute ${functionCalls.length} function(s):`);
            functionCalls.forEach((fc, i) => {
              console.log(`  ${i + 1}. ${fc.name}`);
            });

            // Execute all functions in sequence
            const functionResults: FunctionResult[] = [];
            for (let i = 0; i < functionCalls.length; i++) {
              const fc = functionCalls[i];
              console.log(`[Multi-Step] Executing step ${i + 1}/${functionCalls.length}: ${fc.name}`);

              const result = await this.executeFunction(fc);
              functionResults.push(result);

              console.log(`[Multi-Step] Step ${i + 1} result:`, result.success ? '✅ Success' : '❌ Failed', `-`, result.message);
            }

            // Build summary of all results with calculated totals
            const addedTransactions = functionResults
              .filter((r, i) => functionCalls[i].name === 'add_transaction' && r.success)
              .map(r => r.data);

            let calculatedSummary = '';
            if (addedTransactions.length > 0) {
              // Group by category and calculate totals
              const byCategory: Record<string, number> = {};
              let grandTotal = 0;

              addedTransactions.forEach((t: any) => {
                byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
                grandTotal += t.amount;
              });

              calculatedSummary = `\n\nCALCULATED TOTALS (use these exact numbers):
- Total transactions added: ${addedTransactions.length}
- Grand total spent: $${grandTotal.toFixed(2)}
- By category: ${Object.entries(byCategory).map(([cat, amt]) => `${cat} $${amt.toFixed(2)}`).join(', ')}`;
            }

            const resultsSummary = functionResults.map((result, i) => {
              const fc = functionCalls[i];
              return `${i + 1}. ${fc.name}: ${result.success ? 'Success' : 'Failed'} - ${result.message}`;
            }).join('\n');

            // ========== RECALCULATE BALANCE AFTER TRANSACTIONS ==========
            // The balance at the start of this function is now stale
            // Recalculate with the newly added transactions
            const updatedTransactions = await this.state.storage.get('transactions') as any[] || [];
            const updatedTotalIncome = updatedTransactions
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + t.amount, 0);
            const updatedTotalExpenses = updatedTransactions
              .filter(t => t.type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0);
            const updatedBalance = updatedTotalIncome - updatedTotalExpenses;

            // Add updated financial context to the summary
            const updatedFinancialContext = `\n\nUPDATED FINANCIAL STATUS (use these exact numbers):
- Current Balance: $${updatedBalance.toFixed(2)}
- Total Income: $${updatedTotalIncome.toFixed(2)}
- Total Expenses: $${updatedTotalExpenses.toFixed(2)}
- Total Transactions: ${updatedTransactions.length}`;

            // Get final natural language response from AI
            const finalResponse = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
              messages: [
                {
                  role: 'system',
                  content: `You are a financial assistant. Provide a brief confirmation of what was done.

CRITICAL RULES:
1. ONLY confirm what the user asked you to do - don't volunteer extra information
2. If they asked to log expenses, just confirm the transactions were added with the total
3. If they asked about balance, ONLY tell them the balance
4. DO NOT include balance, income, or expense info unless directly asked
5. Use ONLY the exact numbers provided - NEVER calculate yourself
6. Keep response under 50 words
7. Be concise and focused`
                },
                { role: 'user', content: message },
                {
                  role: 'user',
                  content: `Executed ${functionCalls.length} function(s):\n${resultsSummary}${calculatedSummary}${updatedFinancialContext}\n\nProvide a brief confirmation of what was done. Answer ONLY what was asked - do not volunteer balance or financial status unless specifically requested.`
                }
              ],
              max_tokens: 150
            });

            responseText = finalResponse?.response || functionResults.map(r => r.message).join(' ');

            // Save assistant response
            await this.saveMessage('assistant', responseText, conversationId);

            // Determine if any action was taken (for dashboard refresh)
            const actionTaken = functionResults.some(r => r.action);

            // Return with multi-step info
            return new Response(JSON.stringify({
              response: responseText,
              action: actionTaken ? 'multi_step_completed' : undefined,
              functionsCalled: functionCalls.map(fc => fc.name),
              functionResults: functionResults,
              stepsExecuted: functionCalls.length
            }), {
              headers: { 'Content-Type': 'application/json' }
            });

          } catch (parseError) {
            console.error('[Multi-Step] Parse error:', parseError);
            // If function parsing fails, just return the original response
          }
        }

        // Save assistant response to conversation history
        await this.saveMessage('assistant', responseText, conversationId);

        return new Response(JSON.stringify({
          response: responseText
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (aiError) {
        console.error('AI Error:', aiError);
        const errorResponse = `I have access to your financial data but encountered an issue. Your current balance is $${balance.toFixed(2)} with $${totalExpenses.toFixed(2)} in expenses. Please try rephrasing your question.`;
        await this.saveMessage('assistant', errorResponse, conversationId);
        return new Response(JSON.stringify({
          response: errorResponse
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.error('getAIAdvice error:', error);
      const fallbackResponse = 'I can help you manage your finances! Try asking about budgeting, saving, or investment strategies.';
      try {
        // Try to get conversationId from request if available
        const body = await request.clone().json() as { conversationId?: string };
        await this.saveMessage('assistant', fallbackResponse, body.conversationId || 'default');
      } catch {
        // If we can't parse the request, just continue
      }
      return new Response(JSON.stringify({
        response: fallbackResponse
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }


  // Helper: Calculate monthly breakdown for all months
  private calculateMonthlyBreakdownForAllMonths(transactions: any[]): string {
    const byMonth: { [key: string]: { expenses: number; income: number; count: number } } = {};
    
    transactions.forEach(t => {
      const monthKey = t.date ? t.date.slice(0, 7) : 'Unknown'; // YYYY-MM
      if (!byMonth[monthKey]) byMonth[monthKey] = { expenses: 0, income: 0, count: 0 };
      byMonth[monthKey].count++;
      if (t.type === 'expense') byMonth[monthKey].expenses += t.amount;
      if (t.type === 'income') byMonth[monthKey].income += t.amount;
    });

    const formatted = Object.entries(byMonth)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12)
      .map(([month, data]) => {
        const monthStr = this.formatMonthKey(month);
        return `${monthStr}: $${data.expenses.toFixed(2)} spent, $${data.income.toFixed(2)} earned (${data.count} transactions)`;
      })
      .join('\n');

    return formatted || 'No monthly data available';
  }

  // Helper: Format YYYY-MM to readable month name
  private formatMonthKey(monthKey: string): string {
    if (monthKey === 'Unknown') return 'Unknown';
    const [year, month] = monthKey.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  // Helper: Pre-calculate daily spending to help AI answer daily spending questions
  private calculateDailySpendingSummary(transactions: any[]): string {
    const dailySpending: { [key: string]: { total: number; count: number; categories: { [key: string]: number } } } = {};
    
    // Group expenses by date
    transactions
      .filter(t => t.type === 'expense' && t.date)
      .forEach(t => {
        if (!dailySpending[t.date]) {
          dailySpending[t.date] = { total: 0, count: 0, categories: {} };
        }
        dailySpending[t.date].total += t.amount;
        dailySpending[t.date].count++;
        dailySpending[t.date].categories[t.category] = (dailySpending[t.date].categories[t.category] || 0) + t.amount;
      });

    // Format for LLM (sorted by date, most recent first, limit to last 90 days)
    const formatted = Object.entries(dailySpending)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 90)
      .map(([date, data]) => {
        const topCategory = Object.entries(data.categories)
          .sort(([,a], [,b]) => b - a)[0];
        return `${date}: $${data.total.toFixed(2)} spent (${data.count} transactions, top: ${topCategory[0]} $${topCategory[1].toFixed(2)})`;
      })
      .join('\n');

    return formatted || 'No daily spending data available';
  }

  private calculateMonthlySpending(transactions: any[], monthName: string) {
    const monthMap: { [key: string]: number } = {
      'january': 0, 'jan': 0,
      'february': 1, 'feb': 1,
      'march': 2, 'mar': 2,
      'april': 3, 'apr': 3,
      'may': 4,
      'june': 5, 'jun': 5,
      'july': 6, 'jul': 6,
      'august': 7, 'aug': 7,
      'september': 8, 'sep': 8, 'sept': 8,
      'october': 9, 'oct': 9,
      'november': 10, 'nov': 10,
      'december': 11, 'dec': 11
    };

    const targetMonth = monthMap[monthName];
    if (targetMonth === undefined) {
      return { found: false, monthName, amount: 0, transactionCount: 0 };
    }

    // Default to current year for month queries
    const currentYear = new Date().getFullYear();

    const monthTransactions = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      // Use date string to avoid timezone issues
      if (!t.date) return false;
      const dateParts = t.date.split('-');
      const txYear = parseInt(dateParts[0]);
      const txMonth = parseInt(dateParts[1]) - 1; // Convert to 0-indexed
      // Match month and year (default to current year)
      return txMonth === targetMonth && txYear === currentYear;
    });

    if (monthTransactions.length === 0) {
      // Check if we have sample data for this month
      const sampleAmounts: { [key: number]: number } = {
        3: 180, // April
        4: 220, // May  
        5: 320, // June
        6: 280, // July
        7: 350  // August
      };
      
      if (sampleAmounts[targetMonth]) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        return { 
          found: true, 
          monthName: monthNames[targetMonth], 
          amount: sampleAmounts[targetMonth], 
          transactionCount: 5, // Estimated
          isSample: true 
        };
      }
      
      return { found: false, monthName, amount: 0, transactionCount: 0 };
    }

    const totalAmount = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
    const categoryBreakdown: { [key: string]: number } = {};
    
    monthTransactions.forEach(t => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
    });

    const topCategory = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)[0];

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];

    return {
      found: true,
      monthName: monthNames[targetMonth],
      amount: totalAmount,
      transactionCount: monthTransactions.length,
      topCategory: topCategory ? { category: topCategory[0], amount: topCategory[1] } : null,
      isSample: false
    };
  }

  private calculateDailySpending(transactions: any[], monthName: string | null) {
    let filteredTransactions = transactions.filter(t => t.type === 'expense');
    
    console.log(`[Daily Spending] Total expense transactions: ${filteredTransactions.length}`);
    
    // If a month is specified, filter by that month
    if (monthName) {
      const monthMap: { [key: string]: number } = {
        'january': 0, 'jan': 0, 'february': 1, 'feb': 1, 'march': 2, 'mar': 2,
        'april': 3, 'apr': 3, 'may': 4, 'june': 5, 'jun': 5,
        'july': 6, 'jul': 6, 'august': 7, 'aug': 7, 'september': 8, 'sep': 8, 'sept': 8,
        'october': 9, 'oct': 9, 'november': 10, 'nov': 10, 'december': 11, 'dec': 11
      };
      const targetMonth = monthMap[monthName.toLowerCase()];
      const currentYear = new Date().getFullYear();
      console.log(`[Daily Spending] Filtering for month: ${monthName} (index: ${targetMonth}, year: ${currentYear})`);
      if (targetMonth !== undefined) {
        filteredTransactions = filteredTransactions.filter(t => {
          // Use date string to avoid timezone issues
          if (!t.date) return false;
          const dateParts = t.date.split('-');
          const txYear = parseInt(dateParts[0]);
          const txMonth = parseInt(dateParts[1]) - 1; // Convert to 0-indexed
          return txMonth === targetMonth && txYear === currentYear;
        });
        console.log(`[Daily Spending] After month filter: ${filteredTransactions.length} transactions`);
      }
    }

    if (filteredTransactions.length === 0) {
      return { found: false };
    }

    // Group transactions by day
    const dailyTotals: { [key: string]: { amount: number; transactions: any[] } } = {};
    
    filteredTransactions.forEach(t => {
      const date = t.date || new Date(t.timestamp).toISOString().split('T')[0];
      if (!dailyTotals[date]) {
        dailyTotals[date] = { amount: 0, transactions: [] };
      }
      dailyTotals[date].amount += t.amount;
      dailyTotals[date].transactions.push(t);
    });
    
    console.log(`[Daily Spending] Grouped into ${Object.keys(dailyTotals).length} days`);
    Object.entries(dailyTotals).forEach(([date, data]) => {
      console.log(`  ${date}: $${data.amount.toFixed(2)} (${data.transactions.length} txns) - ${data.transactions.map(t => `${t.description} ($${t.amount})`).join(', ')}`);
    });

    // Find the day with highest and lowest spending
    let highestDay: any = null;
    let lowestDay: any = null;
    let highestAmount = 0;
    let lowestAmount = Infinity;

    Object.entries(dailyTotals).forEach(([date, data]) => {
        // Calculate category breakdown for this day
        const categoryBreakdown: { [key: string]: number } = {};
        data.transactions.forEach(t => {
          categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
        });
        
        const topCategory = Object.entries(categoryBreakdown)
          .sort(([,a], [,b]) => b - a)[0];

        // Format the date nicely
        const dateObj = new Date(date + 'T00:00:00Z');
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          timeZone: 'UTC'
        });

      const dayInfo = {
          date: formattedDate,
          amount: data.amount,
          transactionCount: data.transactions.length,
          topCategory: topCategory ? { category: topCategory[0], amount: topCategory[1] } : null
        };

      // Check for highest
      if (data.amount > highestAmount) {
        highestAmount = data.amount;
        highestDay = dayInfo;
      }

      // Check for lowest
      if (data.amount < lowestAmount) {
        lowestAmount = data.amount;
        lowestDay = dayInfo;
      }
    });
    
    console.log(`[Daily Spending] Highest: ${highestDay?.date} ($${highestDay?.amount.toFixed(2)})`);
    console.log(`[Daily Spending] Lowest: ${lowestDay?.date} ($${lowestDay?.amount.toFixed(2)})`);

    return {
      found: true,
      highestDay,
      lowestDay
    };
  }

  private extractDateFromMessage(message: string): Date {
    const now = new Date();
    const lowerMessage = message.toLowerCase();

    // Month mapping
    const monthMap: { [key: string]: number } = {
      'january': 0, 'jan': 0, 'february': 1, 'feb': 1, 'march': 2, 'mar': 2,
      'april': 3, 'apr': 3, 'may': 4, 'june': 5, 'jun': 5,
      'july': 6, 'jul': 6, 'august': 7, 'aug': 7, 'september': 8, 'sep': 8, 'sept': 8,
      'october': 9, 'oct': 9, 'november': 10, 'nov': 10, 'december': 11, 'dec': 11
    };

    // Try to match "Month Day" or "Month Dayth" patterns (e.g., "October 20", "October 20th")
    const monthDayMatch = lowerMessage.match(/(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})/);
    if (monthDayMatch) {
      const month = monthMap[monthDayMatch[1]];
      const day = parseInt(monthDayMatch[2]);
      const year = now.getFullYear();
      return new Date(year, month, day, 12, 0, 0);
    }

    // Try to match ISO date format (YYYY-MM-DD)
    const isoMatch = message.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1]);
      const month = parseInt(isoMatch[2]) - 1;
      const day = parseInt(isoMatch[3]);
      return new Date(year, month, day, 12, 0, 0);
    }

    // Try to match MM/DD or MM/DD/YYYY format
    const slashMatch = message.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if (slashMatch) {
      const month = parseInt(slashMatch[1]) - 1;
      const day = parseInt(slashMatch[2]);
      const year = slashMatch[3] ? (slashMatch[3].length === 2 ? 2000 + parseInt(slashMatch[3]) : parseInt(slashMatch[3])) : now.getFullYear();
      return new Date(year, month, day, 12, 0, 0);
    }

    // Default to today
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  }

  private async parseTransactionIntent(message: string): Promise<{
    isTransaction: boolean;
    type?: 'expense' | 'income';
    amount?: number;
    description?: string;
    category?: string;
    date?: string;
  } | null> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const prompt = `Analyze this message and determine if the user wants to add a financial transaction (expense or income).

Message: "${message}"

IMPORTANT: If the message is asking a QUESTION (starts with "how much", "what", "when", "where", etc.), respond with {"isTransaction": false}

Examples of QUESTIONS (NOT transactions):
- "How much did I spend in October?" → {"isTransaction": false}
- "What's my balance?" → {"isTransaction": false}
- "How much did I spend on food?" → {"isTransaction": false}

Examples of TRANSACTIONS:
- "Add $50 grocery expense" → {"isTransaction": true, ...}
- "I spent $25 on gas" → {"isTransaction": true, ...}
- "Record $100 income" → {"isTransaction": true, ...}

If this is a transaction request, respond with ONLY a JSON object (no extra text):
{
  "isTransaction": true,
  "type": "expense" or "income",
  "amount": number (just the number, e.g., 50 not "$50"),
  "description": "brief description of transaction",
  "category": "food" or "transportation" or "housing" or "entertainment" or "shopping" or "healthcare" or "other",
  "date": "YYYY-MM-DD"
}

If NOT a transaction request, respond with:
{"isTransaction": false}

Rules:
- Questions about spending are NOT transactions
- Extract the amount (e.g., "50 dollar" → 50, "$25" → 25)
- Create a short description (e.g., "food expense" → "Food purchase", "grocery" → "Groceries")
- Choose appropriate category based on context
- Parse dates like "October 10th" → "2025-10-10", "tomorrow" → next day, or use today: ${today}
- Type is "expense" unless clearly income/salary/earning

Respond with ONLY the JSON object, no other text.`;

      const result = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: 'You are a financial transaction parser. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 256
      }) as any;

      if (result?.response) {
        // Clean response
        let jsonStr = result.response.trim();
        jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Extract JSON object
        const jsonMatch = jsonStr.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          if (parsed.isTransaction === false) {
            return null;
          }
          
          // Validate and sanitize
          if (parsed.isTransaction && parsed.amount && parsed.type) {
            return {
              isTransaction: true,
              type: parsed.type === 'income' ? 'income' : 'expense',
              amount: parseFloat(parsed.amount),
              description: (parsed.description || 'Transaction').toString().trim(),
              category: this.validateCategory(parsed.category),
              date: this.validateDate(parsed.date) || today
            };
          }
        }
      }
    } catch (error) {
      console.error('Transaction intent parsing error:', error);
    }
    
    return null;
  }

  private validateCategory(category: string): string {
    const validCategories = ['food', 'transportation', 'housing', 'entertainment', 'shopping', 'healthcare', 'other'];
    const cat = (category || '').toLowerCase().trim();
    return validCategories.includes(cat) ? cat : 'other';
  }

  private validateDate(dateStr: string): string | null {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().slice(0, 10);
    } catch {
      return null;
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

  async addTransaction(request: Request): Promise<Response> {
    try {
      const body = await request.json() as { amount: number; description: string; category: string; type: 'income' | 'expense'; date?: string };
      
      // Parse date string to avoid timezone issues
      // Adding T12:00:00 ensures we stay on the intended date regardless of timezone
      let dateStr: string;
      let timestamp: number;
      
      if (body.date) {
        dateStr = body.date; // Already in YYYY-MM-DD format from date input
        timestamp = new Date(`${dateStr}T12:00:00`).getTime();
      } else {
        const now = new Date();
        dateStr = now.toISOString().split('T')[0];
        timestamp = new Date(`${dateStr}T12:00:00`).getTime();
      }
      
      // Create new transaction
      const transaction = {
        id: crypto.randomUUID(),
        amount: body.amount,
        description: body.description,
        category: body.category,
        type: body.type,
        date: dateStr,
        timestamp: timestamp
      };
      
      // Use simple key-value storage for now (more reliable)
      const existingTransactions = await this.state.storage.get('transactions') as any[] || [];
      existingTransactions.push(transaction);
      await this.state.storage.put('transactions', existingTransactions);

      // ========== RAG ENHANCEMENT ==========
      // Index transaction for semantic search
      try {
        const vectorDB = createVectorDB(this.env);
        await indexTransaction(transaction, this.env.AI, vectorDB);
      } catch (indexError) {
        console.log('Transaction indexing skipped:', indexError);
        // Don't fail the whole operation if indexing fails
      }

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

  async getSummary(request: Request): Promise<Response> {
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
      
      // Calculate current month's expenses using date strings (not timestamps)
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const currentYearMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

      const monthlyExpenses = transactions
        .filter(t => {
          if (t.type !== 'expense') return false;
          // Use date string (YYYY-MM-DD) to avoid timezone issues
          return t.date && t.date.startsWith(currentYearMonth);
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlyIncome = transactions
        .filter(t => {
          if (t.type !== 'income') return false;
          // Use date string (YYYY-MM-DD) to avoid timezone issues
          return t.date && t.date.startsWith(currentYearMonth);
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // Category breakdown
      const categoryBreakdown: Record<string, number> = {};
      transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
          categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
        });
      
      // Sort transactions by timestamp (newest first) and return ALL transactions
      // Frontend needs all transactions to filter by month
      const sortedTransactions = transactions
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      return new Response(JSON.stringify({
        balance: Number(balance.toFixed(2)),
        totalIncome: Number(totalIncome.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        monthlyExpenses: Number(monthlyExpenses.toFixed(2)),
        monthlyIncome: Number(monthlyIncome.toFixed(2)),
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
        monthlyExpenses: 0,
        monthlyIncome: 0,
        categoryBreakdown: {},
        transactions: []
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async setBudget(request: Request): Promise<Response> {
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

  async getBudgets(request: Request): Promise<Response> {
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

  // ===== Conversation Management Endpoints =====
  async getConversationHistory(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const conversationId = url.searchParams.get('conversationId') || 'default';

      const messages = await this.loadConversation(conversationId);

      return new Response(JSON.stringify({
        success: true,
        conversationId,
        messages,
        count: messages.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('getConversationHistory error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to load conversation history',
        messages: []
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async clearConversationHistory(request: Request): Promise<Response> {
    try {
      const body = await request.json() as { conversationId?: string };
      const conversationId = body?.conversationId || 'default';

      await this.clearConversation(conversationId);

      return new Response(JSON.stringify({
        success: true,
        message: `Conversation history cleared for ${conversationId}`
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('clearConversationHistory error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to clear conversation history'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // ===== LLM Receipt Scanner =====
  async scanReceiptLLM(request: Request): Promise<Response> {
    try {
      const body = await request.json() as { image: string; filename?: string };
      if (!body?.image) {
        return new Response(JSON.stringify({ success: false, error: 'Missing image' }), { status: 400 });
      }

      // Create receipt scanner instance
      const scanner = new ReceiptScanner(this.env.AI, this.state.storage);

      // Scan the receipt
      const result = await scanner.scanReceipt(body.image);

      // Return the result
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 200, // Always return 200 for graceful frontend handling
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error: any) {
      console.error('scanReceiptLLM error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error?.message || 'Unknown error',
        note: 'Server error during receipt scan',
        merchant: '',
        amount: 0,
        date: new Date().toISOString().slice(0, 10),
        category: 'other'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Initialize knowledge base with financial articles
   * Works with both ChromaDB and Vectorize
   */
  async initializeKnowledgeBase(): Promise<Response> {
    try {
      const vectorDB = createVectorDB(this.env);
      const dbName = getVectorDBName(this.env);

      await initializeKnowledgeBase(this.env.AI, vectorDB);

      return new Response(JSON.stringify({
        success: true,
        message: `Knowledge base initialized with 12 financial articles using ${dbName}`
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Knowledge base init error:', error);
      return new Response(JSON.stringify({
        success: false,
        message: String(error)
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }
  }

  /**
   * Generate AI-powered financial insights
   */
  async getAIInsights(request: Request): Promise<Response> {
    try {
      // Get all transactions
      const transactions = await this.state.storage.get('transactions') as any[] || [];

      // Get budgets
      const budgets = await this.state.storage.get('budgets') as Record<string, number> || {};

      // Calculate current month data
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlyTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });

      const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlyExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate category spending
      const categorySpending: Record<string, number> = {};
      monthlyTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
          categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
        });

      // Calculate budget performance
      const budgetPerformance: Array<{category: string, spent: number, budget: number, percentage: number}> = [];
      Object.entries(categorySpending).forEach(([category, spent]) => {
        const budget = budgets[category] || 0;
        if (budget > 0) {
          budgetPerformance.push({
            category,
            spent,
            budget,
            percentage: (spent / budget) * 100
          });
        }
      });

      // Sort by percentage over budget
      budgetPerformance.sort((a, b) => b.percentage - a.percentage);

      // Build prompt for LLM
      const prompt = `You are a financial advisor analyzing someone's monthly finances. Provide 3-4 specific, actionable insights based on this data:

MONTHLY SUMMARY:
- Income: $${monthlyIncome.toFixed(2)}
- Expenses: $${monthlyExpenses.toFixed(2)}
- Net: $${(monthlyIncome - monthlyExpenses).toFixed(2)}
- Savings Rate: ${monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1) : 0}%

SPENDING BY CATEGORY:
${Object.entries(categorySpending)
  .sort((a, b) => b[1] - a[1])
  .map(([cat, amount]) => `- ${cat}: $${amount.toFixed(2)} (${((amount/monthlyExpenses)*100).toFixed(1)}%)`)
  .join('\n')}

BUDGET PERFORMANCE:
${budgetPerformance.length > 0
  ? budgetPerformance.map(p => `- ${p.category}: $${p.spent.toFixed(2)} / $${p.budget.toFixed(2)} (${p.percentage.toFixed(1)}%)`)
    .join('\n')
  : 'No budgets set'}

Provide insights in this EXACT format (each insight on a new line, starting with an emoji):
- Use emojis: 💰 for savings, 📊 for spending patterns, 🚨 for warnings, ✅ for achievements, 💡 for tips
- Keep each insight to 1-2 sentences max
- Be specific with numbers
- Focus on actionable advice
- Format: "emoji <strong>Category:</strong> specific insight with numbers"

Example format:
💰 <strong>Savings:</strong> You're saving 25% of your income ($500) - that's excellent!
📊 <strong>Top spending:</strong> Food accounts for 35% of expenses. Consider meal planning to reduce costs.
🚨 <strong>Budget alert:</strong> You're 20% over budget on transportation ($120 overspent).

Generate 3-4 insights now:`;

      // Call LLM
      const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: 'You are a concise financial advisor. Provide exactly 3-4 bullet point insights, each starting with an emoji and following the format shown.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 400
      }) as any;

      let insights = response?.response || '';

      // Clean up the response
      insights = insights
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .filter((line: string) => /^[🏆💰📊🚨✅⚠️💡📈📉🎯]/.test(line.trim())) // Only lines starting with emojis
        .map((line: string) => line.trim())
        .slice(0, 4) // Max 4 insights
        .join('\n');

      // Fallback if AI fails
      if (!insights || insights.length < 20) {
        insights = this.generateFallbackInsights(monthlyIncome, monthlyExpenses, categorySpending, budgetPerformance);
      }

      return new Response(JSON.stringify({
        success: true,
        insights: insights
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('AI insights error:', error);

      // Return fallback insights on error
      const transactions = await this.state.storage.get('transactions') as any[] || [];
      const now = new Date();
      const monthlyTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      });

      const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const monthlyExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return new Response(JSON.stringify({
        success: true,
        insights: `💰 <strong>Monthly summary:</strong> Income: $${monthlyIncome.toFixed(2)}, Expenses: $${monthlyExpenses.toFixed(2)}\n📊 <strong>Net position:</strong> ${monthlyIncome > monthlyExpenses ? 'Saving' : 'Overspending'} $${Math.abs(monthlyIncome - monthlyExpenses).toFixed(2)} this month`
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Generate fallback insights when AI fails
   */
  private generateFallbackInsights(
    income: number,
    expenses: number,
    categorySpending: Record<string, number>,
    budgetPerformance: Array<{category: string, spent: number, budget: number, percentage: number}>
  ): string {
    const insights: string[] = [];

    // Financial health insight
    if (income > expenses) {
      const savingsRate = ((income - expenses) / income * 100).toFixed(1);
      insights.push(`💰 <strong>Great job!</strong> You're saving ${savingsRate}% of your income ($${(income - expenses).toFixed(2)}) this month.`);
    } else {
      const deficit = (expenses - income).toFixed(2);
      insights.push(`⚠️ <strong>Heads up:</strong> You're spending $${deficit} more than your income this month.`);
    }

    // Top spending category
    const sortedCategories = Object.entries(categorySpending).sort((a, b) => b[1] - a[1]);
    if (sortedCategories.length > 0) {
      const [category, amount] = sortedCategories[0];
      const percentage = ((amount / expenses) * 100).toFixed(1);
      insights.push(`📊 <strong>Top spending:</strong> ${category.charAt(0).toUpperCase() + category.slice(1)} accounts for ${percentage}% of expenses ($${amount.toFixed(2)}).`);
    }

    // Budget performance
    const overBudget = budgetPerformance.filter(p => p.percentage > 100);
    if (overBudget.length > 0) {
      const worst = overBudget[0];
      insights.push(`🚨 <strong>Budget alert:</strong> ${worst.category.charAt(0).toUpperCase() + worst.category.slice(1)} is ${(worst.percentage - 100).toFixed(1)}% over budget ($${(worst.spent - worst.budget).toFixed(2)} overspent).`);
    } else if (budgetPerformance.length > 0) {
      insights.push(`✅ <strong>Well done!</strong> You're staying within your budgets across all categories.`);
    }

    return insights.join('\n');
  }
}

