# Inventory Dashboard

A sophisticated inventory management dashboard that connects to Google Sheets.

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
GOOGLE_SHEET_ID=16Fdfq1MOLVZ1FCVpl06qfcSce83GTMQtk2d9_eCQO9U
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**To get the JSON content:**
1. Open your `inventory-dashboar-481203-3c0b6aae8a7a.json` file
2. Copy the entire contents
3. Paste it as a single line in the `GOOGLE_SERVICE_ACCOUNT_JSON` variable (remove all line breaks)

**Important:** The `.env.local` file is already in `.gitignore` and won't be committed to git.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Deployment to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard:
   - `GOOGLE_SHEET_ID`: Your Google Sheet ID
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: The entire JSON content as a single line string

## Project Structure

- `app/` - Next.js app directory with pages and API routes
- `lib/` - Utility functions and Google Sheets integration
- `components/` - React components (to be created)
- `.env.local` - Local environment variables (not committed)

