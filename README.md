# C-rad Field Service Calendar

A clean, simple calendar webapp for managing field service schedules for the C-rad team.

## Features

- **Weekly calendar view** with all 4 field service engineers
- **Event management** with 9 different event types
- **Product tracking** for 5 different products per event
- **Customer & location** details
- **Field notes** for each event
- **Filtering** by employee and event type
- **Mobile responsive** design
- **Local storage** for data persistence

## Team Members

- Mike (Field Service Engineer)
- Jordan (Senior Field Service Engineer)
- Febin (Field Service Engineer)
- Peter (Field Service Manager)

## Event Types

- Install
- PM
- Service Visit
- Software Upgrade
- De Install
- Acceptance Test
- Remote Service
- Travel
- First Line

## Products

- Catalyst +
- Sentinel
- VCLP
- c4D Server
- cAutoVerify

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone or download this project
2. Install dependencies:

```bash
npm install
```

### Running the App

Start the development server:

```bash
npm run dev
```

Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Usage

### Adding an Event

1. Click the "Add Event" button
2. Select an employee
3. Choose a date
4. Select event type
5. Check any relevant products
6. Enter customer name and location
7. Add any notes
8. Click "Add Event"

### Viewing Events

- Events appear in the weekly calendar grid
- Each event shows the type, customer, location, and products
- Desktop view shows all employees side-by-side
- Mobile view shows employees in a stacked layout

### Filtering

1. Click "Filters" button
2. Filter by employee and/or event type
3. Calendar updates in real-time

### Deleting Events

- Click on any event card
- Confirm deletion in the popup

### Navigation

- Use "Previous" and "Next" buttons to move between weeks
- Click "Today" to jump to the current week

## Data Storage

Events are stored in your browser's local storage. Data persists between sessions but is specific to each browser/device.

## Customization

The calendar can be easily customized:

- Edit employee list in `src/crad-calendar.jsx` (EMPLOYEES array)
- Modify event types (EVENT_TYPES array)
- Add/remove products (PRODUCTS array)
- Adjust colors by modifying the `getEventTypeColor` function
- Connect to a backend API by replacing localStorage calls

## Next Steps

Consider adding:
- Backend API integration
- User authentication
- PDF/CSV export
- Email notifications
- Time slots for events
- Drag-and-drop rescheduling

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Lucide Icons

## Support

For questions or issues, contact the development team.
