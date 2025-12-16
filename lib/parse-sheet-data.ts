import { InventoryItem, HistoricalSnapshot, VolatilityMetrics } from './types';
import { getLocationSortOrder } from './location-order';

/**
 * Parse raw Google Sheets data into structured inventory items
 * Handles the Item ID column format: location (bolded) + shelf info (regular font)
 * Since we can't get formatting from the API easily, we'll parse based on content patterns
 */
export function parseSheetData(rawData: string[][]): InventoryItem[] {
  if (!rawData || rawData.length < 2) {
    console.log('parseSheetData: No data or less than 2 rows', { rowCount: rawData?.length || 0 });
    return [];
  }

  // Check if first row has very few columns - might need to look at a different row for headers
  // Or the headers might be in multiple rows
  let headerRowIndex = 0;
  let headers = rawData[0];
  
  // If first row only has 1-2 columns, check if row 1 or 2 has more columns (might be the actual header row)
  if (headers.length <= 2 && rawData.length > 1) {
    console.log('parseSheetData: First row has few columns, checking other rows for headers');
    for (let i = 1; i < Math.min(5, rawData.length); i++) {
      if (rawData[i] && rawData[i].length > headers.length) {
        console.log(`parseSheetData: Row ${i} has more columns (${rawData[i].length}), using as header row`);
        headerRowIndex = i;
        headers = rawData[i];
        break;
      }
    }
  }

  const rows = rawData.slice(headerRowIndex + 1);

  // Log headers for debugging
  console.log('parseSheetData: Headers row:', headers);
  console.log('parseSheetData: Headers array length:', headers?.length);
  console.log('parseSheetData: First 30 headers with indices:', headers?.slice(0, 30).map((h, i) => `${i}: "${String(h || '').trim()}"`));
  console.log('parseSheetData: Total headers in array:', headers?.length || 0);

  // Find inventory date columns (format: "Inv MM/DD")
  // First try to find them in headers
  const inventoryDateColumns: Array<{ index: number; date: string; header: string }> = [];
  headers.forEach((header, index) => {
    const headerStr = String(header || '').trim();
    // Try to parse date
    const date = parseInventoryDate(headerStr);
    if (date) {
      inventoryDateColumns.push({ index, date, header: headerStr });
      console.log(`✓ Found inventory date column at index ${index}: "${headerStr}" -> date: ${date}`);
    } else {
      // Log headers that might be dates but didn't match
      if (headerStr.toLowerCase().includes('inv') || /\d{1,2}\/\d{1,2}/.test(headerStr)) {
        console.log(`? Potential date column at index ${index} (didn't match): "${headerStr}"`);
      }
    }
  });

  // If no date columns found in headers, try to find them by scanning data rows
  // Look for columns that consistently contain numeric values (likely inventory counts)
  // and are beyond the standard columns (Location, Product, Total, Par, Order = columns 0-4)
  if (inventoryDateColumns.length === 0 && rows.length > 0) {
    console.log('No date columns found in headers, scanning data rows for date columns...');
    
    // Find the maximum column count across all rows
    const maxColumns = Math.max(...rows.map(row => row?.length || 0), headers.length);
    console.log(`Max columns found: ${maxColumns}`);
    
    // Check columns beyond index 4 (after standard columns) for numeric patterns
    // If a column has mostly numeric values, it might be an inventory date column
    for (let colIndex = 5; colIndex < maxColumns && colIndex < 100; colIndex++) {
      // Sample some rows to see if this column has numeric values
      const sampleValues = rows.slice(0, Math.min(10, rows.length))
        .map(row => row?.[colIndex])
        .filter(val => val !== undefined && val !== null && val !== '');
      
      if (sampleValues.length > 0) {
        // Check if most values are numeric (likely inventory counts)
        const numericCount = sampleValues.filter(val => !isNaN(parseFloat(String(val).replace(/,/g, '')))).length;
        if (numericCount > sampleValues.length * 0.7) {
          // This column likely contains inventory data
          // Try to infer date from column position or check if header exists at this index
          const headerAtCol = headers[colIndex] || '';
          const inferredDate = parseInventoryDate(String(headerAtCol));
          
          if (inferredDate) {
            inventoryDateColumns.push({ 
              index: colIndex, 
              date: inferredDate, 
              header: String(headerAtCol) || `Column ${colIndex}` 
            });
            console.log(`✓ Found inventory date column at index ${colIndex} (inferred): date: ${inferredDate}`);
          } else {
            // Couldn't parse date from header, but column has numeric data
            console.log(`? Column ${colIndex} has numeric data but no date header: "${headerAtCol}"`);
          }
        }
      }
    }
  }

  // Sort inventory date columns chronologically (most recent last)
  inventoryDateColumns.sort((a, b) => compareDates(a.date, b.date));
  
  // Most recent inventory column (use for current stock)
  const mostRecentInventoryColumn = inventoryDateColumns.length > 0 
    ? inventoryDateColumns[inventoryDateColumns.length - 1]
    : null;

  console.log('parseSheetData: Inventory date columns found:', inventoryDateColumns);
  console.log('parseSheetData: Most recent inventory column:', mostRecentInventoryColumn);

  // Find column indices based on actual column names
  // Expected columns: Location, Product, Total, Par Level, Quantity to Order
  const locationIndex = headers.findIndex(h => {
    const lower = String(h || '').toLowerCase().trim();
    return lower === 'location' || lower.includes('location');
  });
  const productIndex = headers.findIndex(h => {
    const lower = String(h || '').toLowerCase().trim();
    return lower === 'product' || lower.includes('product');
  });
  const totalIndex = headers.findIndex(h => {
    const lower = String(h || '').toLowerCase().trim();
    return lower === 'total' || (lower.includes('total') && !lower.includes('order'));
  });
  const parLevelIndex = headers.findIndex(h => {
    const lower = String(h || '').toLowerCase().trim();
    return lower.includes('par level') || lower.includes('parlevel') || (lower.includes('par') && lower.includes('level'));
  });
  const quantityToOrderIndex = headers.findIndex(h => {
    const lower = String(h || '').toLowerCase().trim();
    return lower.includes('quantity to order') || lower.includes('quantitytoorder') || (lower.includes('quantity') && lower.includes('order'));
  });

  // Log found indices
  console.log('parseSheetData: Column indices:', {
    locationIndex,
    productIndex,
    totalIndex,
    parLevelIndex,
    quantityToOrderIndex,
    headers: headers.map((h, i) => `${i}: "${h}"`)
  });

  // Fallback to position-based if headers not found
  // Column 0 = Location, Column 1 = Product, Column 2 = Total, Column 3 = Par Level, Column 4 = Quantity to Order
  const finalLocationIndex = locationIndex >= 0 ? locationIndex : 0;
  const finalProductIndex = productIndex >= 0 ? productIndex : 1;
  const finalTotalIndex = totalIndex >= 0 ? totalIndex : 2;
  const finalParLevelIndex = parLevelIndex >= 0 ? parLevelIndex : 3;
  const finalQuantityToOrderIndex = quantityToOrderIndex >= 0 ? quantityToOrderIndex : 4;

  console.log('parseSheetData: Using column indices:', {
    location: finalLocationIndex,
    product: finalProductIndex,
    total: finalTotalIndex,
    parLevel: finalParLevelIndex,
    quantityToOrder: finalQuantityToOrderIndex
  });

  // Known main location headers (bolded rows that separate sections)
  const mainLocations = [
    'Dock Trailer',
    'Event Shelves',
    'Dock Mop Sink',
    'Karaoke',
    'Basement',
    'Unlocked Room Basement',
    'Front Desk',
    'Mop room by dish',
    'Golf',
    'Hallway Storage by ADA bathrooms',
    'Kitchen Chemical Room'
  ];

  const items: InventoryItem[] = [];
  let currentMainLocation = '';
  let currentSubsection = '';

  for (const row of rows) {
    // Skip completely empty rows
    if (!row || row.length === 0) {
      continue;
    }

    // Get values from the correct columns
    const locationValue = String(row[finalLocationIndex] || '').trim();
    const product = String(row[finalProductIndex] || '').trim();
    
    // Check if this is a main location header (has location but no product, and matches known locations)
    const isMainLocationHeader = locationValue && 
                                 !product && 
                                 mainLocations.some(loc => 
                                   locationValue.toLowerCase() === loc.toLowerCase() ||
                                   locationValue.toLowerCase().includes(loc.toLowerCase())
                                 );

    if (isMainLocationHeader) {
      // This is a main location header - update current main location
      currentMainLocation = locationValue;
      currentSubsection = ''; // Reset subsection when we hit a new main location
      continue; // Skip this row, it's just a header
    }

    // Check if this is a subsection header (has location but no product, and we have a main location)
    const isSubsectionHeader = locationValue && 
                               !product && 
                               currentMainLocation &&
                               locationValue.toLowerCase() !== currentMainLocation.toLowerCase();

    if (isSubsectionHeader) {
      // This is a subsection/shelf header - update current subsection
      currentSubsection = locationValue;
      continue; // Skip this row, it's just a subsection header
    }

    // Skip rows without a product name (these are header rows or empty rows we've already handled)
    if (!product) {
      continue;
    }

    // Determine the final location and shelf for this item
    let finalLocation = currentMainLocation;
    let shelf: string | undefined = undefined;

    // If we have a location value in this row, it might be a subsection
    if (locationValue) {
      // If it matches the current main location, use it
      if (locationValue.toLowerCase() === currentMainLocation.toLowerCase()) {
        finalLocation = locationValue;
      } 
      // If it's different from main location but we have a main location, it's a subsection
      else if (currentMainLocation && locationValue.toLowerCase() !== currentMainLocation.toLowerCase()) {
        shelf = locationValue;
        finalLocation = currentMainLocation;
      }
      // If we don't have a main location yet, use this as the location
      else if (!currentMainLocation) {
        finalLocation = locationValue;
      }
    }

    // If we still don't have a location, skip this row
    if (!finalLocation) {
      continue;
    }

    // Use current subsection if we have one and no shelf was set from the row
    if (!shelf && currentSubsection) {
      shelf = currentSubsection;
    }

    // Parse numeric values
    // Use most recent inventory column for stock, fallback to Total column
    const stock = mostRecentInventoryColumn
      ? parseFloat(String(row[mostRecentInventoryColumn.index] || '0').replace(/,/g, '')) || 0
      : parseFloat(String(row[finalTotalIndex] || '0').replace(/,/g, '')) || 0;
    
    const par = parseFloat(String(row[finalParLevelIndex] || '0').replace(/,/g, '')) || 0;
    const orderAmount = parseFloat(String(row[finalQuantityToOrderIndex] || '0').replace(/,/g, '')) || 0;

    // Parse historical inventory snapshots
    const historicalSnapshots: HistoricalSnapshot[] = [];
    if (inventoryDateColumns.length > 0) {
      inventoryDateColumns.forEach(({ index, date }) => {
        const historicalStock = parseFloat(String(row[index] || '0').replace(/,/g, '')) || 0;
        historicalSnapshots.push({
          date,
          stock: historicalStock,
        });
      });
    } else {
      // Log if no date columns found for first item
      if (items.length === 0) {
        console.log('⚠ No inventory date columns found - historical snapshots will be empty');
      }
    }

    // Sort snapshots chronologically
    historicalSnapshots.sort((a, b) => compareDates(a.date, b.date));

    // Calculate volatility metrics
    const volatility = calculateVolatility(historicalSnapshots);

    // Create a unique item ID
    const itemId = shelf 
      ? `${finalLocation} - ${shelf} - ${product}`
      : `${finalLocation} - ${product}`;

    // Add the item
    items.push({
      itemId,
      location: finalLocation,
      shelf: shelf || undefined,
      itemName: product,
      type: undefined, // Not in the table format
      stock,
      par,
      orderAmount,
      isBelowPar: stock < par,
      needsOrder: orderAmount > 0,
      historicalSnapshots,
      volatility,
    });
  }

  console.log(`parseSheetData: Parsed ${items.length} items`);

  return items;
}

