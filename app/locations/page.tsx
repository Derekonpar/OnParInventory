'use client';

import { useInventory } from '@/lib/hooks/use-inventory';
import Link from 'next/link';
import { useMemo } from 'react';
import { getLocationSortOrder } from '@/lib/location-order';

export default function LocationsPage() {
  const { items, stats, isLoading, isError } = useInventory();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading inventory data...</p>
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

  const locationData = useMemo(() => {
    const locationMap = new Map<string, {
      items: typeof items;
      totalStock: number;
      itemsBelowPar: number;
      shelves: Set<string>;
    }>();

    items.forEach(item => {
      if (!locationMap.has(item.location)) {
        locationMap.set(item.location, {
          items: [],
          totalStock: 0,
          itemsBelowPar: 0,
          shelves: new Set(),
        });
      }

      const locData = locationMap.get(item.location)!;
      locData.items.push(item);
      locData.totalStock += item.stock;
      if (item.isBelowPar) locData.itemsBelowPar++;
      if (item.shelf) locData.shelves.add(item.shelf);
    });

    return Array.from(locationMap.entries())
      .map(([location, data]) => ({
        location,
        ...data,
        shelfCount: data.shelves.size,
      }))
      .sort((a, b) => {
        const orderA = getLocationSortOrder(a.location);
        const orderB = getLocationSortOrder(b.location);
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        // If both are unknown, sort alphabetically
        return a.location.localeCompare(b.location);
      });
  }, [items]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Locations</h1>
            <p className="text-gray-600">Inventory organized by location</p>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locationData.map((loc) => (
          <div key={loc.location} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">{loc.location}</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{loc.items.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{loc.totalStock.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Shelves</p>
                  <p className="text-2xl font-bold text-gray-900">{loc.shelfCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Below Par</p>
                  <p className={`text-2xl font-bold ${loc.itemsBelowPar > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {loc.itemsBelowPar}
                  </p>
                </div>
              </div>
              {loc.itemsBelowPar > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-red-600 mb-2">Items Requiring Attention:</p>
                  <ul className="space-y-1">
                    {loc.items.filter(item => item.isBelowPar).slice(0, 3).map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-700">
                        • {item.itemName} (Order: {item.orderAmount})
                      </li>
                    ))}
                    {loc.items.filter(item => item.isBelowPar).length > 3 && (
                      <li className="text-sm text-gray-500">
                        +{loc.items.filter(item => item.isBelowPar).length - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

