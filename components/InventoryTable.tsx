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

  // Helper function to extract shelf number and row for natural sorting
  // Handles formats like "Shelf 1 Row A", "Shelf 2", "Shelf 1 Row B", etc.
  const getShelfSortKey = (shelf: string | undefined): string => {
    if (!shelf) return 'zzz-no-shelf'; // Items without shelf go last
    
    const shelfLower = shelf.toLowerCase();
    
    // Extract shelf number (e.g., "1" from "Shelf 1 Row A")
    const shelfMatch = shelfLower.match(/shelf\s*(\d+)/);
    const shelfNum = shelfMatch ? parseInt(shelfMatch[1], 10) : 9999;
    
    // Extract row letter (e.g., "a" from "Shelf 1 Row A")
    const rowMatch = shelfLower.match(/row\s*([a-z])/);
    const rowLetter = rowMatch ? rowMatch[1] : 'zzz';
    
    // Create sort key: shelf number (padded) + row letter
    // This ensures: Shelf 1 Row A < Shelf 1 Row B < Shelf 2 < Shelf 2 Row A
    return `${String(shelfNum).padStart(4, '0')}-${rowLetter}`;
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
      // First sort by location (using predefined order)
      const locationOrderA = getLocationSortOrder(a.location);
      const locationOrderB = getLocationSortOrder(b.location);
      if (locationOrderA !== locationOrderB) {
        return locationOrderA - locationOrderB;
      }
      
      // Then sort by shelf (natural order: Shelf 1 Row A, Shelf 1 Row B, Shelf 2, etc.)
      if (a.location === b.location) {
        const shelfKeyA = getShelfSortKey(a.shelf);
        const shelfKeyB = getShelfSortKey(b.shelf);
        if (shelfKeyA !== shelfKeyB) {
          return shelfKeyA.localeCompare(shelfKeyB);
      }
      }
      
      // Finally sort by the selected field
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

  // Group items by location, then by shelf/subsection
  const groupedItems = useMemo(() => {
    // First group by location
    const locationGroups = new Map<string, Map<string | undefined, InventoryItem[]>>();

    sortedAndFilteredItems.forEach(item => {
      if (!locationGroups.has(item.location)) {
        locationGroups.set(item.location, new Map());
      }
      const shelfMap = locationGroups.get(item.location)!;
      
      const shelfKey = item.shelf || undefined;
      if (!shelfMap.has(shelfKey)) {
        shelfMap.set(shelfKey, []);
      }
      shelfMap.get(shelfKey)!.push(item);
    });

    // Convert to array structure: location -> shelves -> items
    const groups: Array<{
      location: string;
      shelves: Array<{ shelf: string | undefined; items: InventoryItem[] }>;
    }> = [];

    locationGroups.forEach((shelfMap, location) => {
      const shelves: Array<{ shelf: string | undefined; items: InventoryItem[] }> = [];
      
      shelfMap.forEach((items, shelf) => {
        // Sort items within each shelf by item name
        items.sort((a, b) => a.itemName.localeCompare(b.itemName));
        shelves.push({ shelf, items });
      });
      
      // Sort shelves by natural order (Shelf 1 Row A, Shelf 1 Row B, Shelf 2, etc.)
      shelves.sort((a, b) => {
        const keyA = getShelfSortKey(a.shelf);
        const keyB = getShelfSortKey(b.shelf);
        return keyA.localeCompare(keyB);
      });
      
      groups.push({ location, shelves });
    });

    // Sort locations by the standard location order
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
              <th 
                className="px-2 py-1.5 text-left text-xs font-semibold text-gray-800 font-sans"
              >
                Order
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-500 border border-gray-400 font-sans">
                  No items found
                </td>
              </tr>
            ) : (
              groupedItems.map((group, groupIndex) => {
                const locationColors = getLocationColor(group.location);
                return (
                  <React.Fragment key={group.location}>
                    {/* Location Header Row - Google Sheets style (bold) */}
                    <tr className={`${locationColors.header} border-t-2 border-b border-gray-400`}>
                      <td 
                        colSpan={9} 
                        className="px-2 py-1.5 font-bold text-xs text-gray-900 border-r border-gray-400 font-sans"
                      >
                        {group.location}
                      </td>
                    </tr>
                    {/* Shelves within this location */}
                    {group.shelves.map((shelfGroup, shelfIndex) => (
                      <React.Fragment key={`${group.location}-${shelfGroup.shelf || 'no-shelf'}-${shelfIndex}`}>
                        {/* Shelf Header Row - Google Sheets style (normal text, not bold) */}
                        {shelfGroup.shelf && (
                          <tr className={`${locationColors.bg} border-b border-gray-300`}>
                            <td 
                              colSpan={9} 
                              className="px-2 py-1.5 text-xs text-gray-700 border-r border-gray-400 font-sans"
                            >
                              {shelfGroup.shelf}
                            </td>
                          </tr>
                        )}
                        {/* Items in this shelf */}
                        {shelfGroup.items.map((item, itemIndex) => {
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
                          <td 
                            className="px-2 py-1.5 text-xs border-r border-gray-400 font-sans"
                          >
                            {item.orderLink ? (
                              <a
                                href={item.orderLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 inline-flex items-center gap-1"
                              >
                                Order More
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                      </React.Fragment>
                    ))}
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

