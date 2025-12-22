# Inventory Dashboard Project - Planning Document

## Background and Motivation

The user has a Google Sheet-based master inventory system with the following structure:
- **Item ID Column**: Contains location information (area, bolded location name, regular font for shelf details like "Shelf 1 Row B")
- **Color coding**: Each location is filled with different colors for visual distinction
- **Item Name Column**: Name of the inventory item
- **Stock Column**: Current counted amount (from table - "Total" column)
- **Par Column**: Minimum threshold before reordering
- **Order Amount Column**: Calculated as (Par - Stock) to determine reorder quantity

### Updated Sheet Structure (as of latest update):
The sheet now includes weekly inventory tracking with usage calculations:
- **Table columns**: Location, Product, Total, Par Level, Quantity to Order, Link to Order More
- **Historical tracking columns** (repeating pattern for each week):
  - `Inv MM/DD` - Inventory count for that date
  - `Ordered` - Amount ordered that week
  - `MM/DD-MM/DD Usage` - Calculated usage: (previous count + ordered) - current count
- **Pattern**: "Inv 12/08", "Ordered", "Inv 12/15", "12/8-12/15 Usage", "Ordered", "Inv 12/22", "12/15-12/22 Usage", "Ordered"
- **First date** (12/08) has no usage column (it's the baseline)
- **Each Monday**: User adds new date column and usage column for previous week
- **Below Par Detection**: Uses most recent date column (e.g., 12/22) vs Par Level column
- **Volatility Calculation**: Uses running standard deviation of usage values (not stock changes)

**Goal**: Create a sophisticated, professional inventory dashboard hosted on Vercel that:
- Displays all inventory information in a beautiful, sensical way
- Features pie charts and graphs at the top
- Highlights important changes (stock dips, low inventory alerts)
- Allows updates to the Google Sheet
- Follows industry best practices for reliable inventory management systems

## Key Challenges and Analysis

### Technical Challenges:
1. **Google Sheets API Integration**: Need to securely connect and fetch data from Google Sheets
2. **Real-time Data Sync**: Ensuring dashboard reflects current Google Sheet state
3. **Data Parsing**: Handling the Item ID column format (bolded location + regular font shelf info)
4. **Color Mapping**: Preserving or translating the color coding from Google Sheets
5. **Performance**: Efficient data fetching and caching strategies
6. **Authentication**: Secure access to Google Sheets data

### Industry Best Practices (Research Findings):
1. **Real-Time Inventory Tracking**: Provide real-time visibility for proactive decision-making
2. **ABC Analysis**: Categorize items by value/impact (A = high value, B = medium, C = low)
3. **Safety Stock Optimization**: Balance risk mitigation with cost efficiency
4. **Visual Hierarchy**: Place critical alerts (stock dips, reorder points) prominently
5. **KPIs**: Track stock levels, order fulfillment rates, inventory turnover ratios
6. **Automation**: Leverage automation for predictive ordering
7. **Data Integrity**: Regular data quality checks and validation

### Design Considerations:
- Professional, modern UI using industry-standard design patterns
- Responsive design for mobile/tablet/desktop
- Clear visual hierarchy with alerts prominently displayed
- Intuitive navigation and filtering
- Fast loading times and smooth interactions

## High-level Task Breakdown

### Phase 1: Project Setup and Foundation
**Task 1.1: Initialize Next.js Project**
- Create Next.js 14+ project with TypeScript
- Set up Tailwind CSS for styling
- Configure project structure
- **Success Criteria**: Project runs locally, TypeScript compiles without errors, Tailwind works

**Task 1.2: Set Up Google Sheets API Integration**
- **Step-by-step guide for user to follow:**
  1. Find Google Sheet ID from the URL (explained below)
  2. Create Google Cloud Project (we'll guide through this)
  3. Enable Google Sheets API
  4. Create Service Account (recommended approach - simpler than OAuth)
  5. Download service account JSON key file
  6. Share Google Sheet with service account email
  7. Test API connection and data fetching
- **Success Criteria**: Can successfully fetch data from Google Sheet, credentials are secure

**Google Sheet ID Explanation:**
- The Google Sheet ID is found in the URL of your Google Sheet
- URL format: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit#gid=0`
- Example: If your URL is `https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit`, then `1a2b3c4d5e6f7g8h9i0j` is your Sheet ID
- We'll need this ID to connect to your sheet

**Shareable Link Explanation:**
- A shareable link allows others (or our service account) to access your Google Sheet
- We'll need to share the sheet with a service account email (which we'll create)
- This is different from making it publicly viewable - it's a private share with our service account

**Task 1.3: Environment Configuration**
- Set up environment variables for API keys
- Configure Vercel deployment settings
- Create `.env.local` and `.env.example` files
- **Success Criteria**: Environment variables properly configured, no secrets in code

### Phase 2: Data Layer and Parsing
**Task 2.1: Data Fetching Service**
- Create service to fetch Google Sheets data
- Implement caching strategy (SWR or React Query)
- Handle API rate limits and errors
- **Success Criteria**: Data fetches reliably, proper error handling, caching works

**Task 2.2: Data Parsing and Transformation**
- Parse Item ID column (extract location and shelf info)
- Handle bold formatting from Google Sheets
- Map color information if possible
- Transform data into structured format
- Calculate derived metrics (order amounts, stock status)
- **Success Criteria**: All data correctly parsed, location info extracted properly

**Task 2.3: Data Models and Types**
- Define TypeScript interfaces for inventory items
- Create data validation schemas
- Handle edge cases (missing data, invalid formats)
- **Success Criteria**: Type-safe data models, validation catches errors

### Phase 3: Dashboard UI Components
**Task 3.1: Layout and Navigation**
- Create main dashboard layout
- Implement responsive navigation
- Set up routing structure
- **Success Criteria**: Layout works on all screen sizes, navigation is intuitive

**Task 3.2: KPI Cards and Summary Section**
- Display total items, total stock value
- Show items below par (critical alerts)
- Display total order amount needed
- Create visually appealing KPI cards
- **Success Criteria**: KPIs display correctly, numbers are accurate

**Task 3.3: Chart Components (Top Section)**
- Pie chart: Stock distribution by location
- Bar chart: Items below par
- Line chart: Stock trends over time (if historical data available)
- Stock vs Par comparison chart
- Use Recharts or Chart.js library
- **Success Criteria**: Charts render correctly, data is accurate, responsive

**Task 3.4: Alert System**
- Highlight items with stock dips (below par)
- Visual indicators for critical items
- Sort/filter by alert priority
- **Success Criteria**: Alerts are visible and accurate, filtering works

**Task 3.5: Inventory Table/Grid**
- Display all inventory items in sortable table
- Show location, item name, stock, par, order amount
- Implement filtering by location, item name
- Implement sorting by various columns
- Color code rows by location (if possible)
- **Success Criteria**: Table displays all data, sorting/filtering works, responsive

### Phase 4: Advanced Features
**Task 4.1: Search and Filtering**
- Global search across all columns
- Filter by location, stock status, item name
- Advanced filter combinations
- **Success Criteria**: Search is fast and accurate, filters work correctly

**Task 4.2: Data Refresh and Updates**
- Manual refresh button
- Auto-refresh interval (configurable)
- Loading states during refresh
- **Success Criteria**: Data updates correctly, loading states work

**Task 4.3: Export Functionality**
- Export filtered data to CSV
- Print-friendly view
- **Success Criteria**: Exports work correctly, data format is correct

### Phase 5: Polish and Optimization
**Task 5.1: Styling and Design Polish**
- Apply consistent color scheme
- Ensure professional appearance
- Add animations and transitions
- Optimize for accessibility
- **Success Criteria**: Dashboard looks professional, accessible, smooth interactions

**Task 5.2: Performance Optimization**
- Optimize data fetching
- Implement proper caching
- Code splitting and lazy loading
- Optimize bundle size
- **Success Criteria**: Dashboard loads quickly, smooth interactions

**Task 5.3: Error Handling and Edge Cases**
- Handle API failures gracefully
- Show user-friendly error messages
- Handle empty states
- Handle malformed data
- **Success Criteria**: Errors are handled gracefully, user experience is good

### Phase 6: Deployment and Testing
**Task 6.1: Vercel Deployment Setup**
- Configure Vercel project
- Set up environment variables in Vercel
- Configure build settings
- Test deployment
- **Success Criteria**: Dashboard deploys successfully to Vercel

**Task 6.2: Testing**
- Test all features end-to-end
- Test on different devices/browsers
- Test with various data scenarios
- User acceptance testing
- **Success Criteria**: All features work correctly, no critical bugs

**Task 6.3: Documentation**
- Create README with setup instructions
- Document Google Sheets setup requirements
- Document environment variables
- **Success Criteria**: Clear documentation for setup and usage

## Technology Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui (optional, for professional components)
- **Charts**: Recharts or Chart.js
- **Data Fetching**: SWR or TanStack Query (React Query)
- **Google Sheets API**: @googleapis/sheets
- **Deployment**: Vercel
- **Authentication**: Google OAuth 2.0 or Service Account

## Project Status Board

- [ ] Phase 1: Project Setup and Foundation
  - [ ] Task 1.1: Initialize Next.js Project
  - [ ] Task 1.2: Set Up Google Sheets API Integration
  - [ ] Task 1.3: Environment Configuration
- [ ] Phase 2: Data Layer and Parsing
  - [ ] Task 2.1: Data Fetching Service
  - [ ] Task 2.2: Data Parsing and Transformation
  - [ ] Task 2.3: Data Models and Types
- [ ] Phase 3: Dashboard UI Components
  - [ ] Task 3.1: Layout and Navigation
  - [ ] Task 3.2: KPI Cards and Summary Section
  - [ ] Task 3.3: Chart Components (Top Section)
  - [ ] Task 3.4: Alert System
  - [ ] Task 3.5: Inventory Table/Grid
- [ ] Phase 4: Advanced Features
  - [ ] Task 4.1: Search and Filtering
  - [ ] Task 4.2: Data Refresh and Updates
  - [ ] Task 4.3: Export Functionality
- [ ] Phase 5: Polish and Optimization
  - [ ] Task 5.1: Styling and Design Polish
  - [ ] Task 5.2: Performance Optimization
  - [ ] Task 5.3: Error Handling and Edge Cases
- [ ] Phase 6: Deployment and Testing
  - [ ] Task 6.1: Vercel Deployment Setup
  - [ ] Task 6.2: Testing
  - [ ] Task 6.3: Documentation

## Current Status / Progress Tracking

**Current Phase**: Phase 4 - Advanced Features (IN PROGRESS)

**Last Updated**: Planning historical inventory tracking and volatility analysis

**Credentials Obtained**:
- ✅ Google Sheet ID: `16Fdfq1MOLVZ1FCVpl06qfcSce83GTMQtk2d9_eCQO9U`
- ✅ Service Account JSON: `inventory-dashboar-481203-3c0b6aae8a7a.json`
- ✅ Google Sheet shared with service account email

**Notes**: 
- Research completed on industry best practices
- Technology stack selected
- Task breakdown created with clear success criteria
- User has completed Google Sheets API setup
- Starting implementation in Executor mode

## Executor's Feedback or Assistance Requests

**Completed:**
- ✅ Task 1.1: Next.js project initialized with TypeScript and Tailwind CSS
- ✅ Basic project structure created
- ✅ Google Sheets API library installed (@googleapis/sheets, swr, recharts)
- ✅ Created Google Sheets service functions in lib/google-sheets.ts
- ✅ Created API route for fetching sheet data

**Completed:**
- ✅ Task 1.3: Environment Configuration
  - Created `.env.local` file with Google Sheet ID and Service Account JSON
  - Environment variables properly configured
- ✅ API Connection Tested Successfully!
  - Google Sheets API is working
  - Data is being fetched correctly
  - Sheet structure identified:
    - Column 1: Item ID (location info - "Trailer", "Shelf 1 Row A", etc.)
    - Column 2: Item name
    - Column 3: Type
    - Column 4: Stock
    - Column 5: Par
    - Column 6: Order Amount

**Completed:**
- ✅ Phase 1: Project Setup and Foundation - COMPLETE
- ✅ Phase 2: Data Layer and Parsing - COMPLETE
- ✅ Phase 3: Dashboard UI Components - COMPLETE
  - ✅ Layout and Navigation
  - ✅ KPI Cards (Total Items, Total Stock, Items Below Par, Total Order Amount)
  - ✅ Charts Section (Pie chart for stock distribution, Bar chart for items below par)
  - ✅ Alert System (highlights items below par)
  - ✅ Inventory Table (sortable, searchable, filterable)

**Current Status:**
- Dashboard is fully functional and displaying data
- All core features implemented
- ✅ Historical inventory tracking and volatility analysis COMPLETE
- Ready for testing and refinement

**Completed Features:**
- ✅ Historical inventory data parsing (detects "Inv MM/DD" columns)
- ✅ Automatic detection of most recent inventory column
- ✅ Week-over-week change calculations
- ✅ Standard deviation calculations for volatility analysis
- ✅ High volatility item flagging (2 standard deviations threshold)
- ✅ Historical Data page with timeline view
- ✅ Volatility indicators in inventory table
- ✅ Volatility filter in inventory table
- ✅ High Volatility KPI card on main dashboard

### Updated Sheet Structure (Latest - Weekly Tracking with Usage)

**Column Pattern (repeating for each week):**
1. `Inv MM/DD` - Inventory count for that Monday date
2. `Ordered` - Amount ordered that week
3. `MM/DD-MM/DD Usage` - Calculated usage: (previous count + ordered) - current count
4. `Ordered` - Amount ordered for next week (if applicable)

**Example Structure:**
- `Inv 12/08` (first date - no usage column)
- `Ordered`
- `Inv 12/15`
- `12/8-12/15 Usage`
- `Ordered`
- `Inv 12/22`
- `12/15-12/22 Usage`
- `Ordered`

**Key Changes:**
- **Volatility Calculation**: Now uses running standard deviation of **usage values** (not stock changes)
- **Below Par Detection**: Uses most recent date column (e.g., 12/22) vs Par Level column
- **Usage Formula**: (Previous Count + Ordered) - Current Count = Usage
- **Weekly Updates**: Every Monday, user adds new date column and usage column for previous week

**Implementation Notes:**
- Parser detects usage columns by pattern: "MM/DD-MM/DD Usage"
- Parser detects "Ordered" columns and associates them with preceding date columns
- Volatility metrics now track `historicalUsage[]` array for running standard deviation
- Most recent date column automatically used for current stock and below par detection

## NEW FEATURE: Historical Inventory Tracking & Volatility Analysis

### Background
The Google Sheet contains weekly inventory counts in columns on the far right:
- **Inv 12/08**: Inventory count from 12/08 (previous week)
- **Inv 12/15**: Inventory count from 12/15 (current/most recent week)
- Future weeks will be added as new columns

**Requirements:**
1. Use the most recent inventory column (12/15) for all current stock numbers displayed
2. Track all historical inventory entries (12/08, 12/15, etc.)
3. Calculate change between consecutive dates
4. Calculate standard deviation of changes over time
5. Compare current week's change to historical standard deviation to flag high volatility items
6. Add sidebar section for historical entries view

### Key Challenges and Analysis

**Technical Challenges:**
1. **Column Detection**: Dynamically identify inventory date columns (format: "Inv MM/DD" or similar)
2. **Data Structure**: Store historical data per item with date-based snapshots
3. **Change Calculation**: Calculate week-over-week changes for each item
4. **Standard Deviation**: Calculate standard deviation of changes (requires 2+ data points)
5. **Volatility Detection**: Flag items where current change exceeds historical standard deviation
6. **UI Design**: Display historical data in sidebar without cluttering main dashboard

**Data Flow:**
1. Parse all inventory date columns from sheet
2. Identify most recent date column (use for current stock)
3. Store historical snapshots per item
4. Calculate changes between consecutive dates
5. Calculate standard deviation of changes per item
6. Compare current change to standard deviation threshold

### High-level Task Breakdown

**Task 4.4: Historical Inventory Data Parsing**
- Update parser to detect inventory date columns (format: "Inv MM/DD")
- Identify most recent date column automatically
- Parse all historical inventory columns
- Store historical data per item with date stamps
- **Success Criteria**: Parser correctly identifies all inventory date columns, extracts historical data, identifies most recent date

**Task 4.5: Historical Data Models and Types**
- Extend `InventoryItem` interface to include historical data
- Create `HistoricalSnapshot` interface for date-based inventory counts
- Create `VolatilityMetrics` interface for change calculations
- Update `DashboardStats` to include volatility metrics
- **Success Criteria**: Type-safe data models for historical tracking, all types properly defined

**Task 4.6: Change Calculation and Standard Deviation**
- Calculate week-over-week changes for each item
- Calculate standard deviation of changes per item (requires 2+ data points)
- Handle edge cases (missing data, single data point)
- Store volatility metrics per item
- **Success Criteria**: Changes calculated correctly, standard deviation computed accurately, handles edge cases

**Task 4.7: Volatility Detection and Flagging**
- Compare current week's change to historical standard deviation
- Flag items with high volatility (change > threshold * standard deviation)
- Define volatility threshold (e.g., 2 standard deviations = high volatility)
- Add `isHighVolatility` flag to inventory items
- **Success Criteria**: High volatility items correctly identified and flagged

**Task 4.8: Historical Data Sidebar Section**
- Create new sidebar navigation item for "Historical Data"
- Create historical data page/component
- Display historical entries in chronological order
- Show date, stock count, and change for each entry per item
- Show standard deviation and volatility status
- **Success Criteria**: Historical data view accessible from sidebar, displays all historical entries clearly

**Task 4.9: Update Current Stock to Use Most Recent Column**
- Modify parser to use most recent inventory column (12/15) for `stock` field
- Ensure all dashboard displays use most recent data
- Update KPI calculations to use most recent stock
- **Success Criteria**: All current stock numbers come from most recent inventory column

**Task 4.10: Volatility Indicators in Main Dashboard**
- Add volatility indicators to inventory table
- Highlight high volatility items in alerts section
- Add volatility filter to inventory table
- Create volatility KPI card showing count of high volatility items
- **Success Criteria**: Volatility indicators visible in main dashboard, filtering works correctly

### Implementation Details

**Data Structure:**
```typescript
interface HistoricalSnapshot {
  date: string; // "12/08" or "12/15"
  stock: number;
  change?: number; // Change from previous date
}

interface VolatilityMetrics {
  standardDeviation: number | null; // null if < 2 data points
  currentChange: number;
  isHighVolatility: boolean;
  historicalChanges: number[]; // Array of all changes
}

interface InventoryItem {
  // ... existing fields
  stock: number; // From most recent inventory column
  historicalSnapshots: HistoricalSnapshot[];
  volatility?: VolatilityMetrics;
}
```

**Parser Updates:**
1. Scan headers for columns matching "Inv MM/DD" pattern
2. Sort date columns chronologically
3. Use most recent column for current stock
4. Store all historical columns as snapshots
5. Calculate changes between consecutive dates

**Standard Deviation Calculation:**
- Formula: σ = √(Σ(x - μ)² / n)
- Where x = individual changes, μ = mean of changes, n = number of changes
- Requires at least 2 data points (1 change) to calculate
- If only 1 data point, standard deviation = null

**Volatility Threshold:**
- Default: 2 standard deviations
- If current change > (mean + 2 * standard deviation), flag as high volatility
- If standard deviation is null (only 1 data point), cannot determine volatility

**UI Components:**
1. Sidebar: Add "Historical Data" link
2. Historical Page: Table showing all items with historical timeline
3. Volatility Badge: Visual indicator in inventory table
4. Volatility Filter: Filter items by volatility status
5. Volatility KPI: Card showing high volatility item count

**Action Required:**
- Executor will provide detailed step-by-step instructions during Task 1.2
- Will guide user through Google Cloud Console setup
- Will explain how to find Sheet ID from URL
- Will explain service account approach (simpler than OAuth)

## Google Sheets API Setup Guide (For User Reference)

### What You Need to Provide:
1. **Google Sheet ID**: Found in your Google Sheet URL
   - Open your inventory Google Sheet
   - Look at the URL in your browser
   - The ID is the long string between `/d/` and `/edit`
   - Example: `https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit`
   - The ID is: `1a2b3c4d5e6f7g8h9i0j`

### Step-by-Step Setup Instructions:

**Step 1: Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click "Select a project" → "New Project"
4. Enter project name (e.g., "Inventory Dashboard")
5. Click "Create"
6. Wait for project creation, then select it

**Step 2: Enable Google Sheets API**
1. In Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and click "Enable"
4. Wait for it to enable (may take a minute)

**Step 3: Create Service Account (IMPORTANT - Not OAuth!)**
1. Go to "APIs & Services" → "Credentials"
2. **Make sure you're on the "Credentials" page, NOT "OAuth consent screen"**
3. Click "Create Credentials" → **"Service Account"** (NOT "OAuth client ID")
   - If you see options like "User data" vs "Firebase data", you're in the wrong place - go back to Credentials
   - Service Account is a different option - look for it in the dropdown
4. Enter a name (e.g., "inventory-dashboard-service")
5. Click "Create and Continue"
6. Skip optional steps (Role and Grant Access), click "Done"
7. You should now see your service account in the list

**Step 4: Create and Download Key**
1. In the Service Accounts list, click on the service account you just created
2. Go to "Keys" tab (at the top of the service account details page)
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Click "Create" - this downloads a JSON file
6. **IMPORTANT**: Save this file securely - we'll need it for the project
7. **What the JSON should contain**: Look for `client_email` field (not `client_id`)
   - Service Account JSON has: `type`, `project_id`, `private_key_id`, `private_key`, `client_email`, `client_id`, `auth_uri`, `token_uri`
   - OAuth JSON has: `client_id`, `client_secret`, `redirect_uris` (this is NOT what we need)
8. If your JSON doesn't have `client_email`, you created OAuth credentials instead - go back to Step 3

**Step 5: Share Google Sheet with Service Account**
1. Open the downloaded JSON file
2. Find the `client_email` field (looks like: `inventory-dashboard-service@project-name.iam.gserviceaccount.com`)
3. Copy that email address
4. Open your inventory Google Sheet
5. Click "Share" button (top right)
6. Paste the service account email
7. Give it "Viewer" access (read-only is fine for now)
8. Click "Send" (you can uncheck "Notify people" if you want)

**Important Security Note:**
- ✅ **This works perfectly with private/restricted sheets!** The service account is just another user you're sharing with
- The service account email will appear in your sheet's sharing list alongside your other users
- Your sheet can remain private - only shared with you, your team members, and the service account
- The service account only has the permissions you give it (Viewer = read-only, Editor = can modify)
- This is the standard, secure way to connect applications to private Google Sheets

**Step 6: Provide Information to Executor**
- Google Sheet ID (from URL)
- The downloaded JSON key file (or its contents - we'll add it to environment variables)

**Troubleshooting: OAuth vs Service Account**

**If you created OAuth 2.0 credentials by mistake:**
- OAuth JSON contains: `client_id`, `client_secret`, `redirect_uris` - this is for user login flows
- Service Account JSON contains: `client_email`, `private_key` - this is what we need
- **Solution**: Go back to "Credentials" → "Service Accounts" tab → Create a Service Account
- You can ignore/delete the OAuth credentials you created

**Why Service Account is better for this project:**
- Service Account = automated access (no user login required)
- OAuth = requires users to log in with Google account
- For a dashboard that just reads your sheet, Service Account is simpler and more appropriate

**Alternative: If you prefer OAuth approach:**
- We can implement OAuth, but it requires users to log in to Google
- More complex implementation, but works if you want user authentication
- Executor can discuss this option if preferred

## Lessons

*This section will be updated as we learn from implementation*

### Implementation Lessons
- **Always import Link from 'next/link'**: When using the Link component in any file, ensure the import statement is present at the top. Fixed in AlertsSection.tsx, Sidebar.tsx, and KPICard.tsx.
- **Next.js build cache**: When clearing .next directory, restart the dev server to regenerate required manifest files.
- **usePathname hook**: Must be called unconditionally at the top level of client components. Cannot be called conditionally or in try-catch blocks.

### User Specified Lessons
- Include info useful for debugging in the program output
- Read the file before you try to edit it
- If there are vulnerabilities that appear in the terminal, run npm audit before proceeding
- Always ask before using the -force git command

