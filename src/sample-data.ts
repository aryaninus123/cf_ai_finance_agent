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
      // May 2025
      month: 4, // 0-based (4 = May)
      year: 2025,
      transactions: [
        // Income
        { amount: 3100, description: 'Monthly Salary', category: 'income', type: 'income', day: 1 },
        { amount: 200, description: 'Freelance work', category: 'income', type: 'income', day: 18 },

        // Housing
        { amount: 950, description: 'Rent payment', category: 'housing', type: 'expense', day: 1 },
        { amount: 88, description: 'Electric bill', category: 'housing', type: 'expense', day: 5 },
        { amount: 60, description: 'Internet service', category: 'housing', type: 'expense', day: 8 },

        // Food
        { amount: 112.30, description: 'Grocery shopping', category: 'food', type: 'expense', day: 3 },
        { amount: 42.50, description: 'Restaurant', category: 'food', type: 'expense', day: 7 },
        { amount: 98.20, description: 'Weekly groceries', category: 'food', type: 'expense', day: 11 },
        { amount: 28.90, description: 'Lunch out', category: 'food', type: 'expense', day: 15 },
        { amount: 85.60, description: 'Grocery run', category: 'food', type: 'expense', day: 22 },

        // Transportation
        { amount: 62.00, description: 'Gas fill-up', category: 'transportation', type: 'expense', day: 4 },
        { amount: 68.50, description: 'Gas station', category: 'transportation', type: 'expense', day: 18 },
        { amount: 24.00, description: 'Parking', category: 'transportation', type: 'expense', day: 12 },

        // Entertainment
        { amount: 15.99, description: 'Netflix', category: 'entertainment', type: 'expense', day: 2 },
        { amount: 32.00, description: 'Movie night', category: 'entertainment', type: 'expense', day: 16 },

        // Shopping
        { amount: 78.50, description: 'Clothing', category: 'shopping', type: 'expense', day: 10 },
        { amount: 45.00, description: 'Home goods', category: 'shopping', type: 'expense', day: 23 },

        // Healthcare
        { amount: 35.00, description: 'Gym membership', category: 'healthcare', type: 'expense', day: 1 },
        { amount: 52.30, description: 'Pharmacy', category: 'healthcare', type: 'expense', day: 14 },
      ]
    },
    {
      // June 2025
      month: 5, // 0-based (5 = June)
      year: 2025,
      transactions: [
        // Income
        { amount: 3150, description: 'Monthly Salary', category: 'income', type: 'income', day: 1 },
        { amount: 175, description: 'Side gig', category: 'income', type: 'income', day: 22 },

        // Housing
        { amount: 950, description: 'Rent payment', category: 'housing', type: 'expense', day: 1 },
        { amount: 95, description: 'Utilities', category: 'housing', type: 'expense', day: 6 },
        { amount: 60, description: 'Internet', category: 'housing', type: 'expense', day: 8 },

        // Food
        { amount: 125.80, description: 'Costco run', category: 'food', type: 'expense', day: 4 },
        { amount: 48.20, description: 'Dinner date', category: 'food', type: 'expense', day: 9 },
        { amount: 92.40, description: 'Groceries', category: 'food', type: 'expense', day: 13 },
        { amount: 35.60, description: 'Takeout', category: 'food', type: 'expense', day: 17 },
        { amount: 88.90, description: 'Weekly shopping', category: 'food', type: 'expense', day: 24 },

        // Transportation
        { amount: 65.00, description: 'Gas', category: 'transportation', type: 'expense', day: 5 },
        { amount: 70.00, description: 'Gas fill-up', category: 'transportation', type: 'expense', day: 19 },
        { amount: 28.50, description: 'Uber rides', category: 'transportation', type: 'expense', day: 14 },

        // Entertainment
        { amount: 15.99, description: 'Streaming service', category: 'entertainment', type: 'expense', day: 2 },
        { amount: 45.00, description: 'Concert', category: 'entertainment', type: 'expense', day: 21 },
        { amount: 12.99, description: 'App subscription', category: 'entertainment', type: 'expense', day: 10 },

        // Shopping
        { amount: 95.50, description: 'New gadget', category: 'shopping', type: 'expense', day: 11 },
        { amount: 62.00, description: 'Online purchase', category: 'shopping', type: 'expense', day: 26 },

        // Healthcare
        { amount: 35.00, description: 'Gym', category: 'healthcare', type: 'expense', day: 1 },
        { amount: 85.00, description: 'Doctor copay', category: 'healthcare', type: 'expense', day: 18 },
      ]
    },
    {
      // July 2025
      month: 6, // 0-based (6 = July)
      year: 2025,
      transactions: [
        // Income
        { amount: 3250, description: 'Monthly Salary', category: 'income', type: 'income', day: 1 },
        { amount: 300, description: 'Bonus', category: 'income', type: 'income', day: 15 },

        // Housing
        { amount: 950, description: 'Rent payment', category: 'housing', type: 'expense', day: 1 },
        { amount: 102, description: 'Electric & AC', category: 'housing', type: 'expense', day: 7 },
        { amount: 60, description: 'Internet', category: 'housing', type: 'expense', day: 8 },

        // Food
        { amount: 138.50, description: 'Grocery haul', category: 'food', type: 'expense', day: 3 },
        { amount: 52.80, description: 'Restaurant meal', category: 'food', type: 'expense', day: 8 },
        { amount: 18.40, description: 'Coffee shop', category: 'food', type: 'expense', day: 11 },
        { amount: 108.20, description: 'Weekly groceries', category: 'food', type: 'expense', day: 15 },
        { amount: 42.60, description: 'Fast casual', category: 'food', type: 'expense', day: 20 },
        { amount: 95.30, description: 'Grocery shopping', category: 'food', type: 'expense', day: 26 },

        // Transportation
        { amount: 68.00, description: 'Gas station', category: 'transportation', type: 'expense', day: 6 },
        { amount: 72.50, description: 'Fill up', category: 'transportation', type: 'expense', day: 17 },
        { amount: 35.00, description: 'Rideshare', category: 'transportation', type: 'expense', day: 13 },

        // Entertainment
        { amount: 15.99, description: 'Netflix', category: 'entertainment', type: 'expense', day: 2 },
        { amount: 12.99, description: 'Music streaming', category: 'entertainment', type: 'expense', day: 5 },
        { amount: 58.00, description: 'Event tickets', category: 'entertainment', type: 'expense', day: 19 },
        { amount: 28.50, description: 'Movies', category: 'entertainment', type: 'expense', day: 24 },

        // Shopping
        { amount: 145.00, description: 'Summer clothes', category: 'shopping', type: 'expense', day: 12 },
        { amount: 88.90, description: 'Electronics', category: 'shopping', type: 'expense', day: 22 },
        { amount: 52.00, description: 'Misc shopping', category: 'shopping', type: 'expense', day: 28 },

        // Healthcare
        { amount: 35.00, description: 'Gym membership', category: 'healthcare', type: 'expense', day: 1 },
        { amount: 48.50, description: 'Supplements', category: 'healthcare', type: 'expense', day: 16 },
      ]
    },
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
        // Income
        { amount: 3200, description: 'Monthly Salary', category: 'income', type: 'income', day: 1 },
        { amount: 225, description: 'Consulting work', category: 'income', type: 'income', day: 14 },

        // Housing
        { amount: 950, description: 'Rent payment', category: 'housing', type: 'expense', day: 1 },
        { amount: 78, description: 'Utilities', category: 'housing', type: 'expense', day: 5 },
        { amount: 60, description: 'Internet bill', category: 'housing', type: 'expense', day: 8 },

        // Food
        { amount: 132.50, description: 'Grocery haul', category: 'food', type: 'expense', day: 3 },
        { amount: 42.30, description: 'Restaurant dinner', category: 'food', type: 'expense', day: 5 },
        { amount: 18.90, description: 'Coffee & pastries', category: 'food', type: 'expense', day: 7 },
        { amount: 95.40, description: 'Weekly shopping', category: 'food', type: 'expense', day: 12 },
        { amount: 38.60, description: 'Lunch', category: 'food', type: 'expense', day: 16 },

        // Transportation
        { amount: 72.00, description: 'Gas station', category: 'transportation', type: 'expense', day: 4 },
        { amount: 16.50, description: 'Uber ride', category: 'transportation', type: 'expense', day: 6 },
        { amount: 68.00, description: 'Gas fill-up', category: 'transportation', type: 'expense', day: 18 },

        // Entertainment
        { amount: 15.99, description: 'Netflix', category: 'entertainment', type: 'expense', day: 2 },
        { amount: 12.99, description: 'Spotify', category: 'entertainment', type: 'expense', day: 5 },
        { amount: 42.00, description: 'Movies', category: 'entertainment', type: 'expense', day: 13 },

        // Shopping
        { amount: 118.50, description: 'New jacket', category: 'shopping', type: 'expense', day: 9 },
        { amount: 65.00, description: 'Amazon order', category: 'shopping', type: 'expense', day: 15 },

        // Healthcare
        { amount: 35.00, description: 'Gym membership', category: 'healthcare', type: 'expense', day: 1 },
        { amount: 42.80, description: 'Vitamins', category: 'healthcare', type: 'expense', day: 11 },
      ]
    },
    {
      // November 2025
      month: 10,
      year: 2025,
      transactions: [
        { amount: 3200, description: 'Monthly Salary', category: 'income', type: 'income', day: 1 },
        { amount: 150, description: 'Freelance design', category: 'income', type: 'income', day: 20 },
        { amount: 950, description: 'Rent payment', category: 'housing', type: 'expense', day: 1 },
        { amount: 88, description: 'Heating bill', category: 'housing', type: 'expense', day: 6 },
        { amount: 60, description: 'Internet', category: 'housing', type: 'expense', day: 8 },
        { amount: 145.20, description: 'Costco run', category: 'food', type: 'expense', day: 2 },
        { amount: 52.80, description: 'Restaurant', category: 'food', type: 'expense', day: 8 },
        { amount: 98.40, description: 'Weekly groceries', category: 'food', type: 'expense', day: 14 },
        { amount: 32.50, description: 'Lunch takeout', category: 'food', type: 'expense', day: 19 },
        { amount: 88.60, description: 'Grocery shopping', category: 'food', type: 'expense', day: 25 },
        { amount: 65.00, description: 'Gas fill-up', category: 'transportation', type: 'expense', day: 3 },
        { amount: 70.50, description: 'Gas station', category: 'transportation', type: 'expense', day: 17 },
        { amount: 22.00, description: 'Uber', category: 'transportation', type: 'expense', day: 11 },
        { amount: 15.99, description: 'Netflix', category: 'entertainment', type: 'expense', day: 2 },
        { amount: 12.99, description: 'Spotify', category: 'entertainment', type: 'expense', day: 5 },
        { amount: 68.00, description: 'Thanksgiving dinner supplies', category: 'food', type: 'expense', day: 26 },
        { amount: 185.00, description: 'Black Friday shopping', category: 'shopping', type: 'expense', day: 29 },
        { amount: 72.50, description: 'Online deals', category: 'shopping', type: 'expense', day: 30 },
        { amount: 35.00, description: 'Gym membership', category: 'healthcare', type: 'expense', day: 1 },
        { amount: 55.00, description: 'Flu shot & vitamins', category: 'healthcare', type: 'expense', day: 13 },
      ]
    },
    {
      // December 2025
      month: 11,
      year: 2025,
      transactions: [
        { amount: 3200, description: 'Monthly Salary', category: 'income', type: 'income', day: 1 },
        { amount: 500, description: 'Holiday bonus', category: 'income', type: 'income', day: 20 },
        { amount: 950, description: 'Rent payment', category: 'housing', type: 'expense', day: 1 },
        { amount: 105, description: 'Heating & electric', category: 'housing', type: 'expense', day: 7 },
        { amount: 60, description: 'Internet', category: 'housing', type: 'expense', day: 8 },
        { amount: 138.90, description: 'Weekly groceries', category: 'food', type: 'expense', day: 4 },
        { amount: 62.40, description: 'Holiday dinner out', category: 'food', type: 'expense', day: 10 },
        { amount: 95.20, description: 'Grocery haul', category: 'food', type: 'expense', day: 15 },
        { amount: 42.80, description: 'Takeout', category: 'food', type: 'expense', day: 19 },
        { amount: 115.50, description: 'New Year Eve dinner', category: 'food', type: 'expense', day: 31 },
        { amount: 68.00, description: 'Gas station', category: 'transportation', type: 'expense', day: 5 },
        { amount: 72.00, description: 'Gas fill-up', category: 'transportation', type: 'expense', day: 18 },
        { amount: 35.00, description: 'Airport Uber', category: 'transportation', type: 'expense', day: 22 },
        { amount: 15.99, description: 'Netflix', category: 'entertainment', type: 'expense', day: 2 },
        { amount: 12.99, description: 'Spotify', category: 'entertainment', type: 'expense', day: 5 },
        { amount: 85.00, description: 'Holiday movies & events', category: 'entertainment', type: 'expense', day: 23 },
        { amount: 320.00, description: 'Christmas gifts', category: 'shopping', type: 'expense', day: 18 },
        { amount: 145.80, description: 'Holiday decorations', category: 'shopping', type: 'expense', day: 9 },
        { amount: 88.50, description: 'Cyber Monday orders', category: 'shopping', type: 'expense', day: 2 },
        { amount: 35.00, description: 'Gym membership', category: 'healthcare', type: 'expense', day: 1 },
        { amount: 48.00, description: 'Year-end checkup copay', category: 'healthcare', type: 'expense', day: 12 },
      ]
    },
    // ── 2026 DATA ──
    {
      // January 2026
      month: 0,
      year: 2026,
      transactions: [
        { amount: 3400, description: 'Monthly Salary', category: 'income', type: 'income', day: 1 },
        { amount: 200, description: 'New Year freelance project', category: 'income', type: 'income', day: 18 },
        { amount: 975, description: 'Rent payment', category: 'housing', type: 'expense', day: 1 },
        { amount: 112, description: 'Heating bill (cold snap)', category: 'housing', type: 'expense', day: 6 },
        { amount: 65, description: 'Internet & streaming bundle', category: 'housing', type: 'expense', day: 8 },
        { amount: 148.30, description: 'Costco bulk run', category: 'food', type: 'expense', day: 3 },
        { amount: 38.50, description: 'Restaurant lunch', category: 'food', type: 'expense', day: 7 },
        { amount: 102.80, description: 'Weekly groceries', category: 'food', type: 'expense', day: 12 },
        { amount: 24.90, description: 'Coffee shop', category: 'food', type: 'expense', day: 15 },
        { amount: 92.40, description: 'Grocery shopping', category: 'food', type: 'expense', day: 22 },
        { amount: 28.60, description: 'Takeout dinner', category: 'food', type: 'expense', day: 27 },
        { amount: 70.00, description: 'Gas fill-up', category: 'transportation', type: 'expense', day: 4 },
        { amount: 74.50, description: 'Gas station', category: 'transportation', type: 'expense', day: 19 },
        { amount: 18.00, description: 'Uber ride', category: 'transportation', type: 'expense', day: 10 },
        { amount: 15.99, description: 'Netflix', category: 'entertainment', type: 'expense', day: 2 },
        { amount: 12.99, description: 'Spotify', category: 'entertainment', type: 'expense', day: 5 },
        { amount: 45.00, description: 'Video game', category: 'entertainment', type: 'expense', day: 14 },
        { amount: 125.00, description: 'Winter sale clothing', category: 'shopping', type: 'expense', day: 8 },
        { amount: 58.90, description: 'Amazon order', category: 'shopping', type: 'expense', day: 20 },
        { amount: 35.00, description: 'Gym membership', category: 'healthcare', type: 'expense', day: 1 },
        { amount: 42.00, description: 'Vitamins & supplements', category: 'healthcare', type: 'expense', day: 16 },
      ]
    },
    {
      // February 2026
      month: 1,
      year: 2026,
      transactions: [
        { amount: 3400, description: 'Monthly Salary', category: 'income', type: 'income', day: 1 },
        { amount: 320, description: 'Consulting project', category: 'income', type: 'income', day: 14 },
        { amount: 975, description: 'Rent payment', category: 'housing', type: 'expense', day: 1 },
        { amount: 98, description: 'Utilities', category: 'housing', type: 'expense', day: 5 },
        { amount: 65, description: 'Internet', category: 'housing', type: 'expense', day: 8 },
        { amount: 132.60, description: 'Grocery haul', category: 'food', type: 'expense', day: 2 },
        { amount: 88.50, description: "Valentine's dinner", category: 'food', type: 'expense', day: 14 },
        { amount: 96.40, description: 'Weekly groceries', category: 'food', type: 'expense', day: 9 },
        { amount: 32.80, description: 'Lunch out', category: 'food', type: 'expense', day: 18 },
        { amount: 85.20, description: 'Grocery shopping', category: 'food', type: 'expense', day: 23 },
        { amount: 68.00, description: 'Gas fill-up', category: 'transportation', type: 'expense', day: 3 },
        { amount: 72.00, description: 'Gas station', category: 'transportation', type: 'expense', day: 17 },
        { amount: 24.50, description: 'Uber', category: 'transportation', type: 'expense', day: 12 },
        { amount: 15.99, description: 'Netflix', category: 'entertainment', type: 'expense', day: 2 },
        { amount: 12.99, description: 'Spotify', category: 'entertainment', type: 'expense', day: 5 },
        { amount: 55.00, description: "Valentine's gift", category: 'shopping', type: 'expense', day: 13 },
        { amount: 78.50, description: 'Online shopping', category: 'shopping', type: 'expense', day: 20 },
        { amount: 35.00, description: 'Gym membership', category: 'healthcare', type: 'expense', day: 1 },
        { amount: 128.00, description: 'Dental cleaning', category: 'healthcare', type: 'expense', day: 21 },
      ]
    },
    {
      // March 2026
      month: 2,
      year: 2026,
      transactions: [
        { amount: 3400, description: 'Monthly Salary', category: 'income', type: 'income', day: 1 },
        { amount: 275, description: 'Freelance web project', category: 'income', type: 'income', day: 22 },
        { amount: 975, description: 'Rent payment', category: 'housing', type: 'expense', day: 1 },
        { amount: 92, description: 'Utilities', category: 'housing', type: 'expense', day: 6 },
        { amount: 65, description: 'Internet', category: 'housing', type: 'expense', day: 8 },
        { amount: 155.40, description: 'Costco groceries', category: 'food', type: 'expense', day: 2 },
        { amount: 46.80, description: 'Restaurant brunch', category: 'food', type: 'expense', day: 8 },
        { amount: 22.50, description: 'Coffee shop', category: 'food', type: 'expense', day: 11 },
        { amount: 108.30, description: 'Weekly groceries', category: 'food', type: 'expense', day: 15 },
        { amount: 38.90, description: 'Food delivery', category: 'food', type: 'expense', day: 19 },
        { amount: 95.60, description: 'Grocery shopping', category: 'food', type: 'expense', day: 25 },
        { amount: 72.00, description: 'Gas fill-up', category: 'transportation', type: 'expense', day: 5 },
        { amount: 68.50, description: 'Gas station', category: 'transportation', type: 'expense', day: 20 },
        { amount: 28.00, description: 'Parking & tolls', category: 'transportation', type: 'expense', day: 14 },
        { amount: 15.99, description: 'Netflix', category: 'entertainment', type: 'expense', day: 2 },
        { amount: 12.99, description: 'Spotify', category: 'entertainment', type: 'expense', day: 5 },
        { amount: 62.00, description: 'Concert tickets', category: 'entertainment', type: 'expense', day: 17 },
        { amount: 42.00, description: 'Movie & popcorn', category: 'entertainment', type: 'expense', day: 21 },
        { amount: 98.50, description: 'Spring clothing', category: 'shopping', type: 'expense', day: 12 },
        { amount: 65.00, description: 'Amazon order', category: 'shopping', type: 'expense', day: 23 },
        { amount: 35.00, description: 'Gym membership', category: 'healthcare', type: 'expense', day: 1 },
        { amount: 52.80, description: 'Pharmacy', category: 'healthcare', type: 'expense', day: 18 },
      ]
    },
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

