'use client';

import { InventoryItem } from '@/lib/types';

interface VolatilityCardProps {
  items: InventoryItem[];
  title: string;
  metric: 'stock' | 'orderAmount';
}

export default function VolatilityCard({ items, title, metric }: VolatilityCardProps) {
  // Calculate changes (for now, we'll simulate week-over-week by looking at order amounts)
  // In a real system, you'd compare against historical data
  const changes = items
    .map(item => ({
      item: item,
      change: metric === 'stock' 
        ? item.orderAmount // Use order amount as proxy for change
        : item.orderAmount,
      percentChange: item.par > 0 
        ? ((item.orderAmount / item.par) * 100).toFixed(1)
        : '0',
    }))
    .filter(c => c.change !== 0)
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {changes.map((change, index) => {
          const isPositive = change.change > 0;
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{change.item.itemName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {change.item.location}{change.item.shelf ? ` - ${change.item.shelf}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
                  {isPositive ? '+' : ''}{change.change} units
                </p>
                <p className="text-xs text-gray-500">{change.percentChange}% of par</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

