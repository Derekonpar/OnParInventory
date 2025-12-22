import { NextResponse } from 'next/server';
import { fetchSheetData } from '@/lib/google-sheets';
import { parseSheetData, calculateStats } from '@/lib/parse-sheet-data';

export async function GET() {
  try {
    const rawData = await fetchSheetData();
    
    // Debug: Log the raw data structure
    console.log('Raw data structure:', {
      totalRows: rawData.length,
      firstRow: rawData[0],
      firstRowLength: rawData[0]?.length,
      firstRowFull: JSON.stringify(rawData[0]),
      secondRow: rawData[1],
      secondRowLength: rawData[1]?.length,
      thirdRow: rawData[2],
      thirdRowLength: rawData[2]?.length,
      maxColumns: Math.max(...rawData.map(row => row?.length || 0)),
      // Check a row near the end to see if it has more columns
      lastDataRow: rawData[rawData.length - 1],
      lastDataRowLength: rawData[rawData.length - 1]?.length,
    });
    
    // Search for rows containing "manager" or "office" to find old sections
    const managerOfficeRows: Array<{ rowIndex: number; row: string[] }> = [];
    rawData.forEach((row, index) => {
      if (row && row.length > 0) {
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('manager') || rowText.includes('office')) {
          managerOfficeRows.push({ rowIndex: index, row: row.slice(0, 10) }); // First 10 columns
        }
      }
    });
    
    if (managerOfficeRows.length > 0) {
      console.log(`⚠ Found ${managerOfficeRows.length} row(s) containing "manager" or "office":`);
      managerOfficeRows.slice(0, 10).forEach(({ rowIndex, row }) => {
        console.log(`  Row ${rowIndex + 1}:`, row);
      });
    }
    
    // Also search for "cut resistant gloves" specifically
    const gloveRows: Array<{ rowIndex: number; row: string[] }> = [];
    rawData.forEach((row, index) => {
      if (row && row.length > 0) {
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('cut') && rowText.includes('resistant') && rowText.includes('glove')) {
          gloveRows.push({ rowIndex: index, row: row.slice(0, 10) });
        }
      }
    });
    
    if (gloveRows.length > 0) {
      console.log(`⚠ Found ${gloveRows.length} row(s) containing "cut resistant gloves":`);
      gloveRows.forEach(({ rowIndex, row }) => {
        console.log(`  Row ${rowIndex + 1}:`, row);
      });
    }
    
    const items = parseSheetData(rawData);
    const stats = calculateStats(items);
    
    console.log('API Response:', {
      itemsCount: items.length,
      statsTotalItems: stats.totalItems,
      firstItem: items[0],
      historicalDates: stats.historicalDates,
      rawHeaders: rawData[0],
      rawHeadersLength: rawData[0]?.length,
    });
    
    return NextResponse.json({ 
      items,
      stats,
      rawData // Include raw data for debugging
    }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Check for missing environment variables
    const hasSheetId = !!process.env.GOOGLE_SHEET_ID;
    const hasServiceAccount = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    
    // Log more details for debugging
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      hasSheetId,
      hasServiceAccount,
      serviceAccountLength: process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.length || 0,
    });
    
    // Provide helpful error messages
    let hint = '';
    if (!hasSheetId && !hasServiceAccount) {
      hint = 'Missing environment variables: GOOGLE_SHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON. Please add them in Vercel project settings.';
    } else if (!hasSheetId) {
      hint = 'Missing environment variable: GOOGLE_SHEET_ID. Please add it in Vercel project settings.';
    } else if (!hasServiceAccount) {
      hint = 'Missing environment variable: GOOGLE_SERVICE_ACCOUNT_JSON. Please add it in Vercel project settings.';
    } else if (errorMessage.includes('parse')) {
      hint = 'Check that GOOGLE_SERVICE_ACCOUNT_JSON is valid JSON. Make sure to paste the entire JSON file content, including all quotes and brackets.';
    } else {
      hint = errorMessage;
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch sheet data', 
        details: errorMessage,
        hint,
        hasSheetId,
        hasServiceAccount,
      },
      { status: 500 }
    );
  }
}

