# CRAD Field Service Calendar - Changelog

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
