import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Initialize Google Sheets API client
export async function getSheetsClient() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey && !serviceAccountPath) {
    throw new Error('Google Service Account credentials not found. SetGOOGLE_SHEET_IDGOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_KEY');
  }

  let credentials;
  if (serviceAccountKey) {
    // Parse JSON string from environment variable
    try {
      // Handle both string and already-parsed JSON
      if (typeof serviceAccountKey === 'string') {
        // Try parsing as-is first
        try {
          credentials = JSON.parse(serviceAccountKey);
        } catch (parseError) {
          // If parsing fails, try to fix common issues:
          // 1. Replace escaped newlines that might have been double-escaped
          let fixedJson = serviceAccountKey
            .replace(/\\n/g, '\n')  // Replace \\n with actual newlines
            .replace(/\\"/g, '"');   // Replace \\" with "
          
          // Try parsing again
          try {
            credentials = JSON.parse(fixedJson);
          } catch (secondError) {
            // If still failing, provide detailed error
            console.error('JSON Parse Error - Original:', parseError);
            console.error('JSON Parse Error - After fix:', secondError);
            console.error('JSON string length:', serviceAccountKey.length);
            console.error('JSON preview (first 200 chars):', serviceAccountKey.substring(0, 200));
            throw new Error(`Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON. Make sure it's valid JSON. Error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
          }
        }
      } else {
        // Already an object
        credentials = serviceAccountKey;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON: ${errorMessage}`);
    }
  } else if (serviceAccountPath) {
    // Read from file path (for local development)
    const fs = await import('fs');
    const path = await import('path');
    const keyFile = fs.readFileSync(path.resolve(process.cwd(), serviceAccountPath), 'utf8');
    credentials = JSON.parse(keyFile);
  }

  const auth = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

// Fetch all data from the Google Sheet
export async function fetchSheetData() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  
  if (!sheetId) {
    throw new Error('GOOGLE_SHEET_ID environment variable is not set');
  }

  const sheets = await getSheetsClient();
  
  try {
    // Get data from the "Master Inventory" sheet
    // Use a wider range to include historical columns (up to column ZZ if needed)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Master Inventory!A:ZZ', // Extended range to include historical columns on the right
    });

    return response.data.values || [];
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

// Get sheet metadata to understand structure
export async function getSheetMetadata() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  
  if (!sheetId) {
    throw new Error('GOOGLE_SHEET_ID environment variable is not set');
  }

  const sheets = await getSheetsClient();
  
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching sheet metadata:', error);
    throw error;
  }
}

