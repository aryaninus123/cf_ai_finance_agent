import { generateSampleTransactions } from './sample-data';
import { APIHandlers } from './api-handlers';

interface Env {
  AI: any;
  VECTORIZE?: any;
  CHROMA_URL?: string;
  CHROMA_API_KEY?: string;
  CHROMA_TENANT?: string;
  CHROMA_DATABASE?: string;
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
    const transactions = await this.state.storage.get('transactions') as any[];
    // Reseed if empty or if no 2026 data exists yet
    const has2026 = transactions && transactions.some((t: any) => t.date && t.date.startsWith('2026'));
    if (!transactions || transactions.length === 0 || !has2026) {
      const sampleTransactions = generateSampleTransactions();
      await this.state.storage.put('transactions', sampleTransactions);
    }
  }

  async fetch(request: Request): Promise<Response> {
    // Ensure we have sample data on first request
    await this.ensureInitialized();
    
    const url = new URL(request.url);
    
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

    // RAG knowledge base initialization endpoint
    if (url.pathname === '/api/init-knowledge-base' && request.method === 'POST') {
      return this.apiHandlers.initializeKnowledgeBase();
    }

    // Conversation management endpoints
    if (url.pathname === '/api/conversation/history' && request.method === 'GET') {
      return this.apiHandlers.getConversationHistory(request);
    }

    if (url.pathname === '/api/conversation/clear' && request.method === 'POST') {
      return this.apiHandlers.clearConversationHistory(request);
    }

    // AI insights endpoint
    if (url.pathname === '/api/ai-insights') {
      return this.apiHandlers.getAIInsights(request);
    }

    // Goals endpoints
    if (url.pathname === '/api/goals') {
      if (request.method === 'GET') return this.apiHandlers.getGoals();
      if (request.method === 'POST') return this.apiHandlers.saveGoal(request);
    }
    if (url.pathname === '/api/goals/delete' && request.method === 'POST') {
      return this.apiHandlers.deleteGoal(request);
    }

    // Net worth endpoints
    if (url.pathname === '/api/net-worth') {
      if (request.method === 'GET') return this.apiHandlers.getNetWorth();
      if (request.method === 'POST') return this.apiHandlers.saveNetWorth(request);
    }

    // Alert history endpoint
    if (url.pathname === '/api/alerts' && request.method === 'GET') {
      return this.apiHandlers.getAlerts();
    }

    // AI features
    if (url.pathname === '/api/suggest-category' && request.method === 'POST') {
      return this.apiHandlers.suggestCategory(request);
    }
    if (url.pathname === '/api/anomalies' && request.method === 'GET') {
      return this.apiHandlers.getAnomalies();
    }
    if (url.pathname === '/api/goal-advice' && request.method === 'POST') {
      return this.apiHandlers.getGoalAdvice(request);
    }

    return new Response('Not Found', { status: 404 });
  }


}

