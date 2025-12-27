'use client';

import { InventoryItem } from '@/lib/types';

// Helper function to compare dates in MM/DD format
function compareDates(date1: string, date2: string): number {
  const [month1, day1] = date1.split('/').map(Number);
  const [month2, day2] = date2.split('/').map(Number);
  if (month1 !== month2) return month1 - month2;
  return day1 - day2;
}

interface VolatilityCardProps {
  items: InventoryItem[];
  title: string;
  metric: 'stock' | 'orderAmount';
}

export default function VolatilityCard({ items, title, metric }: VolatilityCardProps) {
  // Calculate week-over-week changes from historical snapshots
  // Compare most recent date vs previous date
  const changes = items
    .map(item => {
      // Need at least 2 historical snapshots to calculate week-over-week change
      if (item.historicalSnapshots.length < 2) {
        return null;
      }

      // Get the two most recent snapshots (sorted chronologically)
      const sortedSnapshots = [...item.historicalSnapshots].sort((a, b) => compareDates(a.date, b.date));

      const mostRecent = sortedSnapshots[sortedSnapshots.length - 1];
      const previous = sortedSnapshots[sortedSnapshots.length - 2];

      // Calculate change: most recent stock - previous stock
      // Positive = stock increased, Negative = stock decreased
      const change = mostRecent.stock - previous.stock;

      return {
        item: item,
        change: change,
        mostRecentDate: mostRecent.date,
        previousDate: previous.date,
        mostRecentStock: mostRecent.stock,
        previousStock: previous.stock,
        percentChange: previous.stock > 0 
          ? ((change / previous.stock) * 100).toFixed(1)
          : '0',
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null && c.change !== 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5);

  if (changes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-500 text-sm">No significant changes detected</p>
      </div>
    );
  }

  // Get the date range being compared (from first change item)
  const dateRange = changes.length > 0 
    ? `${changes[0].previousDate} → ${changes[0].mostRecentDate}`
    : 'No data';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-xs text-gray-500 mb-4">Comparing: {dateRange}</p>
      <div className="space-y-3">
        {changes.map((change, index) => {
          // Positive change = stock increased (good, show in green)
          // Negative change = stock decreased (bad, show in red)
          const isIncrease = change.change > 0;
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{change.item.itemName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {change.item.location}{change.item.shelf ? ` - ${change.item.shelf}` : ''}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {change.previousStock} → {change.mostRecentStock}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                  {isIncrease ? '+' : ''}{change.change} units
                </p>
                <p className="text-xs text-gray-500">{change.percentChange}% change</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

