import { describe, it, expect } from 'vitest';
import { generateSampleTransactions } from './sample-data';

describe('Sample Data Generation', () => {
  it('should generate an array of transactions', () => {
    const transactions = generateSampleTransactions();
    expect(Array.isArray(transactions)).toBe(true);
    expect(transactions.length).toBeGreaterThan(0);
  });

  it('should generate transactions with required fields', () => {
    const transactions = generateSampleTransactions();
    const firstTransaction = transactions[0];

    expect(firstTransaction).toHaveProperty('id');
    expect(firstTransaction).toHaveProperty('description');
    expect(firstTransaction).toHaveProperty('amount');
    expect(firstTransaction).toHaveProperty('category');
    expect(firstTransaction).toHaveProperty('type');
    expect(firstTransaction).toHaveProperty('date');
    expect(firstTransaction).toHaveProperty('timestamp');
  });

  it('should generate valid transaction types', () => {
    const transactions = generateSampleTransactions();
    transactions.forEach(tx => {
      expect(['income', 'expense']).toContain(tx.type);
    });
  });

  it('should generate positive amounts', () => {
    const transactions = generateSampleTransactions();
    transactions.forEach(tx => {
      expect(tx.amount).toBeGreaterThan(0);
    });
  });

  it('should generate valid categories', () => {
    const transactions = generateSampleTransactions();
    const validCategories = ['food', 'housing', 'transportation', 'entertainment', 'utilities', 'healthcare', 'shopping', 'other', 'income'];

    transactions.forEach(tx => {
      expect(validCategories).toContain(tx.category);
    });
  });

  it('should generate dates within the last 6 months', () => {
    const transactions = generateSampleTransactions();
    const now = Date.now();
    const sixMonthsAgo = now - (180 * 24 * 60 * 60 * 1000);

    transactions.forEach(tx => {
      expect(tx.timestamp).toBeGreaterThanOrEqual(sixMonthsAgo);
      expect(tx.timestamp).toBeLessThanOrEqual(now);
    });
  });

  it('should generate unique transaction IDs', () => {
    const transactions = generateSampleTransactions();
    const ids = transactions.map(tx => tx.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });
});
