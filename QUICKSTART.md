`# Im'In Quickstart

## What's Built

A complete Time-In/Time-Out ERP system with:

### Frontend (React + Vite)
- **Login/Signup**: Email + password auth with role-based access (User/Admin)
- **User Dashboard**: Clock in/out with live geolocation tracking, map display
- **Leave Management**: Submit, track, and list leave requests (Sick/Vacation)
- **Admin Dashboard**: Analytics cards (clocked-in count, pending leaves, weekly hours) + 7-day attendance chart
- **Position Management**: Add/edit/delete job positions (admin only)
- **Leave Approvals**: Approve/reject all employee leave requests (admin only)
- **Dark Glassmorphic UI**: Modern slate + purple theme with Tailwind CSS

### Backend (Google Apps Script)
- RESTful API over Google Sheets (4 tabs: Users, Positions, Logs, Leaves)
- Session-based auth with password hashing
- Lock-based concurrent write safety
- Geolocation logging for every punch
- Automatic IN/OUT toggle (server-side enforcement)

## Project Structure

```
src/
├── api/
│   └── client.js           # Axios instance for GAS API (text/plain POST)
├── components/
│   └── Layout.jsx          # Shared nav, route guards, logout
├── pages/
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx       # Clock in/out + map + today's logs
│   ├── Leaves.jsx          # Leave request form + list
│   ├── AdminDashboard.jsx  # Analytics cards + attendance chart
│   ├── AdminPositions.jsx  # CRUD positions
│   └── AdminLeaves.jsx     # Approve/reject leave requests
├── store/
│   └── authStore.js        # Zustand: token, user, auth helpers
├── router.jsx              # React Router with protected routes
├── ProtectedRoute.jsx      # Route guard component
└── main.jsx                # App entry, QueryClient provider
```

## Development

1. **Set GAS_URL** in `src/api/client.js` or via `VITE_GAS_API_URL` env var
2. **Start dev server**:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:5174` in your browser
4. Follow DEPLOYMENT.md to set up Google Apps Script and Sheets

## Testing Flow

1. Go to signup, create a test account with any position
2. Manually promote to Admin in the Google Sheet (edit "Role" cell)
3. Log out, log back in as admin
4. Add a few positions via admin UI
5. Create another user account as a regular employee
6. Test clock in (grants location access), verify map shows location
7. Clock out
8. Request leave
9. Switch back to admin, approve the leave
10. Check analytics dashboard

## Key Tech Choices

- **Zustand** over Context: simpler, no provider hell
- **React Query**: automatic refetch, caching for logs/leaves/positions
- **Google Sheets**: no backend infra, RBAC at sheet level
- **Text/plain API calls**: avoids CORS preflight, keeps GAS endpoint simple
- **Tailwind dark mode**: clean, modern, glassmorphic aesthetic
- **react-leaflet**: free, lightweight map library (OpenStreetMap)
- **Recharts**: lightweight bar charts for analytics

## Environment Variables

Create `.env`:
```
VITE_GAS_API_URL=https://script.google.com/macros/d/YOUR_SCRIPT_ID/userweb/exec
```

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint check
npm run preview   # Preview dist locally
```

## Notes

- **Password storage**: Salted SHA-256 hashes, never plaintext
- **Session TTL**: 6 hours, stored in GAS cache
- **Geolocation**: Requires HTTPS in production (Vercel handles this)
- **No database**: All data in Google Sheets, edited via GAS API
- **Admin bootstrap**: First user must be manually promoted via Sheets

For full deployment steps, see DEPLOYMENT.md.
