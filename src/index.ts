import { FinanceAgent } from './simple-agent';

export { FinanceAgent };

// Export as default for Cloudflare Workers
export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    // Get Durable Object instance
    const id = env.FinanceAgent.idFromName('finance-agent-instance');
    const agent = env.FinanceAgent.get(id);
    
    // Forward request to the agent
    return agent.fetch(request);
  }
};
