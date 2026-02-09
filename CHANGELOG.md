# CRAD Field Service Calendar - Changelog

## Version 2.0.0 (In Progress - February 8, 2026)

### Multi-Department Platform Expansion

This version transforms the single-purpose Field Service calendar into a multi-department, multi-region platform. See `clinical-apps-implementation.md` for full architecture details.

#### Phase 1: Config Extraction (COMPLETE)

**New Config System:**
- Created `src/config/` directory structure for department and region configs
- `src/config/departments/field_service.js` - Field Service event types, colors, products
- `src/config/departments/clinical.js` - Clinical Applications event types, colors, products
- `src/config/regions/americas.js` - Americas holidays, reminders, admin password
- `src/config/index.js` - Central config loader with environment variable support

**Environment Variables:**
- `VITE_DEPARTMENT` - Sets active department (`field_service` or `clinical`)
- `VITE_REGION` - Sets active region (`americas`)
- `.env` - Default config (Field Service Americas)
- `.env.clinical` - Clinical mode for local testing (`npx vite --mode clinical`)

**Code Refactoring:**
- Removed all hardcoded constants from `crad-calendar.jsx`
- `EVENT_TYPES` → `departmentConfig.eventTypes`
- `PRODUCTS` → `departmentConfig.products`
- `REMINDERS` → `regionConfig.reminders`
- `HOLIDAYS` → `regionConfig.holidays`
- `ADMIN_PASSWORD` → `regionConfig.adminPassword`
- Updated `getEventTypeColor()` to use config-based color lookup
- Made 2-month view legend dynamic (generated from config)
- Added department/region label in header ("Americas — Field Service" or "Americas — Clinical Applications")

**Clinical Applications Config:**
- Event Types: First Line, Vacation, Refresh Catalyst, Refresh Sentinel, Phase 1 Catalyst Training, Phase 2 Catalyst Training, Phase 1 Sentinel Training, Phase 2 Sentinel Training, Custom
- Products: Catalyst + HD, Catalyst + Lite, Catalyst + HD PT, Sentinel, cAutoVerify

#### Phase 2: Firebase Data Migration (COMPLETE)

**Migration Script:**
- Created `scripts/migrate-firestore.html` - Browser-based migration tool
- Adds `region` and `department` fields to all existing employees and events
- Preview mode to see changes before applying
- Safe to run multiple times (skips already-migrated documents)

**Firestore Query Updates:**
- Added `query` and `where` imports from Firebase
- Employees listener now filters by `region` + `department`
- Events listener now filters by `region` + `department`
- New employees/events automatically include `region` and `department` fields
- Removed `DEFAULT_EMPLOYEES` fallback (each department manages its own employees)

#### Phase 3: Cross-Department Toggle (COMPLETE)

**Cross-Department Visibility:**
- New "Show [Other Department]" toggle button in header
- When enabled, displays other department's employees and events
- Cross-view data is read-only (view only, no editing)

**Visual Distinction for Cross-View Data:**
- Amber-tinted background on employee name column
- Department label shown next to employee name (e.g., "(Clinical Applications)")
- Reduced opacity (60%) for cross-view rows
- Works in all views: Week, Bi-Weekly, 2-Month, and Mobile

**Technical Implementation:**
- `crossViewEnabled` state controls toggle
- Separate Firestore listeners for cross-department data
- `allDisplayEmployees` combines home + cross-view employees
- `getEventsForEmployee()` accepts `isCrossView` parameter to fetch from correct event source

#### Phase 4: Vercel Deployment (PENDING)
- Purchase domain (e.g., cradcalendar.com)
- Deploy to Vercel with subdomains per department/region
- Remove GitHub Pages deployment

---

## Version 1.2.0 (January 26, 2026)

### Company Holidays
- **Holiday Display**: Company holidays now shown on all calendar views
  - New Year's Day (January 1)
  - President's Day (February 16)
  - Memorial Day (May 25)
  - Independence Day (July 3)
  - Labor Day (September 7)
  - Thanksgiving (November 26-27)
  - Christmas Day (December 25)
