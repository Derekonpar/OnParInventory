// Historical inventory snapshot for a specific date
export interface HistoricalSnapshot {
  date: string; // Date identifier (e.g., "12/08", "12/15")
  stock: number; // Stock count for this date
  ordered?: number; // Amount ordered for this period
  usage?: number; // Usage calculated: (previous count + ordered) - current count
  change?: number; // Change from previous date (calculated) - DEPRECATED, use usage instead
}

// Volatility metrics for an item
export interface VolatilityMetrics {
  standardDeviation: number | null; // null if < 2 data points (running standard deviation of usage)
  currentUsage: number; // Most recent usage value
  isHighVolatility: boolean; // Flagged if usage exceeds threshold
  historicalUsage: number[]; // Array of all usage values for running standard deviation
  meanUsage: number; // Mean of all usage values
}

// Inventory item data structure
export interface InventoryItem {
  itemId: string; // Location/shelf info from Item ID column
  location: string; // Extracted location (e.g., "Trailer")
  shelf?: string; // Extracted shelf info (e.g., "Shelf 1 Row A")
  itemName: string;
  type?: string;
  stock: number; // From most recent inventory column
  par: number;
  orderAmount: number;
  orderLink?: string; // Link to order more (from "Link to Order More" column)
  isBelowPar: boolean; // Calculated: stock < par
  needsOrder: boolean; // Calculated: orderAmount > 0
  historicalSnapshots: HistoricalSnapshot[]; // Historical inventory counts by date
  volatility?: VolatilityMetrics; // Volatility analysis metrics
}

// Dashboard statistics
export interface DashboardStats {
  totalItems: number;
  totalStock: number;
  itemsBelowPar: number;
  totalOrderAmount: number;
  locations: string[];
  stockByLocation: Record<string, number>;
  highVolatilityItems: number; // Count of items with high volatility
  historicalDates: string[]; // List of all historical dates found
  stockSourceDate: string; // Which date column is being used for stock (e.g., "12/22" or "Total column")
}

