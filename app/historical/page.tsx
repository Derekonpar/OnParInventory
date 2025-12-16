'use client';

import { useInventory } from '@/lib/hooks/use-inventory';
import Link from 'next/link';
import { useState } from 'react';
import HistoricalInventoryTable from '@/components/HistoricalInventoryTable';

export default function HistoricalPage() {
  const { items, stats, isLoading, isError } = useInventory();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading historical data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h2>
          <p className="text-red-700">Failed to fetch inventory data.</p>
        </div>
      </div>
    );
  }

  // Sort dates chronologically (most recent last)
  // Use the same comparison function as in parse-sheet-data.ts
  const compareDates = (date1: string, date2: string): number => {
    const [month1, day1] = date1.split('/').map(Number);
    const [month2, day2] = date2.split('/').map(Number);
    if (month1 !== month2) {
      return month1 - month2;
    }
    return day1 - day2;
  };

  const sortedDates = stats?.historicalDates ? [...stats.historicalDates].sort(compareDates) : [];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Historical Inventory Data</h1>
            <p className="text-gray-600">View inventory snapshots by date</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Historical Dates</div>
            <div className="text-2xl font-bold text-gray-900">{sortedDates.length}</div>
            <div className="text-xs text-gray-500 mt-1">Available snapshots</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">High Volatility Items</div>
            <div className="text-2xl font-bold text-red-600">{stats?.highVolatilityItems || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Items with unusual changes</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Items Tracked</div>
            <div className="text-2xl font-bold text-gray-900">{items.length}</div>
            <div className="text-xs text-gray-500 mt-1">With historical data</div>
          </div>
        </div>
      </div>

      {/* Date List or Selected Date View */}
      {selectedDate ? (
        <div>
          <button
            onClick={() => setSelectedDate(null)}
            className="mb-4 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Date List
          </button>
          <HistoricalInventoryTable items={items} selectedDate={selectedDate} />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Select a Date to View Inventory</h2>
            <p className="text-sm text-gray-600 mt-1">Click on a date to see the complete inventory snapshot</p>
          </div>
          <div className="p-6">
            {sortedDates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No historical data available</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedDates.map((date) => {
                  const isMostRecent = date === sortedDates[sortedDates.length - 1];
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`
                        p-6 rounded-lg border-2 transition-all text-left
                        ${isMostRecent 
                          ? 'border-blue-500 bg-blue-50 hover:bg-blue-100' 
                          : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{date}</h3>
                        {isMostRecent && (
                          <span className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-200 rounded-full">
                            Most Recent
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {items.filter(item => 
                          item.historicalSnapshots.some(s => s.date === date && s.stock > 0)
                        ).length} items with stock
                      </p>
                      <div className="mt-3 flex items-center text-blue-600 text-sm font-medium">
                        View Inventory
                        <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

