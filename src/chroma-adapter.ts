/**
 * ChromaDB Adapter for Finance Agent
 * Replaces Cloudflare Vectorize with ChromaDB
 */

interface ChromaConfig {
  url: string;
  apiKey?: string;
  tenant?: string;
  database?: string;
}

interface ChromaVector {
  id: string;
  embedding: number[];
  metadata: any;
  document?: string;
}

export class ChromaDBAdapter {
  private baseUrl: string;
  private headers: Record<string, string>;
  private collectionName: string;

  constructor(config: ChromaConfig, collectionName: string = 'finance-knowledge') {
    this.baseUrl = config.url.replace(/\/$/, ''); // Remove trailing slash
    this.collectionName = collectionName;

    this.headers = {
      'Content-Type': 'application/json'
    };

    // Add authentication if provided
    if (config.apiKey) {
      this.headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    // Add tenant/database headers if using Chroma Cloud
    if (config.tenant) {
      this.headers['X-Chroma-Tenant'] = config.tenant;
    }
    if (config.database) {
      this.headers['X-Chroma-Database'] = config.database;
    }
  }

  /**
   * Initialize collection (create if doesn't exist)
   */
  async initCollection(): Promise<void> {
    try {
      // Try to get existing collection
      const response = await fetch(
        `${this.baseUrl}/api/v1/collections/${this.collectionName}`,
        {
          method: 'GET',
          headers: this.headers
        }
      );

      if (response.ok) {
        console.log(`Collection '${this.collectionName}' already exists`);
        return;
      }

      // Create new collection if it doesn't exist
      const createResponse = await fetch(
        `${this.baseUrl}/api/v1/collections`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            name: this.collectionName,
            metadata: {
              description: 'Financial knowledge base and transaction embeddings'
            }
          })
        }
      );

      if (!createResponse.ok) {
        const error = await createResponse.text();
        throw new Error(`Failed to create collection: ${error}`);
      }

      console.log(`Collection '${this.collectionName}' created successfully`);
    } catch (error) {
      console.error('Error initializing collection:', error);
      throw error;
    }
  }

  /**
   * Insert vectors into ChromaDB
   * Compatible with Vectorize API format
   */
  async insert(vectors: Array<{
    id: string;
    values: number[];
    metadata: any;
  }>): Promise<void> {
    if (vectors.length === 0) return;

    try {
      // Ensure collection exists
      await this.initCollection();

      // ChromaDB expects: ids, embeddings, metadatas, documents
      const ids = vectors.map(v => v.id);
      const embeddings = vectors.map(v => v.values);
      const metadatas = vectors.map(v => v.metadata);

      // Use content as document if available (for better search)
      const documents = vectors.map(v =>
        v.metadata.content || v.metadata.description || v.id
      );

      const response = await fetch(
        `${this.baseUrl}/api/v1/collections/${this.collectionName}/add`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            ids,
            embeddings,
            metadatas,
            documents
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ChromaDB insert failed: ${error}`);
      }

      console.log(`Successfully inserted ${vectors.length} vectors into ChromaDB`);
    } catch (error) {
      console.error('ChromaDB insert error:', error);
      throw error;
    }
  }

  /**
   * Query ChromaDB for similar vectors
   * Compatible with Vectorize API format
   */
  async query(
    queryEmbedding: number[],
    options: {
      topK: number;
      returnMetadata?: boolean;
      filter?: any;
    }
  ): Promise<{ matches: Array<{ id: string; score: number; metadata: any }> }> {
    try {
      // Ensure collection exists
      await this.initCollection();

      const requestBody: any = {
        query_embeddings: [queryEmbedding],
        n_results: options.topK,
        include: ['metadatas', 'distances', 'documents']
      };

      // Add filter if provided (ChromaDB uses where clause)
      if (options.filter) {
        requestBody.where = options.filter;
      }

      const response = await fetch(
        `${this.baseUrl}/api/v1/collections/${this.collectionName}/query`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ChromaDB query failed: ${error}`);
      }

      const data = await response.json() as any;

      // ChromaDB returns results in a different format than Vectorize
      // Need to transform it to match Vectorize API
      const matches: Array<{ id: string; score: number; metadata: any }> = [];

      if (data.ids && data.ids[0]) {
        for (let i = 0; i < data.ids[0].length; i++) {
          matches.push({
            id: data.ids[0][i],
            // ChromaDB returns distances, convert to similarity score (1 - distance)
            // Cosine distance is already in [0, 2], so we normalize to [0, 1]
            score: data.distances && data.distances[0]
              ? 1 - (data.distances[0][i] / 2)
              : 1.0,
            metadata: data.metadatas && data.metadatas[0]
              ? data.metadatas[0][i]
              : {}
          });
        }
      }

      return { matches };
    } catch (error) {
      console.error('ChromaDB query error:', error);
      throw error;
    }
  }

  /**
   * Get collection stats
   */
  async getStats(): Promise<{ count: number; name: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/collections/${this.collectionName}`,
        {
          method: 'GET',
          headers: this.headers
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get collection stats');
      }

      const data = await response.json() as any;
      return {
        count: data.count || 0,
        name: data.name
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { count: 0, name: this.collectionName };
    }
  }

  /**
   * Delete vectors by IDs
   */
  async delete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/collections/${this.collectionName}/delete`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ ids })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ChromaDB delete failed: ${error}`);
      }

      console.log(`Deleted ${ids.length} vectors from ChromaDB`);
    } catch (error) {
      console.error('ChromaDB delete error:', error);
      throw error;
    }
  }

  /**
   * Check if ChromaDB is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/heartbeat`, {
        method: 'GET',
        headers: this.headers
      });
      return response.ok;
    } catch (error) {
      console.error('ChromaDB health check failed:', error);
      return false;
    }
  }
}

/**
 * Factory function to create ChromaDB adapter from environment
 */
export function createChromaDB(env: any): ChromaDBAdapter {
  const config: ChromaConfig = {
    url: env.CHROMA_URL || 'http://localhost:8000',
    apiKey: env.CHROMA_API_KEY,
    tenant: env.CHROMA_TENANT,
    database: env.CHROMA_DATABASE
  };

  return new ChromaDBAdapter(config);
}
