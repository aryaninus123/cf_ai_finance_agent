/**
 * Vector Database Factory
 * Automatically uses ChromaDB or Vectorize based on environment config
 */

import { ChromaDBAdapter } from './chroma-adapter';

export interface VectorDB {
  insert(vectors: Array<{
    id: string;
    values: number[];
    metadata: any;
  }>): Promise<void>;

  query(
    queryEmbedding: number[],
    options: {
      topK: number;
      returnMetadata?: boolean;
      filter?: any;
    }
  ): Promise<{ matches: Array<{ id: string; score: number; metadata: any }> }>;
}

/**
 * Wrapper for Cloudflare Vectorize to match interface
 */
class VectorizeWrapper implements VectorDB {
  constructor(private vectorize: any) {}

  async insert(vectors: Array<{ id: string; values: number[]; metadata: any }>) {
    await this.vectorize.insert(vectors);
  }

  async query(queryEmbedding: number[], options: any) {
    const result = await this.vectorize.query(queryEmbedding, options);
    // Vectorize returns { matches: [...] } already
    return result;
  }
}

/**
 * Wrapper for ChromaDB to match interface
 */
class ChromaDBWrapper implements VectorDB {
  constructor(private chroma: ChromaDBAdapter) {}

  async insert(vectors: Array<{ id: string; values: number[]; metadata: any }>) {
    await this.chroma.insert(vectors);
  }

  async query(queryEmbedding: number[], options: any) {
    return await this.chroma.query(queryEmbedding, options);
  }
}

/**
 * Create vector database based on environment configuration
 * Priority: ChromaDB > Vectorize > Error
 */
export function createVectorDB(env: any): VectorDB {
  // Check if ChromaDB is configured
  if (env.CHROMA_URL) {
    console.log('🔷 Using ChromaDB as vector database');
    const chroma = new ChromaDBAdapter({
      url: env.CHROMA_URL,
      apiKey: env.CHROMA_API_KEY,
      tenant: env.CHROMA_TENANT,
      database: env.CHROMA_DATABASE
    });
    return new ChromaDBWrapper(chroma);
  }

  // Fall back to Vectorize
  if (env.VECTORIZE) {
    console.log('🟦 Using Cloudflare Vectorize as vector database');
    return new VectorizeWrapper(env.VECTORIZE);
  }

  throw new Error('No vector database configured! Set either CHROMA_URL or VECTORIZE binding');
}

/**
 * Get the name of the active vector database
 */
export function getVectorDBName(env: any): string {
  if (env.CHROMA_URL) return 'ChromaDB';
  if (env.VECTORIZE) return 'Vectorize';
  return 'None';
}