/**
 * Parse date from inventory column header (e.g., "Inv 12/15" -> "12/15")
 * Also handles variations like "Inv\n12/08" (with newline) or just "12/08"
 */
function parseInventoryDate(header: string): string | null {
  if (!header) return null;
  
  // Normalize the header - replace newlines and multiple spaces with single space
  const normalized = header.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Try pattern: "Inv" followed by date (with optional whitespace)
  let match = normalized.match(/inv\s+(\d{1,2}\/\d{1,2})/i);
  if (match) {
    return match[1];
  }
  
  // Try pattern: Just a date (MM/DD format)
  match = normalized.match(/^(\d{1,2}\/\d{1,2})$/);
  if (match) {
    return match[1];
  }
  
  // Try pattern: Date anywhere in the string after "Inv"
  match = normalized.match(/inv.*?(\d{1,2}\/\d{1,2})/i);
  if (match) {
    return match[1];
  }
  
  // Last resort: find any date pattern in the string
  match = normalized.match(/(\d{1,2}\/\d{1,2})/);
  if (match) {
    // Only return if it looks like a valid date (month 1-12, day 1-31)
    const [month, day] = match[1].split('/').map(Number);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Compare two date strings in MM/DD format
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
function compareDates(date1: string, date2: string): number {
  const [month1, day1] = date1.split('/').map(Number);
  const [month2, day2] = date2.split('/').map(Number);
  
  if (month1 !== month2) {
    return month1 - month2;
  }
  return day1 - day2;
}

/**
 * Calculate standard deviation of an array of numbers
 */
function calculateStandardDeviation(values: number[]): number | null {
  if (values.length < 2) {
    return null; // Need at least 2 data points
  }
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Calculate volatility metrics for an item based on historical changes
 */
function calculateVolatility(snapshots: HistoricalSnapshot[]): VolatilityMetrics | undefined {
  if (snapshots.length < 2) {
    return undefined; // Need at least 2 snapshots to calculate volatility
  }

  // Calculate changes between consecutive dates
  const changes: number[] = [];
  for (let i = 1; i < snapshots.length; i++) {
    const change = snapshots[i].stock - snapshots[i - 1].stock;
    changes.push(change);
    snapshots[i].change = change;
  }

  if (changes.length === 0) {
    return undefined;
  }

  const meanChange = changes.reduce((sum, val) => sum + val, 0) / changes.length;
  const standardDeviation = calculateStandardDeviation(changes);
  
  // Current change is the most recent change
  const currentChange = changes[changes.length - 1];
  
  // Flag as high volatility if current change exceeds 2 standard deviations from mean
  const isHighVolatility = standardDeviation !== null && 
    Math.abs(currentChange - meanChange) > 2 * standardDeviation;

  return {
    standardDeviation,
    currentChange,
    isHighVolatility: isHighVolatility || false,
    historicalChanges: changes,
    meanChange,
  };
}

/**
 * Calculate dashboard statistics from inventory items
 */
export function calculateStats(items: InventoryItem[]) {
  // Collect all historical dates
  const historicalDatesSet = new Set<string>();
  items.forEach(item => {
    item.historicalSnapshots.forEach(snapshot => {
      historicalDatesSet.add(snapshot.date);
    });
  });

  const stats = {
    totalItems: items.length,
    totalStock: items.reduce((sum, item) => sum + item.stock, 0),
    itemsBelowPar: items.filter(item => item.isBelowPar).length,
    totalOrderAmount: items.reduce((sum, item) => sum + item.orderAmount, 0),
    locations: [] as string[],
    stockByLocation: {} as Record<string, number>,
    highVolatilityItems: items.filter(item => item.volatility?.isHighVolatility).length,
    historicalDates: Array.from(historicalDatesSet).sort((a, b) => compareDates(a, b)),
  };

  // Extract unique locations and calculate stock by location
  const locationSet = new Set<string>();
  items.forEach(item => {
    locationSet.add(item.location);
    stats.stockByLocation[item.location] = (stats.stockByLocation[item.location] || 0) + item.stock;
  });

  stats.locations = Array.from(locationSet).sort((a, b) => {
    const orderA = getLocationSortOrder(a);
    const orderB = getLocationSortOrder(b);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    // If both are unknown, sort alphabetically
    return a.localeCompare(b);
  });

  return stats;
}

