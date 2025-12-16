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
    
    // Log more details for debugging
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      hasSheetId: !!process.env.GOOGLE_SHEET_ID,
      hasServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      serviceAccountLength: process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.length || 0,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch sheet data', 
        details: errorMessage,
        hint: errorMessage.includes('parse') 
          ? 'Check that GOOGLE_SERVICE_ACCOUNT_JSON is valid JSON. Make sure to paste the entire JSON file content, including all quotes and brackets.'
          : undefined
      },
      { status: 500 }
    );
  }
}

