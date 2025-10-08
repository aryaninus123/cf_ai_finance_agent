// Sample data generation for the Finance AI application

interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: string;
  timestamp: number;
}

export function generateSampleTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  
  // Define realistic transactions for each month
  const monthsData = [
    {
      // August 2025
      month: 7, // 0-based (7 = August)
      year: 2025,
      transactions: [
        // Income
        { amount: 3200, description: 'Monthly Salary', category: 'income', type: 'income', day: 1 },
        { amount: 250, description: 'Freelance project', category: 'income', type: 'income', day: 15 },
        
        // Housing
        { amount: 950, description: 'Rent payment', category: 'housing', type: 'expense', day: 1 },
        { amount: 85, description: 'Electric bill', category: 'housing', type: 'expense', day: 5 },
        { amount: 60, description: 'Internet service', category: 'housing', type: 'expense', day: 8 },
        
        // Food
        { amount: 125.50, description: 'Whole Foods groceries', category: 'food', type: 'expense', day: 3 },
        { amount: 45.80, description: 'Restaurant dinner', category: 'food', type: 'expense', day: 6 },
        { amount: 12.50, description: 'Coffee shop', category: 'food', type: 'expense', day: 9 },
        { amount: 98.30, description: 'Weekly groceries', category: 'food', type: 'expense', day: 10 },
        { amount: 32.20, description: 'Lunch takeout', category: 'food', type: 'expense', day: 14 },
        { amount: 18.75, description: 'Fast food', category: 'food', type: 'expense', day: 18 },
        { amount: 87.40, description: 'Grocery shopping', category: 'food', type: 'expense', day: 20 },
        { amount: 52.90, description: 'Restaurant lunch', category: 'food', type: 'expense', day: 24 },
        
        // Transportation
        { amount: 65.00, description: 'Gas station fill-up', category: 'transportation', type: 'expense', day: 4 },
        { amount: 18.50, description: 'Uber ride', category: 'transportation', type: 'expense', day: 12 },
        { amount: 72.00, description: 'Gas station', category: 'transportation', type: 'expense', day: 19 },
        { amount: 25.00, description: 'Car wash', category: 'transportation', type: 'expense', day: 22 },
        
        // Entertainment
        { amount: 15.99, description: 'Netflix subscription', category: 'entertainment', type: 'expense', day: 7 },
        { amount: 28.00, description: 'Movie tickets', category: 'entertainment', type: 'expense', day: 16 },
        { amount: 45.50, description: 'Concert tickets', category: 'entertainment', type: 'expense', day: 23 },
        
        // Shopping
        { amount: 89.99, description: 'New shoes', category: 'shopping', type: 'expense', day: 11 },
        { amount: 125.00, description: 'Electronics', category: 'shopping', type: 'expense', day: 17 },
        { amount: 42.50, description: 'Home decor', category: 'shopping', type: 'expense', day: 26 },
        
        // Healthcare
        { amount: 35.00, description: 'Gym membership', category: 'healthcare', type: 'expense', day: 2 },
        { amount: 28.50, description: 'Pharmacy', category: 'healthcare', type: 'expense', day: 13 },
        { amount: 150.00, description: 'Doctor visit copay', category: 'healthcare', type: 'expense', day: 21 },
      ]
    },
    {
      // September 2025
      month: 8, // 0-based (8 = September)
      year: 2025,
      transactions: [
        // Income
        { amount: 3150, description: 'Monthly Salary', category: 'income', type: 'income', day: 1 },
        { amount: 180, description: 'Freelance consulting', category: 'income', type: 'income', day: 20 },
        
        // Housing
        { amount: 950, description: 'Rent payment', category: 'housing', type: 'expense', day: 1 },
        { amount: 92, description: 'Electric & gas bill', category: 'housing', type: 'expense', day: 6 },
        { amount: 60, description: 'Internet bill', category: 'housing', type: 'expense', day: 8 },
        
        // Food
        { amount: 142.30, description: 'Costco groceries', category: 'food', type: 'expense', day: 2 },
        { amount: 38.90, description: 'Brunch', category: 'food', type: 'expense', day: 7 },
        { amount: 15.20, description: 'Starbucks', category: 'food', type: 'expense', day: 9 },
        { amount: 105.60, description: 'Weekly shopping', category: 'food', type: 'expense', day: 14 },
        { amount: 28.40, description: 'Food delivery', category: 'food', type: 'expense', day: 16 },
        { amount: 22.50, description: 'Lunch', category: 'food', type: 'expense', day: 19 },
        { amount: 95.80, description: 'Grocery store', category: 'food', type: 'expense', day: 23 },
        { amount: 48.70, description: 'Dinner out', category: 'food', type: 'expense', day: 28 },
        
        // Transportation
        { amount: 68.00, description: 'Gas fill-up', category: 'transportation', type: 'expense', day: 5 },
        { amount: 22.50, description: 'Uber to airport', category: 'transportation', type: 'expense', day: 10 },
        { amount: 70.00, description: 'Gas station', category: 'transportation', type: 'expense', day: 18 },
        { amount: 45.00, description: 'Oil change', category: 'transportation', type: 'expense', day: 25 },
        
        // Entertainment
        { amount: 15.99, description: 'Spotify Premium', category: 'entertainment', type: 'expense', day: 4 },
        { amount: 12.99, description: 'Disney+', category: 'entertainment', type: 'expense', day: 8 },
        { amount: 52.00, description: 'Theater show', category: 'entertainment', type: 'expense', day: 15 },
        { amount: 35.50, description: 'Video game', category: 'entertainment', type: 'expense', day: 22 },
        
        // Shopping
        { amount: 156.80, description: 'Clothing haul', category: 'shopping', type: 'expense', day: 12 },
        { amount: 78.50, description: 'Online shopping', category: 'shopping', type: 'expense', day: 17 },
        { amount: 42.90, description: 'Birthday gift', category: 'shopping', type: 'expense', day: 24 },
        
        // Healthcare
        { amount: 35.00, description: 'Gym membership', category: 'healthcare', type: 'expense', day: 1 },
        { amount: 45.60, description: 'Vitamins & supplements', category: 'healthcare', type: 'expense', day: 11 },
        { amount: 120.00, description: 'Dental cleaning', category: 'healthcare', type: 'expense', day: 26 },
      ]
    },
    {
      // October 2025
      month: 9, // 0-based (9 = October)
      year: 2025,
      transactions: [
        // Income - Now on the 1st of October (timezone fix applied)
        { amount: 3300, description: 'Monthly Salary', category: 'income', type: 'income', day: 1 },

        // Housing
        { amount: 950, description: 'Rent payment', category: 'housing', type: 'expense', day: 1 },
        { amount: 35.00, description: 'Gym membership', category: 'healthcare', type: 'expense', day: 1 },

        // Entertainment
        { amount: 15.99, description: 'Netflix', category: 'entertainment', type: 'expense', day: 2 },

        // Food (October - ongoing)
        { amount: 132.50, description: 'Grocery haul', category: 'food', type: 'expense', day: 3 },

        // Transportation
        { amount: 72.00, description: 'Gas station', category: 'transportation', type: 'expense', day: 4 },
        { amount: 78, description: 'Utilities', category: 'housing', type: 'expense', day: 5 },
        { amount: 42.30, description: 'Restaurant dinner', category: 'food', type: 'expense', day: 5 },

        { amount: 16.50, description: 'Uber ride', category: 'transportation', type: 'expense', day: 6 },
        { amount: 18.90, description: 'Coffee & pastries', category: 'food', type: 'expense', day: 7 },
        { amount: 60, description: 'Internet bill', category: 'housing', type: 'expense', day: 8 },
      ]
    }
  ];
  
  // Generate transactions from the defined data
  monthsData.forEach(monthData => {
    monthData.transactions.forEach(tx => {
      // Use explicit date string formatting to avoid timezone issues
      const year = monthData.year;
      const month = String(monthData.month + 1).padStart(2, '0');
      const day = String(tx.day).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      // Parse the date string directly to avoid timezone shifts - adding 'T12:00:00' keeps it in the specified date
      const timestamp = new Date(`${dateStr}T12:00:00`).getTime();
      
      transactions.push({
        id: `${monthData.year}-${monthData.month}-${tx.day}-${tx.description.replace(/\s+/g, '-')}`,
        amount: tx.amount,
        description: tx.description,
        category: tx.category,
        type: tx.type as 'income' | 'expense',
        date: dateStr,
        timestamp: timestamp
      });
    });
  });
  
  // Sort by timestamp
  return transactions.sort((a, b) => a.timestamp - b.timestamp);
}

