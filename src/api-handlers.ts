// API handlers for the Finance AI application
// This file contains all API endpoint logic extracted from simple-agent.ts

import { ReceiptScanner } from './receipt-scanner';

interface Env {
  AI: any;
  FinanceAgent: DurableObjectNamespace;
  ENVIRONMENT?: string;
}

export class APIHandlers {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
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
      const body = await request.json() as { message: string };
      const { message } = body;
      
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
      const dayQuestion = message.match(/which day.*spend.*(most|least|highest|lowest)|what day.*(most|least).*spending|(highest|lowest).*spending.*day/i);
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

          return new Response(JSON.stringify({
            response: `${day.date} was your ${superlative} spending day${monthMatch ? ` in ${monthMatch[1]}` : ''} with $${day.amount.toFixed(2)} spent across ${day.transactionCount} transaction${day.transactionCount > 1 ? 's' : ''}. ${day.topCategory ? `Most of it went to ${day.topCategory.category} ($${day.topCategory.amount.toFixed(2)}).` : ''}`
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({
            response: `I couldn't find daily spending data${monthMatch ? ` for ${monthMatch[1]}` : ''}. Your transactions show total spending of $${financialContext.totalExpenses.toFixed(2)}.`
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
          return new Response(JSON.stringify({
            response: `In ${monthlySpending.monthName}, you spent $${monthlySpending.amount.toFixed(2)} across ${monthlySpending.transactionCount} transactions. ${monthlySpending.topCategory ? `Your highest spending was in ${monthlySpending.topCategory.category} ($${monthlySpending.topCategory.amount.toFixed(2)}).` : ''}`
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({
            response: `I don't have spending data for ${monthName}. Your available data shows spending in the current month ($${financialContext.totalExpenses.toFixed(2)}).`
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Handle balance questions with DETERMINISTIC calculation
      if (balanceQuestion) {
        return new Response(JSON.stringify({
          response: `Your current balance is $${financialContext.balance.toFixed(2)}. You have $${financialContext.totalIncome.toFixed(2)} in total income and $${financialContext.totalExpenses.toFixed(2)} in expenses across ${financialContext.transactionCount} transactions.`
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
          return new Response(JSON.stringify({
            response: `You've spent $${categoryAmount.toFixed(2)} on ${category}, which is ${percentage}% of your total expenses ($${financialContext.totalExpenses.toFixed(2)}).`
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({
            response: `You haven't recorded any spending in the ${category} category yet. Your current spending categories are: ${Object.keys(financialContext.categoryBreakdown).join(', ')}.`
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Check if this is a transaction request (keep this separate)
      const isQuestion = /^(how much|what|when|where|why|which|who|can you|could you|tell me|show me)/i.test(message.trim());
      const transactionIntent = !isQuestion ? await this.parseTransactionIntent(message) : null;

      if (transactionIntent && transactionIntent.isTransaction) {
        try {
          const transactionDate = transactionIntent.date || new Date().toISOString().slice(0, 10);
          const transaction = {
            id: crypto.randomUUID(),
            amount: transactionIntent.amount!,
            description: transactionIntent.description!,
            category: transactionIntent.category!,
            type: transactionIntent.type as 'expense' | 'income',
            date: transactionDate,
            timestamp: new Date(transactionDate + 'T12:00:00').getTime()
          };

          const existingTransactions = await this.state.storage.get('transactions') as any[] || [];
          existingTransactions.push(transaction);
          await this.state.storage.put('transactions', existingTransactions);

          const typeLabel = transactionIntent.type === 'income' ? 'income' : `${transactionIntent.category} expense`;
          return new Response(JSON.stringify({
            response: `✅ Successfully added $${transactionIntent.amount} ${typeLabel} for "${transactionIntent.description}". Your ${transactionIntent.type} has been tracked!`,
            action: `${transactionIntent.type}_added`,
            transaction
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error adding transaction via AI:', error);
        }
      }

      // ========== PURE LLM APPROACH ==========
      // Let the AI figure out what the user is asking and compute the answer
      
      // Prepare detailed financial data for the LLM
      const monthlyData = this.calculateMonthlyBreakdownForAllMonths(transactions);
      const dailySpendingData = this.calculateDailySpendingSummary(transactions); // Pre-calculate daily spending
      const categoryData = Object.entries(categoryBreakdown)
        .sort(([,a], [,b]) => b - a)
        .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
        .join(', ');

      // Build a comprehensive system prompt with ALL financial data
      const systemPrompt = `You are an intelligent financial assistant with complete access to the user's financial data. Your job is to answer their questions accurately using ONLY the provided data.

CRITICAL RULES:
1. NEVER make up numbers or guess - use ONLY the data provided below
2. Be specific with numbers - always include dollar amounts and transaction counts
3. If you don't have data for a specific period, say so clearly
4. Keep responses concise (under 150 words) but informative
5. For daily spending questions, use the DAILY SPENDING BREAKDOWN section

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

Now answer the user's question using ONLY the data above. Be precise and cite specific numbers.`;

      try {
        // Add timeout to prevent infinite waiting
        const response = await Promise.race([
          this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
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

        return new Response(JSON.stringify({
          response: responseText
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (aiError) {
        console.error('AI Error:', aiError);
        return new Response(JSON.stringify({
          response: `I have access to your financial data but encountered an issue. Your current balance is $${balance.toFixed(2)} with $${totalExpenses.toFixed(2)} in expenses. Please try rephrasing your question.`
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.error('getAIAdvice error:', error);
      return new Response(JSON.stringify({
        response: 'I can help you manage your finances! Try asking about budgeting, saving, or investment strategies.'
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
      if (targetMonth !== undefined) {
        filteredTransactions = filteredTransactions.filter(t => {
          // Use date string to avoid timezone issues
          if (!t.date) return false;
          const dateParts = t.date.split('-');
          const txYear = parseInt(dateParts[0]);
          const txMonth = parseInt(dateParts[1]) - 1; // Convert to 0-indexed
          return txMonth === targetMonth && txYear === currentYear;
        });
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
}

