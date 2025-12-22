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
  // Google Sheets API returns sparse arrays, so we need to find the row with the most columns
  let headerRowIndex = 0;
  let headers = rawData[0];
  let maxColumns = headers.length;
  
  // Find the row with the most columns (likely the header row or a data row that shows full structure)
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    if (rawData[i] && rawData[i].length > maxColumns) {
      maxColumns = rawData[i].length;
      headerRowIndex = i;
      headers = rawData[i];
    }
  }
  
  if (headerRowIndex > 0) {
    console.log(`parseSheetData: Using row ${headerRowIndex} as header row (has ${maxColumns} columns vs row 0 with ${rawData[0]?.length || 0} columns)`);
  }
  
  // If headers still seem sparse, try to reconstruct from multiple rows or data
  if (headers.length < 10 && rawData.length > 1) {
    console.log('parseSheetData: Headers still sparse, will scan data rows to find all columns');
  }

  const rows = rawData.slice(headerRowIndex + 1);

  // Log headers for debugging
  console.log('parseSheetData: Headers row:', headers);
  console.log('parseSheetData: Headers array length:', headers?.length);
  console.log('parseSheetData: First 30 headers with indices:', headers?.slice(0, 30).map((h, i) => `${i}: "${String(h || '').trim()}"`));
  console.log('parseSheetData: Total headers in array:', headers?.length || 0);

  // Find the maximum column count across all rows (to handle sparse arrays)
  const maxColumnCount = Math.max(
    ...rawData.map(row => row?.length || 0),
    headers.length
  );
  console.log(`parseSheetData: Maximum column count found: ${maxColumnCount}`);

  // Find inventory date columns (format: "Inv MM/DD")
  // Also find usage columns (format: "MM/DD-MM/DD Usage") and "Ordered" columns
  // Need to check all column indices, not just those in the sparse headers array
  const inventoryDateColumns: Array<{ index: number; date: string; header: string }> = [];
  const usageColumns: Array<{ index: number; dateRange: string; header: string }> = [];
  const orderedColumns: Array<{ index: number; date: string | null; header: string }> = [];
  
  // Check all columns up to maxColumnCount (handle sparse arrays)
  for (let index = 0; index < maxColumnCount && index < 200; index++) {
    const header = headers[index]; // May be undefined if sparse
    const headerStr = String(header || '').trim();
    const normalized = headerStr.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Try to parse date from "Inv MM/DD" format
    const date = parseInventoryDate(normalized);
    if (date) {
      // Date is already normalized by parseInventoryDate, check for duplicates by normalized date
      const alreadyFound = inventoryDateColumns.some(col => col.date === date);
      if (!alreadyFound) {
        inventoryDateColumns.push({ index, date, header: headerStr || `Column ${index}` });
        console.log(`✓ Found inventory date column at index ${index}: "${headerStr || 'empty'}" -> date: ${date}`);
      } else {
        console.log(`ℹ Skipping duplicate date column at index ${index}: date ${date} already exists`);
      }
    }
    // Try to parse usage column (format: "MM/DD-MM/DD Usage" or "12/8-12/15 Usage")
    else if (normalized.toLowerCase().includes('usage')) {
      const usageMatch = normalized.match(/(\d{1,2}\/\d{1,2})\s*-\s*(\d{1,2}\/\d{1,2})\s*usage/i);
      if (usageMatch) {
        const dateRange = `${usageMatch[1]}-${usageMatch[2]}`;
        usageColumns.push({ index, dateRange, header: headerStr || `Column ${index}` });
        console.log(`✓ Found usage column at index ${index}: "${headerStr || 'empty'}" -> range: ${dateRange}`);
      }
    }
    // Try to parse "Ordered" column
    else if (normalized.toLowerCase() === 'ordered' || (normalized.toLowerCase().includes('ordered') && normalized.length < 20)) {
      // Try to find the previous date column to associate this ordered column with it
      const prevDateCol = inventoryDateColumns[inventoryDateColumns.length - 1];
      orderedColumns.push({ 
        index, 
        date: prevDateCol ? prevDateCol.date : null, 
        header: headerStr || `Column ${index}` 
      });
      console.log(`✓ Found ordered column at index ${index}: "${headerStr || 'empty'}"`);
    }
  }

  // Also try to find date columns by scanning data rows (in case headers are sparse or missing)
  // Look for columns that consistently contain numeric values (likely inventory counts)
  // and are beyond the standard columns (Location, Product, Total, Par, Order = columns 0-4)
  // This helps catch date columns even if headers are sparse arrays
  if (rows.length > 0) {
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
            // Normalize the date to MM/DD format
            const normalizedDate = normalizeDate(inferredDate);
            // Check if we already found this column (avoid duplicates)
            const alreadyFound = inventoryDateColumns.some(col => col.index === colIndex || col.date === normalizedDate);
            if (!alreadyFound) {
              inventoryDateColumns.push({ 
                index: colIndex, 
                date: normalizedDate, 
                header: String(headerAtCol) || `Column ${colIndex}` 
              });
              console.log(`✓ Found inventory date column at index ${colIndex} (inferred from data): date: ${normalizedDate}, header: "${headerAtCol || 'empty'}"`);
            } else {
              console.log(`ℹ Column ${colIndex} already found in headers, skipping duplicate`);
            }
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
  console.log('parseSheetData: Usage columns found:', usageColumns);
  console.log('parseSheetData: Ordered columns found:', orderedColumns);
  
  if (!mostRecentInventoryColumn) {
    console.warn('⚠ WARNING: No inventory date columns found! Below par detection will use Total column instead of most recent date.');
  } else {
    console.log(`✓ Using most recent date column (${mostRecentInventoryColumn.date} at index ${mostRecentInventoryColumn.index}) for stock and below par detection`);
  }

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
  const linkToOrderIndex = headers.findIndex(h => {
    const lower = String(h || '').toLowerCase().trim();
    // Match variations: "Link to order more", "Link to Order More", "link to order", etc.
    return lower.includes('link to order') || 
           lower.includes('linktoorder') || 
           (lower.includes('link') && lower.includes('order') && lower.includes('more'));
  });

  // Log found indices
  console.log('parseSheetData: Column indices:', {
    locationIndex,
    productIndex,
    totalIndex,
    parLevelIndex,
    quantityToOrderIndex,
    linkToOrderIndex,
    headers: headers.map((h, i) => `${i}: "${h}"`)
  });

  // Fallback to position-based if headers not found
  // Column 0 = Location, Column 1 = Product, Column 2 = Total, Column 3 = Par Level, Column 4 = Quantity to Order, Column 5 = Link to Order More
  const finalLocationIndex = locationIndex >= 0 ? locationIndex : 0;
  const finalProductIndex = productIndex >= 0 ? productIndex : 1;
  const finalTotalIndex = totalIndex >= 0 ? totalIndex : 2;
  const finalParLevelIndex = parLevelIndex >= 0 ? parLevelIndex : 3;
  const finalQuantityToOrderIndex = quantityToOrderIndex >= 0 ? quantityToOrderIndex : 4;
  const finalLinkToOrderIndex = linkToOrderIndex >= 0 ? linkToOrderIndex : 5;

  console.log('parseSheetData: Using column indices:', {
    location: finalLocationIndex,
    product: finalProductIndex,
    total: finalTotalIndex,
    parLevel: finalParLevelIndex,
    quantityToOrder: finalQuantityToOrderIndex,
    linkToOrder: finalLinkToOrderIndex
  });
  
  // Log the actual header found for link to order
  if (linkToOrderIndex >= 0) {
    console.log(`✓ Found "Link to Order More" column at index ${linkToOrderIndex}: "${headers[linkToOrderIndex]}"`);
  } else {
    console.warn(`⚠ "Link to Order More" column not found in headers, using fallback index ${finalLinkToOrderIndex}`);
    console.log('Available headers:', headers.slice(0, 10).map((h, i) => `${i}: "${h}"`));
  }

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
  
  // Track all locations found for debugging
  const foundLocations = new Set<string>();
  const itemsByLocation: Record<string, number> = {};

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
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
    
    // Track locations for debugging
    foundLocations.add(finalLocation);
    itemsByLocation[finalLocation] = (itemsByLocation[finalLocation] || 0) + 1;
    
    // Log items from unexpected locations (not in mainLocations list)
    const isExpectedLocation = mainLocations.some(loc => 
      finalLocation.toLowerCase() === loc.toLowerCase() ||
      finalLocation.toLowerCase().includes(loc.toLowerCase())
    );
    
    if (!isExpectedLocation && items.length < 5) {
      console.log(`⚠ Found item from unexpected location at row ${rowIndex + headerRowIndex + 2}: "${product}" in location "${finalLocation}" (currentMainLocation: "${currentMainLocation}")`);
    }

    // Use current subsection if we have one and no shelf was set from the row
    if (!shelf && currentSubsection) {
      shelf = currentSubsection;
    }

    // Parse numeric values
    // Use most recent inventory column for stock (for below par detection), fallback to Total column
    let stock: number;
    let stockSource: string;
    
    if (mostRecentInventoryColumn) {
      stock = parseFloat(String(row[mostRecentInventoryColumn.index] || '0').replace(/,/g, '')) || 0;
      stockSource = `most recent date column (${mostRecentInventoryColumn.date} at index ${mostRecentInventoryColumn.index})`;
    } else {
      stock = parseFloat(String(row[finalTotalIndex] || '0').replace(/,/g, '')) || 0;
      stockSource = `Total column (index ${finalTotalIndex})`;
    }
    
    const par = parseFloat(String(row[finalParLevelIndex] || '0').replace(/,/g, '')) || 0;
    
    // Get order link from "Link to Order More" column
    // Handle both plain URLs and Google Sheets HYPERLINK formulas
    let orderLink = String(row[finalLinkToOrderIndex] || '').trim();
    
    // Extract URL from HYPERLINK formula if present (e.g., =HYPERLINK("https://...", "text"))
    if (orderLink.startsWith('=HYPERLINK(') || orderLink.startsWith('HYPERLINK(')) {
      const urlMatch = orderLink.match(/HYPERLINK\s*\(\s*["']([^"']+)["']/i);
      if (urlMatch && urlMatch[1]) {
        orderLink = urlMatch[1];
      }
    }
    
    // Also handle if it's just a URL wrapped in quotes
    if (orderLink.startsWith('"') && orderLink.endsWith('"')) {
      orderLink = orderLink.slice(1, -1);
    }
    
    // Validate it looks like a URL
    const isValidUrl = orderLink && orderLink.length > 0 && 
                       (orderLink.startsWith('http://') || 
                        orderLink.startsWith('https://') || 
                        orderLink.startsWith('www.'));
    
    const finalOrderLink = isValidUrl ? orderLink : undefined;
    
    // Log first few items with order links for debugging
    if (items.length < 3 && finalOrderLink) {
      console.log(`Item ${items.length + 1} (${product}): orderLink="${finalOrderLink}"`);
    }
    
    // Calculate order amount: par - stock (if below par and positive), otherwise 0
    // This replaces the "Quantity to Order" column from the sheet
    const isBelowPar = stock < par;
    const orderAmount = isBelowPar ? Math.max(0, par - stock) : 0;
    
    // Log stock source for first few items to debug
    if (items.length < 3) {
      console.log(`Item ${items.length + 1} (${product}): stock=${stock}, par=${par}, isBelowPar=${isBelowPar}, orderAmount=${orderAmount}, source=${stockSource}`);
    }
    
    // Below par detection: Use most recent date column (e.g., 12/22) vs Par Level
    // Stock is set to mostRecentInventoryColumn value above

    // Parse historical inventory snapshots with usage and ordered data
    const historicalSnapshots: HistoricalSnapshot[] = [];
    if (inventoryDateColumns.length > 0) {
      inventoryDateColumns.forEach(({ index, date }) => {
        const historicalStock = parseFloat(String(row[index] || '0').replace(/,/g, '')) || 0;
        
        // Find associated "Ordered" column (the one right after this date column)
        const orderedCol = orderedColumns.find(oc => {
          // Find ordered column that comes after this date column
          const orderedAfterDate = oc.index > index;
          // Check if it's the closest ordered column to this date
          const isClosest = !orderedColumns.some(other => 
            other.index > index && other.index < oc.index
          );
          return orderedAfterDate && isClosest;
        });
        
        const ordered = orderedCol 
          ? parseFloat(String(row[orderedCol.index] || '0').replace(/,/g, '')) || 0
          : undefined;
        
        // Find usage column for this date range
        // Usage column format: "MM/DD-MM/DD Usage" where the second date matches this date
        // Normalize both dates for comparison (date is already normalized, but normalize the range end too)
        const normalizedDate = normalizeDate(date);
        const usageCol = usageColumns.find(uc => {
          const dateRange = uc.dateRange.split('-');
          const normalizedRangeEnd = normalizeDate(dateRange[1]);
          return normalizedRangeEnd === normalizedDate; // Second date in range matches this date
        });
        
        const usage = usageCol
          ? parseFloat(String(row[usageCol.index] || '0').replace(/,/g, '')) || 0
          : undefined;
        
        // normalizedDate is already defined above, use it here
        historicalSnapshots.push({
          date: normalizedDate,
          stock: historicalStock,
          ordered,
          usage,
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

    // Calculate volatility metrics based on usage (not stock changes)
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
      orderLink: finalOrderLink,
      isBelowPar,
      needsOrder: orderAmount > 0,
      historicalSnapshots,
      volatility,
    });
  }

  console.log(`parseSheetData: Parsed ${items.length} items`);
  console.log(`parseSheetData: Found ${foundLocations.size} unique locations:`, Array.from(foundLocations).sort());
  console.log(`parseSheetData: Items by location:`, itemsByLocation);
  
  // Check for items from unexpected locations
  const unexpectedLocations = Array.from(foundLocations).filter(loc => 
    !mainLocations.some(mainLoc => 
      loc.toLowerCase() === mainLoc.toLowerCase() ||
      loc.toLowerCase().includes(mainLoc.toLowerCase())
    )
  );
  
  if (unexpectedLocations.length > 0) {
    console.warn(`⚠ WARNING: Found items from ${unexpectedLocations.length} unexpected location(s):`, unexpectedLocations);
    unexpectedLocations.forEach(loc => {
      const itemsInLoc = items.filter(item => item.location === loc);
      console.warn(`  - "${loc}": ${itemsInLoc.length} items (e.g., "${itemsInLoc[0]?.itemName || 'N/A'}")`);
    });
  }

  return items;
}

/**
 * Parse date from inventory column header (e.g., "Inv 12/15" -> "12/15")
 * Also handles variations like "Inv\n12/08" (with newline) or just "12/08"
 */
/**
 * Normalize date to MM/DD format (with leading zeros)
 * e.g., "12/8" -> "12/08", "1/5" -> "01/05"
 */
function normalizeDate(dateStr: string): string {
  const [month, day] = dateStr.split('/').map(Number);
  return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}

function parseInventoryDate(header: string): string | null {
  if (!header) return null;
  
  // Normalize the header - replace newlines and multiple spaces with single space
  const normalized = header.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Try pattern: "Inv" followed by date (with optional whitespace)
  let match = normalized.match(/inv\s+(\d{1,2}\/\d{1,2})/i);
  if (match) {
    const dateStr = match[1];
    const [month, day] = dateStr.split('/').map(Number);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return normalizeDate(dateStr);
    }
  }
  
  // Try pattern: Just a date (MM/DD format)
  match = normalized.match(/^(\d{1,2}\/\d{1,2})$/);
  if (match) {
    const dateStr = match[1];
    const [month, day] = dateStr.split('/').map(Number);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return normalizeDate(dateStr);
    }
  }
  
  // Try pattern: Date anywhere in the string after "Inv"
  match = normalized.match(/inv.*?(\d{1,2}\/\d{1,2})/i);
  if (match) {
    const dateStr = match[1];
    const [month, day] = dateStr.split('/').map(Number);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return normalizeDate(dateStr);
    }
  }
  
  // Last resort: find any date pattern in the string
  match = normalized.match(/(\d{1,2}\/\d{1,2})/);
  if (match) {
    // Only return if it looks like a valid date (month 1-12, day 1-31)
    const dateStr = match[1];
    const [month, day] = dateStr.split('/').map(Number);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return normalizeDate(dateStr);
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
 * Calculate volatility metrics for an item based on usage values
 * Uses running standard deviation of usage (not stock changes)
 */
function calculateVolatility(snapshots: HistoricalSnapshot[]): VolatilityMetrics | undefined {
  // Extract usage values (filter out undefined/null)
  const usageValues = snapshots
    .map(s => s.usage)
    .filter((u): u is number => u !== undefined && u !== null && !isNaN(u));

  if (usageValues.length < 2) {
    return undefined; // Need at least 2 usage values to calculate volatility
  }

  const meanUsage = usageValues.reduce((sum, val) => sum + val, 0) / usageValues.length;
  const standardDeviation = calculateStandardDeviation(usageValues);
  
  // Current usage is the most recent usage value
  const currentUsage = usageValues[usageValues.length - 1];
  
  // Flag as high volatility if current usage exceeds 2 standard deviations from mean
  const isHighVolatility = standardDeviation !== null && 
    Math.abs(currentUsage - meanUsage) > 2 * standardDeviation;

  return {
    standardDeviation,
    currentUsage,
    isHighVolatility: isHighVolatility || false,
    historicalUsage: usageValues,
    meanUsage,
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

  const sortedHistoricalDates = Array.from(historicalDatesSet).sort((a, b) => compareDates(a, b));
  const mostRecentDate = sortedHistoricalDates.length > 0 ? sortedHistoricalDates[sortedHistoricalDates.length - 1] : null;
  
  const stats = {
    totalItems: items.length,
    totalStock: items.reduce((sum, item) => sum + item.stock, 0),
    itemsBelowPar: items.filter(item => item.isBelowPar).length,
    totalOrderAmount: items.reduce((sum, item) => sum + item.orderAmount, 0),
    locations: [] as string[],
    stockByLocation: {} as Record<string, number>,
    highVolatilityItems: items.filter(item => item.volatility?.isHighVolatility).length,
    historicalDates: sortedHistoricalDates,
    // Log which date column is being used for below par detection
    stockSourceDate: mostRecentDate || 'Total column (no date columns found)',
  };
  
  console.log(`calculateStats: Using ${stats.stockSourceDate} for stock and below par detection`);
  console.log(`calculateStats: Found ${stats.itemsBelowPar} items below par out of ${stats.totalItems} total items`);

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

