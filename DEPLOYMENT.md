# Im'In Deployment Guide

## Google Apps Script Backend Setup

### 1. Create Google Sheet
1. Go to [Google Drive](https://drive.google.com)
2. Create a new Google Sheet named "Im'In Data"
3. Create 4 tabs (exact names, case-sensitive):
   - `Users`
   - `Positions`
   - `Logs`
   - `Leaves`

### 2. Add Headers to Each Tab

**Users Tab** (Row 1):
```
User ID | Name | Email | Position ID | Role | Status | Created At | Password Hash
```

**Positions Tab** (Row 1):
```
Position ID | Position Name | Department
```

**Logs Tab** (Row 1):
```
Log ID | User ID | Type | Timestamp | Latitude | Longitude | Device Info
```

**Leaves Tab** (Row 1):
```
Leave ID | User ID | Leave Type | Start Date | End Date | Reason | Status
```

### 3. Deploy Google Apps Script

1. Open the Google Sheet
2. Extensions > Apps Script
3. Delete any default code and paste the contents of `gas/Code.gs`
4. In the Code.gs file, find the line:
   ```javascript
   var SPREADSHEET_ID = 'PUT_YOUR_SPREADSHEET_ID_HERE';
   ```
   Replace with your actual sheet ID (from the URL: `https://docs.google.com/spreadsheets/d/{ID}/edit`)

5. Deploy > New Deployment:
   - Type: Web app
   - Execute as: Your email
   - Who has access: Anyone
6. Copy the `/exec` URL

### 4. Add Initial Admin User

1. Call the signup endpoint once via the frontend to create the first user
2. Go back to your Google Sheet's "Users" tab
3. Find the new user row and manually change their "Role" column to `Admin`

## Frontend Deployment (Vercel)

### 1. Environment Variables

Create `.env` in the project root:
```
VITE_GAS_API_URL=https://script.google.com/macros/d/YOUR_GAS_ID/userweb/exec
```

Replace `YOUR_GAS_ID` with the script ID from the GAS deployment URL.

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### 3. Post-Deployment

- The app will be available at your Vercel URL
- Share the link with your team
- Instruct admins to set up positions before onboarding users

## Features Summary

### User Features
- **Time Clock**: Clock in/out with geolocation
- **Location Map**: See where punches were recorded
- **Shift Calendar**: View logs and scheduled shifts (basic)
- **Leave Requests**: Submit and track leave requests by type and date range

### Admin Features
- **Analytics Dashboard**: Overview of clocked-in employees, pending leaves, weekly hours, 7-day attendance trend
- **Position Management**: Add, edit, delete corporate positions
- **Leave Approval**: Approve or reject all employee leave requests

## Architecture

- **Frontend**: React + Vite + Zustand + React Query + Tailwind
- **Backend**: Google Apps Script with Google Sheets as relational DB
- **API**: Text/plain POST/GET to avoid CORS preflight
- **Hosting**: Vercel (frontend)

All data syncs via Google Sheets; no external database needed.
