'use client';

import { useInventory } from '@/lib/hooks/use-inventory';
import KPICard from '@/components/KPICard';
import ChartsSection from '@/components/ChartsSection';
import AlertsSection from '@/components/AlertsSection';
import VolatilityCard from '@/components/VolatilityCard';
import Link from 'next/link';

export default function Home() {
  const { items, stats, isLoading, isError, refresh } = useInventory();

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
    // Try to get error details from the error object
    const errorDetails = isError instanceof Error ? isError.message : 
                        (typeof isError === 'object' && isError !== null && 'hint' in isError) 
                          ? String((isError as any).hint) 
                          : 'Failed to fetch inventory data';
    
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h2>
          <p className="text-red-700 mb-4">{errorDetails}</p>
          {errorDetails.includes('environment variable') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm font-semibold mb-2">Setup Required:</p>
              <p className="text-yellow-700 text-sm">
                Add the following environment variables in your Vercel project settings:
              </p>
              <ul className="list-disc list-inside text-yellow-700 text-sm mt-2 space-y-1">
                <li><code className="bg-yellow-100 px-1 rounded">GOOGLE_SHEET_ID</code></li>
                <li><code className="bg-yellow-100 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_JSON</code></li>
              </ul>
              <p className="text-yellow-700 text-sm mt-2">
                Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
              </p>
            </div>
          )}
          <button
            onClick={() => refresh()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  // Calculate critical metrics
  const criticalItems = items.filter(item => item.isBelowPar);
  const totalOrderValue = items.reduce((sum, item) => sum + (item.orderAmount * (item.par > 0 ? item.par : 1)), 0);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Real-time inventory insights and critical alerts</p>
        </div>
        <button
          onClick={() => refresh()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Info about data source */}
      {stats.stockSourceDate && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Stock Source:</span> Using <span className="font-mono font-semibold">{stats.stockSourceDate}</span> column for current stock and below par calculations
          </p>
        </div>
      )}

      {/* Critical KPIs - Industry Standard Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Items Below Par"
          value={stats.itemsBelowPar}
          subtitle={stats.itemsBelowPar > 0 ? "Requires immediate attention" : "All items OK"}
          trend={stats.itemsBelowPar > 0 ? 'down' : 'neutral'}
          href="/below-par"
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <KPICard
          title="High Volatility"
          value={stats.highVolatilityItems || 0}
          subtitle={stats.highVolatilityItems > 0 ? "Unusual changes detected" : "All stable"}
          trend={stats.highVolatilityItems > 0 ? 'down' : 'neutral'}
          href="/historical"
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <KPICard
          title="Total Order Amount"
          value={stats.totalOrderAmount.toLocaleString()}
          subtitle="Units to order"
          trend={stats.totalOrderAmount > 0 ? 'down' : 'neutral'}
        />
        <KPICard
          title="Total Items"
          value={stats.totalItems}
          subtitle={`${stats.locations.length} locations`}
        />
      </div>

      {/* Main Content Grid - Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column - Critical Alerts */}
        <div className="lg:col-span-1">
          <AlertsSection items={items} />
        </div>

        {/* Middle Column - Volatility & Trends */}
        <div className="lg:col-span-1 space-y-6">
          <VolatilityCard
            items={items}
            title="Largest Changes (Week-over-Week)"
            metric="orderAmount"
          />
        </div>

        {/* Right Column - Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/below-par"
                className="block w-full px-4 py-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-red-900">View Items Below Par</span>
                  <span className="text-red-600 font-bold">{stats.itemsBelowPar}</span>
                </div>
              </Link>
              <Link
                href="/items"
                className="block w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900">View All Items</span>
                  <span className="text-blue-600 font-bold">{stats.totalItems}</span>
                </div>
              </Link>
              <Link
                href="/locations"
                className="block w-full px-4 py-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-green-900">View by Location</span>
                  <span className="text-green-600 font-bold">{stats.locations.length}</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section - Full Width */}
      <div className="mb-8">
        <ChartsSection stats={stats} items={items} />
      </div>
    </div>
  );
}
