'use client';

import React, { useState, useMemo } from 'react';
import { InventoryItem } from '@/lib/types';
import { getLocationSortOrder } from '@/lib/location-order';

interface InventoryTableProps {
  items: InventoryItem[];
}

export default function InventoryTable({ items }: InventoryTableProps) {
  const [sortField, setSortField] = useState<keyof InventoryItem>('itemName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterVolatility, setFilterVolatility] = useState<string>('all');

  const locations = useMemo(() => {
    const locs = new Set<string>();
    items.forEach(item => locs.add(item.location));
    return Array.from(locs).sort();
  }, [items]);

  // Group items by location for color coding
  const itemsByLocation = useMemo(() => {
    const grouped: Record<string, InventoryItem[]> = {};
    items.forEach(item => {
      if (!grouped[item.location]) {
        grouped[item.location] = [];
      }
      grouped[item.location].push(item);
    });
    return grouped;
  }, [items]);

  // Location colors (Google Sheets style - pastel colors with borders)
  const locationColorPalette = [
    { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100' },
    { bg: 'bg-green-50', border: 'border-green-200', header: 'bg-green-100' },
    { bg: 'bg-yellow-50', border: 'border-yellow-200', header: 'bg-yellow-100' },
    { bg: 'bg-purple-50', border: 'border-purple-200', header: 'bg-purple-100' },
    { bg: 'bg-pink-50', border: 'border-pink-200', header: 'bg-pink-100' },
    { bg: 'bg-indigo-50', border: 'border-indigo-200', header: 'bg-indigo-100' },
    { bg: 'bg-orange-50', border: 'border-orange-200', header: 'bg-orange-100' },
    { bg: 'bg-teal-50', border: 'border-teal-200', header: 'bg-teal-100' },
  ];

  // Get color for location (assign colors dynamically)
  const getLocationColor = (location: string) => {
    const locationIndex = locations.indexOf(location);
    return locationColorPalette[locationIndex % locationColorPalette.length] || { bg: 'bg-gray-50', border: 'border-gray-200', header: 'bg-gray-100' };
  };

  const sortedAndFilteredItems = useMemo(() => {
    let filtered = items;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.shelf && item.shelf.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply location filter
    if (filterLocation !== 'all') {
      filtered = filtered.filter(item => item.location === filterLocation);
    }

    // Apply volatility filter
    if (filterVolatility === 'high') {
      filtered = filtered.filter(item => item.volatility?.isHighVolatility);
    } else if (filterVolatility === 'normal') {
      filtered = filtered.filter(item => !item.volatility?.isHighVolatility);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      // First sort by location, then by the selected field
      if (a.location !== b.location) {
        return a.location.localeCompare(b.location);
      }
      
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });

    return filtered;
  }, [items, searchTerm, filterLocation, sortField, sortDirection]);

  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: keyof InventoryItem }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Group items by location for rendering
  const groupedItems = useMemo(() => {
    const groups: { location: string; items: InventoryItem[] }[] = [];
    const locationMap = new Map<string, InventoryItem[]>();

    sortedAndFilteredItems.forEach(item => {
      if (!locationMap.has(item.location)) {
        locationMap.set(item.location, []);
      }
      locationMap.get(item.location)!.push(item);
    });

    locationMap.forEach((items, location) => {
      groups.push({ location, items });
    });

    // Sort by the standard location order
    return groups.sort((a, b) => {
      const orderA = getLocationSortOrder(a.location);
      const orderB = getLocationSortOrder(b.location);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // If both are unknown, sort alphabetically
      return a.location.localeCompare(b.location);
    });
  }, [sortedAndFilteredItems]);

  return (
    <div className="bg-white font-sans">
      {/* Google Sheets style toolbar */}
      <div className="px-4 py-2 border-b-2 border-gray-400 bg-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 font-sans">
          Inventory Items
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 py-1 border border-gray-400 rounded text-xs flex-1 sm:flex-none sm:w-64 font-sans"
          />
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-2 py-1 border border-gray-400 rounded text-xs font-sans"
          >
            <option value="all">All Locations</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <select
            value={filterVolatility}
            onChange={(e) => setFilterVolatility(e.target.value)}
            className="px-2 py-1 border border-gray-400 rounded text-xs font-sans"
          >
            <option value="all">All Items</option>
            <option value="high">High Volatility</option>
            <option value="normal">Normal Volatility</option>
          </select>
        </div>
      </div>
      
      {/* Google Sheets style table */}
      <div className="overflow-x-auto border-2 border-gray-400">
        <table className="min-w-full border-collapse font-sans">
          <thead>
            <tr className="bg-gray-200 border-b-2 border-gray-400">
              <th
                className="px-2 py-1.5 text-left text-xs font-semibold text-gray-800 border-r border-gray-400 cursor-pointer hover:bg-gray-300 font-sans"
                onClick={() => handleSort('itemName')}
              >
                Item Name <SortIcon field="itemName" />
              </th>
              <th
                className="px-2 py-1.5 text-left text-xs font-semibold text-gray-800 border-r border-gray-400 cursor-pointer hover:bg-gray-300 font-sans"
                onClick={() => handleSort('location')}
              >
                Location <SortIcon field="location" />
              </th>
              <th 
                className="px-2 py-1.5 text-left text-xs font-semibold text-gray-800 border-r border-gray-400 font-sans"
              >
                Shelf
              </th>
              <th
                className="px-2 py-1.5 text-left text-xs font-semibold text-gray-800 border-r border-gray-400 cursor-pointer hover:bg-gray-300 font-sans"
                onClick={() => handleSort('stock')}
              >
                Stock <SortIcon field="stock" />
              </th>
              <th
                className="px-2 py-1.5 text-left text-xs font-semibold text-gray-800 border-r border-gray-400 cursor-pointer hover:bg-gray-300 font-sans"
                onClick={() => handleSort('par')}
              >
                Par <SortIcon field="par" />
              </th>
              <th
                className="px-2 py-1.5 text-left text-xs font-semibold text-gray-800 border-r border-gray-400 cursor-pointer hover:bg-gray-300 font-sans"
                onClick={() => handleSort('orderAmount')}
              >
                Order Amount <SortIcon field="orderAmount" />
              </th>
              <th 
                className="px-2 py-1.5 text-left text-xs font-semibold text-gray-800 border-r border-gray-400 font-sans"
              >
                Status
              </th>
              <th 
                className="px-2 py-1.5 text-left text-xs font-semibold text-gray-800 font-sans"
              >
                Volatility
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500 border border-gray-400 font-sans">
                  No items found
                </td>
              </tr>
            ) : (
              groupedItems.map((group, groupIndex) => {
                const locationColors = getLocationColor(group.location);
                return (
                  <React.Fragment key={group.location}>
                    {/* Location Header Row - Google Sheets style */}
                    <tr className={`${locationColors.header} border-t-2 border-b border-gray-400`}>
                      <td 
                        colSpan={8} 
                        className="px-2 py-1.5 font-bold text-xs text-gray-900 border-r border-gray-400 font-sans"
                      >
                        {group.location}
                      </td>
                    </tr>
                    {/* Items in this location */}
                    {group.items.map((item, itemIndex) => {
                      return (
                        <tr
                          key={`${item.location}-${itemIndex}`}
                          className={`${locationColors.bg} border-b border-gray-300 hover:opacity-90`}
                        >
                          <td 
                            className="px-2 py-1.5 text-xs text-gray-900 border-r border-gray-400 font-medium font-sans"
                          >
                            {item.itemName}
                          </td>
                          <td 
                            className="px-2 py-1.5 text-xs text-gray-700 border-r border-gray-400 font-sans"
                          >
                            {item.location}
                          </td>
                          <td 
                            className="px-2 py-1.5 text-xs text-gray-600 border-r border-gray-400 font-sans"
                          >
                            {item.shelf || '-'}
                          </td>
                          <td 
                            className="px-2 py-1.5 text-xs text-gray-900 border-r border-gray-400 text-right font-sans"
                          >
                            {item.stock}
                          </td>
                          <td 
                            className="px-2 py-1.5 text-xs text-gray-900 border-r border-gray-400 text-right font-sans"
                          >
                            {item.par}
                          </td>
                          <td 
                            className="px-2 py-1.5 text-xs border-r border-gray-400 text-right font-sans"
                          >
                            <span className={item.orderAmount > 0 ? 'font-semibold text-red-600' : 'text-gray-500'}>
                              {item.orderAmount > 0 ? item.orderAmount : '-'}
                            </span>
                          </td>
                          <td 
                            className="px-2 py-1.5 text-xs border-r border-gray-400 font-sans"
                          >
                            {item.isBelowPar ? (
                              <span className="px-1.5 py-0.5 inline-flex text-xs font-semibold rounded bg-red-200 text-red-800">
                                Below Par
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 inline-flex text-xs font-semibold rounded bg-green-200 text-green-800">
                                OK
                              </span>
                            )}
                          </td>
                          <td 
                            className="px-2 py-1.5 text-xs font-sans"
                          >
                            {item.volatility?.isHighVolatility ? (
                              <span className="px-1.5 py-0.5 inline-flex text-xs font-semibold rounded bg-orange-200 text-orange-800">
                                High Volatility
                              </span>
                            ) : item.volatility ? (
                              <span className="px-1.5 py-0.5 inline-flex text-xs font-semibold rounded bg-gray-200 text-gray-600">
                                Normal
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Google Sheets style footer */}
      <div className="px-4 py-2 border-t-2 border-gray-400 bg-gray-100">
        <p className="text-xs text-gray-600 font-sans">
          Showing {sortedAndFilteredItems.length} of {items.length} items
        </p>
      </div>
    </div>
  );
}

