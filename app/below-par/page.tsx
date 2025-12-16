'use client';

import { useInventory } from '@/lib/hooks/use-inventory';
import InventoryTable from '@/components/InventoryTable';
import Link from 'next/link';

export default function BelowParPage() {
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

  const itemsBelowPar = items.filter(item => item.isBelowPar);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Items Below Par</h1>
            <p className="text-gray-600">Critical items requiring immediate attention</p>
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-600 mb-1">Total Items Below Par</p>
            <p className="text-3xl font-bold text-red-900">{itemsBelowPar.length}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm font-medium text-orange-600 mb-1">Total Order Amount</p>
            <p className="text-3xl font-bold text-orange-900">
              {itemsBelowPar.reduce((sum, item) => sum + item.orderAmount, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-600 mb-1">Locations Affected</p>
            <p className="text-3xl font-bold text-yellow-900">
              {new Set(itemsBelowPar.map(item => item.location)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      {itemsBelowPar.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-12 text-center">
          <svg className="h-16 w-16 text-green-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-semibold text-green-900 mb-2">All Items Are Above Par</h2>
          <p className="text-green-700">No immediate action required. Your inventory is well-stocked.</p>
        </div>
      ) : (
        <InventoryTable items={itemsBelowPar} />
      )}
    </div>
  );
}

