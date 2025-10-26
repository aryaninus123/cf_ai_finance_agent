/**
 * Vector Database Abstraction Layer
 * Allows swapping between Vectorize, Pinecone, ChromaDB, etc.
 */

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: any;
}

export interface VectorDBInterface {
  /**
   * Insert vectors into the database
   */
  insert(vectors: Array<{
    id: string;
    values: number[];
    metadata: any;
  }>): Promise<void>;

  /**
   * Search for similar vectors
   */
  query(
    vector: number[],
    options: {
      topK: number;
      filter?: any;
      returnMetadata?: boolean;
    }
  ): Promise<{ matches: VectorSearchResult[] }>;
}

/**
 * Cloudflare Vectorize Implementation
 */
export class VectorizeAdapter implements VectorDBInterface {
  constructor(private vectorize: any) {}

  async insert(vectors: Array<{ id: string; values: number[]; metadata: any }>) {
    await this.vectorize.insert(vectors);
  }

  async query(vector: number[], options: any) {
    return await this.vectorize.query(vector, options);
  }
}

/**
 * Pinecone Implementation
 */
export class PineconeAdapter implements VectorDBInterface {
  constructor(
    private apiKey: string,
    private environment: string,
    private indexName: string
  ) {}

  async insert(vectors: Array<{ id: string; values: number[]; metadata: any }>) {
    // Call Pinecone API
    const response = await fetch(
      `https://${this.indexName}-${this.environment}.svc.pinecone.io/vectors/upsert`,
      {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vectors })
      }
    );

    if (!response.ok) {
      throw new Error(`Pinecone insert failed: ${response.statusText}`);
    }
  }

  async query(vector: number[], options: any) {
    const response = await fetch(
      `https://${this.indexName}-${this.environment}.svc.pinecone.io/query`,
      {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vector,
          topK: options.topK,
          includeMetadata: options.returnMetadata ?? true,
          filter: options.filter
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Pinecone query failed: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return { matches: data.matches };
  }
}

/**
 * Supabase (pgvector) Implementation
 */
export class SupabaseAdapter implements VectorDBInterface {
  constructor(
    private supabaseUrl: string,
    private supabaseKey: string
  ) {}

  async insert(vectors: Array<{ id: string; values: number[]; metadata: any }>) {
    const response = await fetch(`${this.supabaseUrl}/rest/v1/documents`, {
      method: 'POST',
      headers: {
        'apikey': this.supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(
        vectors.map(v => ({
          id: v.id,
          embedding: v.values,
          metadata: v.metadata
        }))
      )
    });

    if (!response.ok) {
      throw new Error(`Supabase insert failed: ${response.statusText}`);
    }
  }

  async query(vector: number[], options: any) {
    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/rpc/match_documents`,
      {
        method: 'POST',
        headers: {
          'apikey': this.supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query_embedding: vector,
          match_threshold: 0.7,
          match_count: options.topK
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase query failed: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return {
      matches: data.map((item: any) => ({
        id: item.id,
        score: item.similarity,
        metadata: item.metadata
      }))
    };
  }
}

/**
 * In-Memory Implementation (for small datasets)
 */
export class InMemoryAdapter implements VectorDBInterface {
  private vectors: Map<string, { values: number[]; metadata: any }> = new Map();

  async insert(vectors: Array<{ id: string; values: number[]; metadata: any }>) {
    vectors.forEach(v => {
      this.vectors.set(v.id, { values: v.values, metadata: v.metadata });
    });
  }

  async query(vector: number[], options: any) {
    const results: VectorSearchResult[] = [];

    for (const [id, stored] of this.vectors.entries()) {
      const score = this.cosineSimilarity(vector, stored.values);
      results.push({
        id,
        score,
        metadata: stored.metadata
      });
    }

    // Sort by score descending and take top K
    results.sort((a, b) => b.score - a.score);
    return { matches: results.slice(0, options.topK) };
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}

/**
 * Factory function to create the appropriate adapter
 */
export function createVectorDB(env: any): VectorDBInterface {
  // Check which vector DB to use based on environment variables
  if (env.PINECONE_API_KEY) {
    return new PineconeAdapter(
      env.PINECONE_API_KEY,
      env.PINECONE_ENVIRONMENT,
      env.PINECONE_INDEX
    );
  } else if (env.SUPABASE_URL) {
    return new SupabaseAdapter(env.SUPABASE_URL, env.SUPABASE_KEY);
  } else if (env.VECTORIZE) {
    return new VectorizeAdapter(env.VECTORIZE);
  } else {
    // Fallback to in-memory for small datasets
    return new InMemoryAdapter();
  }
}
