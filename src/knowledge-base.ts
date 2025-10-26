/**
 * Financial Knowledge Base for RAG
 * Contains curated financial advice, tips, and best practices
 */

export interface KnowledgeEntry {
  id: string;
  content: string;
  category: string;
  tags: string[];
  source?: string;
}

export const FINANCIAL_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "budgeting-50-30-20",
    content: `The 50/30/20 Budgeting Rule is a simple framework for managing your finances:
    - 50% of income goes to NEEDS (housing, utilities, groceries, transportation, minimum debt payments)
    - 30% of income goes to WANTS (dining out, entertainment, hobbies, subscriptions)
    - 20% of income goes to SAVINGS (emergency fund, retirement, investments, extra debt payments)

    This rule helps ensure you're living within your means while still saving for the future. Adjust percentages based on your situation - if you live in a high-cost area, needs might be 60%.`,
    category: "budgeting",
    tags: ["budgeting", "savings", "planning", "money management"]
  },
  {
    id: "emergency-fund-basics",
    content: `An emergency fund is money set aside to cover unexpected expenses like medical bills, car repairs, or job loss.

    Target: 3-6 months of essential expenses
    - Start small: Even $500-$1000 provides a cushion
    - Keep it accessible: High-yield savings account, not invested
    - Build gradually: Set aside 10-15% of each paycheck
    - Don't touch it: Only for true emergencies

    Having an emergency fund prevents you from going into debt when unexpected costs arise.`,
    category: "savings",
    tags: ["emergency fund", "savings", "financial security", "planning"]
  },
  {
    id: "grocery-savings-tips",
    content: `Proven strategies to reduce grocery spending without sacrificing nutrition:

    1. Meal plan before shopping - reduces impulse purchases
    2. Buy store brands - often 20-30% cheaper than name brands
    3. Use cash-back apps - Ibotta, Fetch Rewards can save 5-10%
    4. Buy in bulk for non-perishables - rice, pasta, canned goods
    5. Shop sales and seasonal produce - plan meals around what's on sale
    6. Avoid shopping hungry - leads to unnecessary purchases
    7. Freeze extras - buy meat on sale and freeze portions
    8. Track unit prices - bigger isn't always cheaper

    Average savings: $100-200/month for a family of 4`,
    category: "food",
    tags: ["groceries", "food", "savings", "meal planning"]
  },
  {
    id: "credit-card-debt-payoff",
    content: `Two main strategies for paying off credit card debt:

    AVALANCHE METHOD (mathematically optimal):
    - Pay minimums on all cards
    - Put extra money toward highest interest rate card
    - Saves the most money in interest
    - Best for disciplined savers

    SNOWBALL METHOD (psychological wins):
    - Pay minimums on all cards
    - Put extra money toward smallest balance
    - Quick wins build motivation
    - Better for staying motivated

    Either way: Stop using the cards, pay more than minimum, and consider balance transfer to 0% APR card if available.`,
    category: "debt",
    tags: ["debt", "credit cards", "debt payoff", "interest"]
  },
  {
    id: "transportation-cost-reduction",
    content: `Ways to reduce transportation costs:

    VEHICLE OWNERSHIP:
    - Shop insurance annually - can save $200-400/year
    - Maintain your car - regular oil changes prevent expensive repairs
    - Drive efficiently - aggressive driving wastes 15-30% more gas
    - Consider downsizing - smaller cars cost less to maintain and fuel

    ALTERNATIVES:
    - Public transit - often 50-70% cheaper than car ownership
    - Carpool - split costs with coworkers
    - Bike for short trips - saves money and improves health
    - Work from home - negotiate remote days to reduce commute costs

    Average car ownership cost: $9,000-12,000/year including depreciation, insurance, gas, maintenance.`,
    category: "transportation",
    tags: ["transportation", "car", "commute", "savings", "public transit"]
  },
  {
    id: "subscription-audit",
    content: `Most people spend $200-300/month on subscriptions they barely use.

    How to audit subscriptions:
    1. Review bank statements for last 3 months
    2. List all recurring charges (streaming, apps, gym, software, etc.)
    3. Ask: "Do I use this weekly?" If no, cancel
    4. Negotiate: Call providers to ask for discounts (works 60% of the time)
    5. Share accounts: Many services allow multiple users
    6. Rotate subscriptions: Netflix one month, Hulu the next

    Common forgotten subscriptions:
    - Gym memberships ($50/month average)
    - Streaming services ($15-20 each)
    - App subscriptions ($5-10 each)
    - Software tools no longer needed

    Canceling just 3-4 unused subscriptions can save $50-100/month.`,
    category: "entertainment",
    tags: ["subscriptions", "streaming", "savings", "budget cuts"]
  },
  {
    id: "dining-out-savings",
    content: `Americans spend an average of $3,000/year dining out. Ways to save while still enjoying restaurants:

    1. Set a dining budget - $100-200/month is reasonable
    2. Use the "one meal out per week" rule
    3. Take advantage of happy hours - same food, 30-50% off
    4. Pack lunch for work - saves $8-12/day = $2,000/year
    5. Cook double portions - leftovers for next day's lunch
    6. Use restaurant rewards apps - get free meals after points
    7. Save restaurants for special occasions
    8. Try cheaper cuisine - local tacos vs fancy steakhouse

    Meal prep Sunday → $10/meal restaurant becomes $3/meal homemade`,
    category: "food",
    tags: ["dining out", "restaurants", "food", "savings", "meal prep"]
  },
  {
    id: "housing-cost-optimization",
    content: `Housing should be no more than 30% of gross income. Ways to optimize:

    RENTERS:
    - Negotiate rent renewal - landlords prefer keeping good tenants
    - Get roommates - split costs 50-70%
    - Move to cheaper area - even 15 min further can save $200-400/month
    - Ask about utilities included

    HOMEOWNERS:
    - Refinance if rates dropped - can save $100-300/month
    - Appeal property taxes - often inflated
    - DIY simple repairs - YouTube tutorials save labor costs
    - Improve energy efficiency - LED bulbs, programmable thermostat

    Hidden costs: Factor in commute time/cost when choosing location.`,
    category: "housing",
    tags: ["housing", "rent", "mortgage", "savings", "real estate"]
  },
  {
    id: "healthcare-cost-reduction",
    content: `Healthcare costs can be reduced through strategic planning:

    INSURANCE:
    - Use HSA (Health Savings Account) - triple tax advantage
    - Choose in-network providers - 40-60% cheaper
    - Compare costs on provider websites before procedures
    - Use generic medications - 80-90% cheaper than brand name

    PREVENTIVE CARE:
    - Get annual checkups - catch issues early when cheaper to treat
    - Use FSA for predictable costs (glasses, dental)
    - Ask for itemized bills - errors are common
    - Negotiate medical bills - hospitals often accept 30-50% less

    PRESCRIPTIONS:
    - Use GoodRx or similar apps - can save 50-80%
    - Ask doctor for samples
    - Buy 90-day supplies - cheaper per dose
    - Check if manufacturer offers patient assistance`,
    category: "healthcare",
    tags: ["healthcare", "insurance", "medical", "prescriptions", "HSA"]
  },
  {
    id: "impulse-purchase-prevention",
    content: `Impulse purchases can derail budgets. Strategies to resist:

    THE 24-HOUR RULE:
    - Wait 24 hours before buying anything over $50
    - For items over $100, wait 3-7 days
    - Often the urge passes

    UNSUBSCRIBE FROM MARKETING:
    - Email promotions trigger impulse buys
    - Remove saved credit cards from shopping sites
    - Delete shopping apps from phone

    TRACK YOUR TRIGGERS:
    - Bored? Stressed? Emotional shopping is real
    - Find free alternatives - walk, call friend, hobby

    ASK QUESTIONS:
    - "Do I need this or want this?"
    - "Will I still want this in a week?"
    - "How many hours did I work to afford this?"

    Studies show 70% of purchases over $25 are impulse buys.`,
    category: "shopping",
    tags: ["impulse buying", "shopping", "savings", "psychology", "budget"]
  },
  {
    id: "side-hustle-ideas",
    content: `Increase income with side hustles (2-10 hours/week):

    REMOTE/FLEXIBLE:
    - Freelance writing - $25-100/hour
    - Virtual assistant - $15-30/hour
    - Online tutoring - $20-60/hour
    - Website testing - $10-30/test
    - Transcription - $15-25/hour

    LOCAL:
    - Dog walking/sitting - $15-30/walk
    - Food delivery - $15-25/hour
    - Handyman services - $30-75/hour
    - House cleaning - $25-50/hour

    PASSIVE INCOME:
    - Rent spare room (Airbnb) - $500-2000/month
    - Sell digital products - varies
    - Rent parking space - $100-300/month

    Even an extra $500/month = $6,000/year toward debt or savings.`,
    category: "income",
    tags: ["side hustle", "income", "freelance", "gig economy", "extra money"]
  },
  {
    id: "retirement-savings-basics",
    content: `Retirement savings should start as early as possible due to compound interest:

    401(k) STRATEGY:
    - Contribute enough to get full employer match (free money!)
    - Aim for 15% of gross income total retirement savings
    - Increase contribution 1% per year
    - Max contribution 2025: $23,000 (under 50)

    IRA OPTIONS:
    - Traditional IRA - tax deduction now, pay taxes in retirement
    - Roth IRA - pay taxes now, tax-free in retirement
    - Max contribution 2025: $7,000

    THE POWER OF TIME:
    - Start at 25, save $200/month → $470,000 by 65 (7% return)
    - Start at 35, save $200/month → $227,000 by 65
    - Start at 45, save $200/month → $99,000 by 65

    Don't touch retirement accounts early - 10% penalty + taxes.`,
    category: "retirement",
    tags: ["retirement", "401k", "IRA", "investing", "savings", "compound interest"]
  }
];

