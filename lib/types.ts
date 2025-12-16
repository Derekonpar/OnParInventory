// Historical inventory snapshot for a specific date
export interface HistoricalSnapshot {
  date: string; // Date identifier (e.g., "12/08", "12/15")
  stock: number; // Stock count for this date
  change?: number; // Change from previous date (calculated)
}

// Volatility metrics for an item
export interface VolatilityMetrics {
  standardDeviation: number | null; // null if < 2 data points
  currentChange: number; // Change from most recent to previous
  isHighVolatility: boolean; // Flagged if change exceeds threshold
  historicalChanges: number[]; // Array of all week-over-week changes
  meanChange: number; // Mean of all changes
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
}