- **Visual Styling**: Holidays highlighted with red background and badges
  - Week/Bi-Weekly view: Red background with holiday name badge
  - 2-Month view: Red highlighted dates with hover tooltip
  - Monthly view: Red background with holiday name badge

---

## Version 1.1.0 (January 8, 2026)

### New Views
- **2-Month View**: Compact 8-week view with color-only event bars
  - Employee rows with drag handle for visual organization
  - Starts from Monday of current week
  - Event type color legend at bottom
  - Weekend columns shaded for visibility

### Employee Management
- **Team Management Modal**: Password-protected admin interface (password: `crad2026`)
  - Add new employees with name, title, and color
  - Edit existing employee details
  - Delete employees (with confirmation)
  - Drag-and-drop reordering of employee list
- **Employees in Firestore**: Employee data now synced to cloud
  - Real-time sync across all users
  - Custom sort order persisted
- **Cyber Robotics**: Added as new team member (Partner)

### Filter Improvements
- **Multi-Select Employee Filter**: Checkbox-based filtering
  - Select All / Clear All buttons
  - Toggle individual employees on/off
  - Color-coded chips with employee colors
  - Visual feedback for selected/unselected state

### Other Improvements
- **Notes on Events**: Notes now display directly on calendar events
- **Improved Tooltips**: Full event details on hover including notes

---

## Version 1.0.0 (January 7, 2026)

### Core Features
- **Multi-day Events**: Events with start and end dates that span across days
- **Three Calendar Views**: Week, Bi-Weekly, and Monthly views
- **Employee Management**: Four employees (Mike, Jordan, Febin, Peter) with color coding
- **Event Types**: Install, PM, Service Visit, Software Upgrade, De Install, Acceptance Test, Remote Service, Site Visit, No Travel, Vacation, First Line, Custom
- **Products**: Catalyst +, Catalyst Classic, Sentinel, VCLP, c4D Server, cAutoVerify
- **Custom Event Types**: Ability to add custom event type with free-text input

### Visual Features
- **Spanning Event Bars**: Events display as horizontal bars spanning their duration (like Google Calendar)
- **Event Color Coding**: Different colors for each event type
- **PM + Software Upgrade Combo**: Special cyan color when both are selected
- **Tentative Events**: Grey/dashed styling for tentative events
- **Employee Color Dots**: Color-coded dots in monthly view to identify employees
- **Auto-scaling Events**: Events scale height when multiple overlap on same day
- **Expand/Collapse**: Monthly view allows expanding days with many events

### UI/Branding
- **C-rad Logo**: Company logo in header with optimized sizing
- **Custom Background**: #00384E branded background color
- **98% Width Layout**: Expanded layout to maximize screen usage
- **Responsive Design**: Works on desktop and mobile
- **Week Starts Monday**: All views start week on Monday

### Event Details
- **Event Popup**: Click any event to see full details (employee, types, products, customer, location, notes, dates)
- **Notes Display**: Notes shown on calendar events and in tooltips
- **Edit Events**: Edit any event directly from the popup
- **Delete Events**: Delete events with confirmation

### Reminders
- **Time Card Reminder**: Recurring every 2 weeks starting Jan 5, 2026 (Mondays)
- **Payday Reminder**: Recurring every 2 weeks starting Jan 9, 2026 (Fridays)

### Multi-User & Cloud
- **Firebase Firestore**: Real-time cloud database for event storage
- **Real-time Sync**: All users see updates instantly when events are added/edited/deleted
- **Multi-device Support**: Access calendar from any device with same data

### Deployment
- **GitHub Repository**: Source code hosted on GitHub
- **GitHub Pages**: Live site deployed automatically via GitHub Actions
- **URL**: https://michael-rathgeb.github.io/crad-field-service-calendar/

---

## Pending / Future
- [ ] Update Firebase security rules before test mode expires (~Feb 7, 2026)
- [ ] User authentication (if needed)
- [ ] Export calendar data feature
- [ ] Email notifications (optional)