/**
 * Initialize knowledge base by generating embeddings and storing in vector database
 * Works with both ChromaDB and Vectorize
 */
export async function initializeKnowledgeBase(
  ai: any,
  vectorDB: any
): Promise<void> {
  console.log(`Initializing knowledge base with ${FINANCIAL_KNOWLEDGE.length} entries...`);

  const vectors = [];

  for (const entry of FINANCIAL_KNOWLEDGE) {
    // Generate embedding for the content
    const embedding = await ai.run('@cf/baai/bge-base-en-v1.5', {
      text: `${entry.category}: ${entry.content}`
    });

    vectors.push({
      id: entry.id,
      values: embedding.data[0],
      metadata: {
        content: entry.content,
        category: entry.category,
        tags: entry.tags,
        source: entry.source || 'builtin',
        indexType: 'knowledge' // Mark as knowledge base entry
      }
    });
  }

  // Insert all vectors at once (works with both ChromaDB and Vectorize)
  await vectorDB.insert(vectors);
  console.log(`✅ Knowledge base initialized successfully! (${FINANCIAL_KNOWLEDGE.length} articles)`);
}

/**
 * Retrieve relevant knowledge based on user query
 * Works with both ChromaDB and Vectorize
 */
export async function retrieveRelevantKnowledge(
  query: string,
  ai: any,
  vectorDB: any,
  topK: number = 3
): Promise<KnowledgeEntry[]> {
  // Generate embedding for the query
  const queryEmbedding = await ai.run('@cf/baai/bge-base-en-v1.5', {
    text: query
  });

  // Search vector database for similar content
  const results = await vectorDB.query(queryEmbedding.data[0], {
    topK,
    returnMetadata: true,
    filter: { indexType: 'knowledge' } // Only search knowledge base entries
  });

  // Convert results back to knowledge entries
  return results.matches.map((match: any) => ({
    id: match.id,
    content: match.metadata.content,
    category: match.metadata.category,
    tags: match.metadata.tags,
    source: match.metadata.source,
    score: match.score
  }));
}
