Act as an expert Full-Stack Software Architect and Senior React Engineer. I need you to help me build a complete, production-ready Progressive Web Application (PWA) named "Im'In". This is a Time-In/Time-Out ERP system designed for small-to-medium businesses.

Please review the architectural requirements, database schemas, and stack constraints below, and guide me through building this application step-by-step, providing the complete code for each file.

---

### 1. PROJECT OVERVIEW & TECH STACK
- **App Name:** Im'In
- **Deployment Platform:** Vercel
- **Frontend Framework:** React (JSX) with Vite
- **Styling:** Tailwind CSS (Modern, dark/glassmorphic aesthetic preferred)
- **Routing:** React-Router-Dom
- **API Client:** Axios
- **State Management:** Zustand (for global authentication & PWA UI states)
- **Server Cache:** TanStack Query / React Query (to cache shift logs, positions, and leaves from the database)
- **Database Backend:** Google Sheets (acting as the relational database) via a Google Apps Script (GAS) Web App middleware executable URL. (Note: All frontend API requests must hit the GAS URL using standard Axios text/plain POST/GET patterns to avoid pre-flight CORS blocks and prevent exposing Google API keys).

---

### 2. ROLE-BASED ACCESS CONTROL (RBAC) & FEATURES
The system must support two user roles: Admin and User.

#### User Features:
- **Authentication:** Dedicated signup and login views. During signup, users must be able to select their corporate position from a dynamic dropdown list fetched from the database.
- **Time Clock:** A clean, centralized dashboard featuring an interactive "Clock In / Clock Out" button.
- **Geolocation & Mapping:** When a user punches in or out, use the browser's native HTML5 Geolocation API to capture their latitude and longitude coordinates. Display their current punch location on a map inside their dashboard using a free alternative like `react-leaflet` (OpenStreetMap).
- **Shift Calendar:** A custom grid or lightweight calendar displaying past clock logs and upcoming scheduled shifts.
- **Hours Calculation:** Automatically calculate total hours worked for the current day, week, and pay period.
- **Leave Requests:** A functional form allowing users to submit leave requests (e.g., Sick, Vacation) with specific date ranges and justifications.

#### Admin Features:
- **Global Overview Analytics:** A dashboard displaying key metric cards (Total employees clocked in today, pending leave requests, total weekly hours). Include charts showing attendance trends using a library like Recharts.
- **Dynamic Position Management:** An interface where the Admin can add, edit, or delete corporate positions (e.g., "Full-Stack Developer", "UI/UX Designer"). When an admin adds a position, it must save directly to the database so that new users instantly see it in their registration dropdown menu.
- **Leave Management Panel:** A master interface to view all employee leave requests, with operational buttons to "Approve" or "Reject" them.

---

### 3. DATABASE SCHEMA DESIGNS (GOOGLE SHEETS)
The Google Spreadsheet contains 4 distinct sheets (tabs) with the following headers in Row 1:
1. `Users`: [User ID, Name, Email, Position ID, Role, Status, Created At]
2. `Positions`: [Position ID, Position Name, Department]
3. `Logs`: [Log ID, User ID, Type (IN/OUT), Timestamp, Latitude, Longitude, Device Info]
4. `Leaves`: [Leave ID, User ID, Leave Type, Start Date, End Date, Reason, Status (Pending/Approved/Rejected)]

---

### 4. WHAT I NEED YOU TO DO NOW:
To kick off the build process, please provide me with:
1. The **complete deployment-ready JavaScript code for the Google Apps Script Web App Engine** that will handle all my API routes (`doPost` and `doGet`) for reading/writing to these 4 sheets securely.
2. The recommended folder blueprint and file structure for my Vite React project.
3. The Vite configuration file (`vite.config.js`) configured with `@vite-pwa/plugin` for maximum PWA compliance (manifest details, maskable icons, standalone settings, and offline caching).

Once you give me these foundational files, we will move file-by-file through the frontend views, starting with the Zustand store and Axios client instance. Let's begin!