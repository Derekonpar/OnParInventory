'use client';

import Link from 'next/link';
import { InventoryItem } from '@/lib/types';

interface AlertsSectionProps {
  items: InventoryItem[];
}

export default function AlertsSection({ items }: AlertsSectionProps) {
  const itemsBelowPar = items.filter(item => item.isBelowPar).slice(0, 10);

  if (itemsBelowPar.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">All items are above par</h3>
            <p className="text-sm text-green-700 mt-1">No immediate action needed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-red-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-red-900 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Low Stock Alerts
          </h2>
          <span className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full">
            {itemsBelowPar.length}
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {itemsBelowPar.map((item, index) => (
          <div key={index} className="px-6 py-3 hover:bg-red-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.itemName}</p>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {item.location}{item.shelf ? ` - ${item.shelf}` : ''}
                </p>
              </div>
              <div className="ml-4 text-right flex-shrink-0">
                <p className="text-sm font-semibold text-red-600">
                  {item.stock}/{item.par}
                </p>
                {item.orderAmount > 0 && (
                  <p className="text-xs font-medium text-red-700 mt-1">
                    +{item.orderAmount}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {itemsBelowPar.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Link
            href="/below-par"
            className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center justify-center"
          >
            View All Below Par Items
            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}

