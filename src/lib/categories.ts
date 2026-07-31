// Mirrors quassama_V2's src/constants/DefaultCategory.ts verbatim — the category
// list is fixed/global (no user-created categories), so the web app must stay
// in sync with this exact set to avoid writing categories the mobile app doesn't
// recognize.
export type Category = {
  id: number
  name: string
  icon: string
  color: string
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Shopping', icon: 'shopping-cart', color: '#2979FF' },
  { id: 2, name: 'Internet', icon: 'wifi', color: '#FF9800' },
  { id: 3, name: 'Cleaning', icon: 'check-circle', color: '#00BCD4' },
  { id: 4, name: 'Rent', icon: 'home', color: '#673AB7' },
  { id: 5, name: 'Settlement', icon: 'dollar-sign', color: '#10B981' },
  { id: 6, name: 'Other', icon: 'plus', color: '#E91E63' },
  { id: 7, name: 'Food', icon: 'coffee', color: '#FF5722' },
  { id: 8, name: 'Transportation', icon: 'truck', color: '#9C27B0' },
  { id: 9, name: 'Health', icon: 'heart', color: '#F44336' },
  { id: 10, name: 'Entertainment', icon: 'film', color: '#3F51B5' },
  { id: 12, name: 'Education', icon: 'book', color: '#4CAF50' },
  { id: 13, name: 'Bills', icon: 'file-text', color: '#FFC107' },
  { id: 14, name: 'Groceries', icon: 'shopping-bag', color: '#8BC34A' },
  { id: 15, name: 'Utilities', icon: 'zap', color: '#FF9800' },
  { id: 16, name: 'Clothing', icon: 'tag', color: '#E91E63' },
  { id: 17, name: 'Gifts', icon: 'gift', color: '#9C27B0' },
  { id: 19, name: 'Pets', icon: 'heart', color: '#FF5722' },
  { id: 20, name: 'Subscriptions', icon: 'repeat', color: '#3F51B5' },
  { id: 22, name: 'Sports', icon: 'activity', color: '#4CAF50' },
  { id: 23, name: 'Hobbies', icon: 'smile', color: '#FFC107' },
  { id: 24, name: 'Taxes', icon: 'file-text', color: '#8BC34A' },
  { id: 25, name: 'Gadgets', icon: 'smartphone', color: '#00BCD4' },
  { id: 26, name: 'Furniture', icon: 'home', color: '#FF9800' },
  { id: 28, name: 'Car', icon: 'truck', color: '#9C27B0' },
  { id: 29, name: 'Fuel', icon: 'droplet', color: '#03A9F4' },
  { id: 31, name: 'Parking', icon: 'map-pin', color: '#3F51B5' },
  { id: 35, name: 'Hotel', icon: 'home', color: '#00BCD4' },
  { id: 36, name: 'Books', icon: 'book', color: '#FF9800' },
  { id: 37, name: 'Courses', icon: 'book-open', color: '#E91E63' },
  { id: 38, name: 'Music', icon: 'music', color: '#9C27B0' },
  { id: 39, name: 'Movies', icon: 'film', color: '#03A9F4' },
  { id: 40, name: 'Insurance', icon: 'shield', color: '#607D8B' },
  { id: 41, name: 'Travel', icon: 'briefcase', color: '#009688' },
  { id: 42, name: 'Savings', icon: 'trending-up', color: '#4CAF50' },
  { id: 43, name: 'Charity', icon: 'sun', color: '#FFB300' },
  { id: 44, name: 'Beauty', icon: 'scissors', color: '#F06292' },
  { id: 45, name: 'Work', icon: 'hard-drive', color: '#546E7A' },
  { id: 46, name: 'Laundry', icon: 'wind', color: '#81D4FA' },
  { id: 47, name: 'Gaming', icon: 'tv', color: '#7E57C2' },
  { id: 48, name: 'Maintenance', icon: 'tool', color: '#FF7043' },
  { id: 49, name: 'Investment', icon: 'bar-chart-2', color: '#00C853' },
  { id: 50, name: 'Dining Out', icon: 'pie-chart', color: '#D84315' },
  { id: 51, name: 'Coffee', icon: 'coffee', color: '#795548' },
  { id: 52, name: 'Home Office', icon: 'monitor', color: '#455A64' },
  { id: 53, name: 'Repair', icon: 'settings', color: '#607D8B' },
  { id: 54, name: 'Childcare', icon: 'smile', color: '#FF4081' },
  { id: 55, name: 'Fitness', icon: 'award', color: '#FF5252' },
  { id: 56, name: 'Delivery', icon: 'package', color: '#FFAB40' },
  { id: 61, name: 'Loans', icon: 'percent', color: '#F44336' },
  { id: 62, name: 'Personal Care', icon: 'user', color: '#00BCD4' },
  { id: 63, name: 'Streaming', icon: 'play-circle', color: '#E91E63' },
  { id: 64, name: 'Donations', icon: 'heart', color: '#4CAF50' },
  { id: 65, name: 'Transfer', icon: 'refresh-cw', color: '#9C27B0' },
  { id: 66, name: 'Withdrawal', icon: 'credit-card', color: '#FF9800' },
  { id: 67, name: 'Refund', icon: 'rotate-ccw', color: '#2196F3' },
  { id: 68, name: 'Streaming', icon: 'percent', color: '#E91E63' },
]
