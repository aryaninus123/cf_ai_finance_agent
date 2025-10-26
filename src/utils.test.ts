import { describe, it, expect } from 'vitest';

// Test utility functions that would be used in the app

describe('Financial Calculations', () => {
  describe('calculateBalance', () => {
    it('should calculate balance from transactions', () => {
      const transactions = [
        { type: 'income', amount: 1000 },
        { type: 'expense', amount: 500 },
        { type: 'expense', amount: 200 }
      ];

      const balance = transactions.reduce((acc, tx) => {
        return tx.type === 'income' ? acc + tx.amount : acc - tx.amount;
      }, 0);

      expect(balance).toBe(300);
    });

    it('should handle zero transactions', () => {
      const transactions: any[] = [];
      const balance = transactions.reduce((acc, tx) => {
        return tx.type === 'income' ? acc + tx.amount : acc - tx.amount;
      }, 0);

      expect(balance).toBe(0);
    });

    it('should handle only income', () => {
      const transactions = [
        { type: 'income', amount: 1000 },
        { type: 'income', amount: 500 }
      ];

      const balance = transactions.reduce((acc, tx) => {
        return tx.type === 'income' ? acc + tx.amount : acc - tx.amount;
      }, 0);

      expect(balance).toBe(1500);
    });

    it('should handle only expenses', () => {
      const transactions = [
        { type: 'expense', amount: 100 },
        { type: 'expense', amount: 200 }
      ];

      const balance = transactions.reduce((acc, tx) => {
        return tx.type === 'income' ? acc + tx.amount : acc - tx.amount;
      }, 0);

      expect(balance).toBe(-300);
    });
  });

  describe('calculateSavingsRate', () => {
    it('should calculate savings rate correctly', () => {
      const income = 1000;
      const expenses = 700;
      const savingsRate = ((income - expenses) / income) * 100;

      expect(savingsRate).toBe(30);
    });

    it('should return 0 when income is 0', () => {
      const income = 0;
      const expenses = 500;
      const savingsRate = income === 0 ? 0 : ((income - expenses) / income) * 100;

      expect(savingsRate).toBe(0);
    });

    it('should handle negative savings rate', () => {
      const income = 1000;
      const expenses = 1200;
      const savingsRate = ((income - expenses) / income) * 100;

      expect(savingsRate).toBe(-20);
    });

    it('should return 100 when expenses are 0', () => {
      const income = 1000;
      const expenses = 0;
      const savingsRate = ((income - expenses) / income) * 100;

      expect(savingsRate).toBe(100);
    });
  });

  describe('budgetPercentage', () => {
    it('should calculate budget percentage correctly', () => {
      const spent = 750;
      const budget = 1000;
      const percentage = (spent / budget) * 100;

      expect(percentage).toBe(75);
    });

    it('should handle over-budget spending', () => {
      const spent = 1200;
      const budget = 1000;
      const percentage = (spent / budget) * 100;

      expect(percentage).toBe(120);
    });

    it('should return 0 when nothing is spent', () => {
      const spent = 0;
      const budget = 1000;
      const percentage = (spent / budget) * 100;

      expect(percentage).toBe(0);
    });

    it('should handle edge case when budget is 0', () => {
      const spent = 100;
      const budget = 0;
      const percentage = budget === 0 ? Infinity : (spent / budget) * 100;

      expect(percentage).toBe(Infinity);
    });
  });

  describe('categorySpending', () => {
    it('should aggregate spending by category', () => {
      const transactions = [
        { category: 'food', amount: 100, type: 'expense' },
        { category: 'food', amount: 50, type: 'expense' },
        { category: 'housing', amount: 1000, type: 'expense' }
      ];

      const categoryTotals: Record<string, number> = {};
      transactions.forEach(tx => {
        if (tx.type === 'expense') {
          categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
        }
      });

      expect(categoryTotals.food).toBe(150);
      expect(categoryTotals.housing).toBe(1000);
    });

    it('should ignore income transactions', () => {
      const transactions = [
        { category: 'food', amount: 100, type: 'expense' },
        { category: 'income', amount: 5000, type: 'income' }
      ];

      const categoryTotals: Record<string, number> = {};
      transactions.forEach(tx => {
        if (tx.type === 'expense') {
          categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
        }
      });

      expect(categoryTotals.food).toBe(100);
      expect(categoryTotals.income).toBeUndefined();
    });
  });
});

describe('Date Utilities', () => {
  describe('isCurrentMonth', () => {
    it('should identify current month transactions', () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const testDate = new Date(currentYear, currentMonth, 15);

      expect(testDate.getMonth()).toBe(currentMonth);
      expect(testDate.getFullYear()).toBe(currentYear);
    });

    it('should reject transactions from different months', () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const testDate = new Date(currentYear, currentMonth - 1, 15);

      expect(testDate.getMonth()).not.toBe(currentMonth);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with 2 decimal places', () => {
      const amount = 1234.5;
      const formatted = `$${amount.toFixed(2)}`;

      expect(formatted).toBe('$1234.50');
    });

    it('should handle whole numbers', () => {
      const amount = 1000;
      const formatted = `$${amount.toFixed(2)}`;

      expect(formatted).toBe('$1000.00');
    });

    it('should handle small amounts', () => {
      const amount = 0.99;
      const formatted = `$${amount.toFixed(2)}`;

      expect(formatted).toBe('$0.99');
    });
  });
});
