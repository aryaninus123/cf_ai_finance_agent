/**
 * RAG (Retrieval-Augmented Generation) Handler
 * Enhances AI responses with retrieved context from knowledge base and transaction history
 */

import { retrieveRelevantKnowledge, KnowledgeEntry } from './knowledge-base';

export interface RAGContext {
  knowledgeEntries: KnowledgeEntry[];
  similarTransactions?: any[];
  spendingPatterns?: any;
}

/**
 * Embed and store a transaction for semantic search
 * Works with both ChromaDB and Vectorize
 */
export async function indexTransaction(
  transaction: any,
  ai: any,
  vectorDB: any
): Promise<void> {
  const embedding = await ai.run('@cf/baai/bge-base-en-v1.5', {
    text: `${transaction.description} ${transaction.category} ${transaction.type}`
  });

  await vectorDB.insert([{
    id: `transaction_${transaction.id}`,
    values: embedding.data[0],
    metadata: {
      ...transaction,
      indexType: 'transaction'
    }
  }]);
}

/**
 * Semantic search over transactions
 * Works with both ChromaDB and Vectorize
 */
export async function searchTransactions(
  query: string,
  ai: any,
  vectorDB: any,
  topK: number = 5
): Promise<any[]> {
  const queryEmbedding = await ai.run('@cf/baai/bge-base-en-v1.5', {
    text: query
  });

  const results = await vectorDB.query(queryEmbedding.data[0], {
    topK,
    returnMetadata: true,
    filter: { indexType: 'transaction' }
  });

  return results.matches.map((match: any) => ({
    ...match.metadata,
    relevanceScore: match.score
  }));
}

/**
 * Generate monthly spending pattern embedding
 * Works with both ChromaDB and Vectorize
 */
export async function indexMonthlyPattern(
  month: string,
  year: number,
  categoryTotals: { [key: string]: number },
  ai: any,
  vectorDB: any
): Promise<void> {
  // Create a text representation of spending pattern
  const patternText = `
    Month: ${month} ${year}
    Food spending: $${categoryTotals.food || 0}
    Transportation: $${categoryTotals.transportation || 0}
    Entertainment: $${categoryTotals.entertainment || 0}
    Shopping: $${categoryTotals.shopping || 0}
    Housing: $${categoryTotals.housing || 0}
    Healthcare: $${categoryTotals.healthcare || 0}
    Total: $${Object.values(categoryTotals).reduce((a, b) => a + b, 0)}
  `.trim();

  const embedding = await ai.run('@cf/baai/bge-base-en-v1.5', {
    text: patternText
  });

  await vectorDB.insert([{
    id: `pattern_${month}_${year}`,
    values: embedding.data[0],
    metadata: {
      month,
      year,
      categoryTotals,
      patternText,
      indexType: 'monthly_pattern'
    }
  }]);
}

/**
 * Find similar spending months
 * Works with both ChromaDB and Vectorize
 */
export async function findSimilarSpendingMonths(
  currentCategoryTotals: { [key: string]: number },
  ai: any,
  vectorDB: any,
  topK: number = 2
): Promise<any[]> {
  const currentPattern = `
    Food spending: $${currentCategoryTotals.food || 0}
    Transportation: $${currentCategoryTotals.transportation || 0}
    Entertainment: $${currentCategoryTotals.entertainment || 0}
    Shopping: $${currentCategoryTotals.shopping || 0}
    Housing: $${currentCategoryTotals.housing || 0}
    Healthcare: $${currentCategoryTotals.healthcare || 0}
  `.trim();

  const embedding = await ai.run('@cf/baai/bge-base-en-v1.5', {
    text: currentPattern
  });

  const results = await vectorDB.query(embedding.data[0], {
    topK,
    returnMetadata: true,
    filter: { indexType: 'monthly_pattern' }
  });

  return results.matches.map((match: any) => match.metadata);
}

/**
 * Main RAG retrieval function - gets relevant context for a user query
 * Works with both ChromaDB and Vectorize
 */
export async function retrieveContext(
  userQuery: string,
  transactions: any[],
  ai: any,
  vectorDB: any
): Promise<RAGContext> {
  // 1. Get relevant knowledge base articles
  const knowledgeEntries = await retrieveRelevantKnowledge(
    userQuery,
    ai,
    vectorDB,
    3 // Top 3 most relevant articles
  );

  // 2. Optionally search for similar transactions
  let similarTransactions: any[] = [];

  // Check if query is about transactions/spending
  const isTransactionQuery = /spent|spending|bought|purchased|transactions|expenses/i.test(userQuery);
  if (isTransactionQuery) {
    try {
      similarTransactions = await searchTransactions(userQuery, ai, vectorDB, 5);
    } catch (err) {
      console.log('Transaction search skipped:', err);
    }
  }

  return {
    knowledgeEntries,
    similarTransactions
  };
}

/**
 * Build enhanced prompt with RAG context
 */
export function buildRAGPrompt(
  userQuery: string,
  ragContext: RAGContext,
  financialSummary: any
): string {
  let prompt = '';

  // Add knowledge base context
  if (ragContext.knowledgeEntries && ragContext.knowledgeEntries.length > 0) {
    prompt += '## Relevant Financial Knowledge:\n\n';
    ragContext.knowledgeEntries.forEach((entry, idx) => {
      prompt += `### ${idx + 1}. ${entry.category.toUpperCase()}\n`;
      prompt += `${entry.content}\n\n`;
    });
  }

  // Add similar transactions if available
  if (ragContext.similarTransactions && ragContext.similarTransactions.length > 0) {
    prompt += '## Similar Past Transactions:\n';
    ragContext.similarTransactions.forEach((txn) => {
      prompt += `- ${txn.date}: ${txn.description} - $${txn.amount} (${txn.category})\n`;
    });
    prompt += '\n';
  }

  // Add current financial state
  prompt += `## Current Financial Summary:\n`;
  prompt += `- Monthly Income: $${financialSummary.income}\n`;
  prompt += `- Monthly Expenses: $${financialSummary.expenses}\n`;
  prompt += `- Current Balance: $${financialSummary.balance}\n\n`;

  if (financialSummary.categoryBreakdown) {
    prompt += `### Spending by Category:\n`;
    Object.entries(financialSummary.categoryBreakdown).forEach(([category, amount]) => {
      prompt += `- ${category}: $${amount}\n`;
    });
    prompt += '\n';
  }

  // Add user query
  prompt += `## User Question:\n${userQuery}\n\n`;
  prompt += `Using the knowledge base and financial data above, provide personalized, actionable advice.`;

  return prompt;
}

/**
 * Suggest transaction category based on similar past transactions
 * Works with both ChromaDB and Vectorize
 */
export async function suggestCategory(
  description: string,
  ai: any,
  vectorDB: any
): Promise<{ category: string; confidence: number }> {
  try {
    const similarTransactions = await searchTransactions(
      description,
      ai,
      vectorDB,
      5
    );

    if (similarTransactions.length === 0) {
      return { category: 'other', confidence: 0 };
    }

    // Count category occurrences
    const categoryCounts: { [key: string]: number } = {};
    similarTransactions.forEach(txn => {
      categoryCounts[txn.category] = (categoryCounts[txn.category] || 0) + 1;
    });

    // Find most common category
    let maxCount = 0;
    let suggestedCategory = 'other';

    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        suggestedCategory = category;
      }
    });

    const confidence = maxCount / similarTransactions.length;

    return {
      category: suggestedCategory,
      confidence
    };
  } catch (err) {
    console.error('Category suggestion error:', err);
    return { category: 'other', confidence: 0 };
  }
}
