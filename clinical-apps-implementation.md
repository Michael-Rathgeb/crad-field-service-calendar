# C-rad Calendar Platform — Clinical Apps Implementation Plan

## Overview

This document outlines the step-by-step plan to expand the existing C-rad Field Service Calendar into a multi-department, multi-region platform. The immediate goal is adding Clinical Applications support alongside Field Service for the Americas region. The architecture must support future expansion to EU, Asia, Australia, and any other regions — each with their own Field Service and Clinical teams.

**Current State:** Single-purpose React/Vite calendar app deployed on GitHub Pages with Firebase (Firestore) backend. All configuration (event types, products, colors, holidays, reminders) is hardcoded in `src/crad-calendar.jsx`.

**Target State:** A single codebase deployed via Vercel to multiple subdomains (e.g., `fs-americas.cradcalendar.com`, `clinical-americas.cradcalendar.com`), each serving a specific region+department combo via environment variables, with shared Firebase backend and cross-department visibility.

---

## Architecture Decisions

### Single Firebase Project
- ONE Firestore database for all regions and departments
- Cross-calendar visibility is just a query filter change — no cross-project auth needed
- Cost-efficient and simple to manage

### Single Codebase, Multiple Deployments via Vercel
- One GitHub repo with the calendar source code
- Each region+department combo is a separate Vercel project pointing to the same repo
- Deployments differ ONLY by environment variables: `VITE_REGION` and `VITE_DEPARTMENT`
- Each deployment gets its own subdomain on a custom domain (e.g., `fs-americas.cradcalendar.com`)
- Bug fixes and UI improvements automatically deploy to ALL instances on push to master
- No separate repos, no GitHub Actions deploy matrix — Vercel handles everything

### Config-Driven UI
- Event types, colors, holidays, reminders, and labels are pulled from config (Firebase or local files)
- The rendering logic is generic — it doesn't care what the event types ARE, just that they exist
- Adding a new department or region means adding config, not changing code

---

## Firestore Structure

### Current Structure
```
/employees/{employeeId}
  - id: string
  - name: string
  - title: string
  - color: string (tailwind class like "bg-blue-500")
  - sortOrder: number

/events/{eventId}
  - id: number (timestamp)
  - employee: string (employee id)
  - eventTypes: string[]
  - customEventType: string
  - products: string[]
  - customer: string
  - location: string
  - notes: string
  - startDate: string (YYYY-MM-DD)
  - endDate: string (YYYY-MM-DD)
  - tentative: boolean
```

### New Structure
```
/employees/{employeeId}
  - id: string
  - name: string
  - title: string
  - color: string
  - sortOrder: number
  - region: string          ← NEW (e.g., "americas", "eu", "asia", "australia")
  - department: string      ← NEW (e.g., "field_service", "clinical")

/events/{eventId}
  - id: number
  - employee: string
  - eventTypes: string[]
  - customEventType: string
  - products: string[]
  - customer: string
  - location: string
  - notes: string
  - startDate: string
  - endDate: string
  - tentative: boolean
  - region: string          ← NEW
  - department: string      ← NEW

/config/departments/{departmentId}
  - label: string (e.g., "Field Service", "Clinical Applications")
  - eventTypes: string[] (e.g., ["Install", "PM", "Service Visit", ...])
  - eventTypeColors: map (e.g., { "Install": { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-800" } })
  - comboColors: map (e.g., { "PM+Software Upgrade": { bg: "bg-cyan-100", ... } })
  - products: string[]

/config/regions/{regionId}
  - label: string (e.g., "Americas", "Europe")
  - holidays: array of { month: number, day: number, label: string }
  - reminders: array of { id: string, label: string, startDate: string, intervalDays: number, color: string }
  - adminPassword: string
```

### Why This Structure
- **Department config** holds event types and products — these are the same whether you're clinical in the US or clinical in the EU
- **Region config** holds holidays and reminders — these differ by geography, not by department
- **Employee and event documents** have both region AND department fields for precise filtering
- **Adding a new region** = add one document to `/config/regions/` and start adding employees/events with that region tag
- **Adding a new department** = add one document to `/config/departments/` and start adding employees/events with that department tag

---

## Implementation Steps

### Phase 1: Config Extraction (No functionality changes)

**Goal:** Move all hardcoded constants out of `crad-calendar.jsx` and into config files, without changing any behavior. The app should work exactly as it does today after this step.

#### Step 1.1: Create local config files

Create a config directory structure:

```
src/
  config/
    departments/
      field_service.js
      clinical.js
    regions/
      americas.js
    index.js          ← exports the active config based on env vars
```

**`src/config/departments/field_service.js`** — Extract from current code:
```javascript
export default {
  id: 'field_service',
  label: 'Field Service',
  eventTypes: [
    'Install', 'PM', 'Service Visit', 'Software Upgrade', 'De Install',
    'Acceptance Test', 'Remote Service', 'Site Visit', 'No Travel',
    'Vacation', 'First Line', 'Custom'
  ],
  eventTypeColors: {
    'Install': { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800' },
    'PM': { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800' },
    'Service Visit': { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800' },
    'Software Upgrade': { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800' },
    'De Install': { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800' },
    'Acceptance Test': { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-800' },
    'Remote Service': { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-800' },
    'Site Visit': { bg: 'bg-lime-100', border: 'border-lime-300', text: 'text-lime-800' },
    'No Travel': { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-800' },
    'Vacation': { bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-800' },
    'First Line': { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800' },
    'Custom': { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800' }
  },
  comboColors: {
    'PM+Software Upgrade': { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800' }
  },
  products: ['Catalyst +', 'Catalyst Classic', 'Sentinel', 'VCLP', 'c4D Server', 'cAutoVerify']
};
```

**`src/config/departments/clinical.js`** — New config (populate with actual clinical event types when known):
```javascript
export default {
  id: 'clinical',
  label: 'Clinical Applications',
  eventTypes: [
    'Training', 'Go-Live Support', 'Remote Support', 'Demo',
    'Site Assessment', 'Follow-Up', 'Vacation', 'Custom'
    // ← UPDATE THESE with actual clinical event types from the clinical team
  ],
  eventTypeColors: {
    'Training': { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800' },
    'Go-Live Support': { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800' },
    'Remote Support': { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-800' },
    'Demo': { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800' },
    'Site Assessment': { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800' },
    'Follow-Up': { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-800' },
    'Vacation': { bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-800' },
    'Custom': { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800' }
    // ← UPDATE THESE to match actual clinical event types
  },
  comboColors: {},
  products: ['Catalyst +', 'Catalyst Classic', 'Sentinel', 'VCLP', 'c4D Server', 'cAutoVerify']
};
```

**`src/config/regions/americas.js`** — Extract from current code:
```javascript
export default {
  id: 'americas',
  label: 'Americas',
  holidays: [
    { month: 1, day: 1, label: "New Year's Day" },
    { month: 2, day: 16, label: "President's Day" },
    { month: 5, day: 25, label: 'Memorial Day' },
    { month: 7, day: 3, label: 'Independence Day' },
    { month: 9, day: 7, label: 'Labor Day' },
    { month: 11, day: 26, label: 'Thanksgiving' },
    { month: 11, day: 27, label: 'Thanksgiving' },
    { month: 12, day: 25, label: 'Christmas Day' }
  ],
  reminders: [
    { id: 'timecard', label: 'Time Card', startDate: '2026-01-05', intervalDays: 14, color: 'bg-amber-500' },
    { id: 'payday', label: 'Payday', startDate: '2026-01-09', intervalDays: 14, color: 'bg-emerald-500' }
  ],
  adminPassword: 'crad2026'
};
```

**`src/config/index.js`** — Central config loader:
```javascript
// Department configs
import fieldService from './departments/field_service';
import clinical from './departments/clinical';

// Region configs
import americas from './regions/americas';

const departments = { field_service: fieldService, clinical: clinical };
const regions = { americas: americas };

// Read from environment variables (set at build time)
const activeDepartment = import.meta.env.VITE_DEPARTMENT || 'field_service';
const activeRegion = import.meta.env.VITE_REGION || 'americas';

export const departmentConfig = departments[activeDepartment];
export const regionConfig = regions[activeRegion];
export const allDepartments = departments;
export const allRegions = regions;

// Convenience exports
export const DEPARTMENT = activeDepartment;
export const REGION = activeRegion;
```

#### Step 1.2: Update `crad-calendar.jsx` to use config

Replace all hardcoded constants with imports from config:

```javascript
import { departmentConfig, regionConfig, DEPARTMENT, REGION } from './config';

// REPLACE these hardcoded constants:
// const EVENT_TYPES = [...] → departmentConfig.eventTypes
// const PRODUCTS = [...] → departmentConfig.products
// const REMINDERS = [...] → regionConfig.reminders
// const HOLIDAYS = [...] → regionConfig.holidays
// const ADMIN_PASSWORD = '...' → regionConfig.adminPassword
```

**Specific changes needed in `crad-calendar.jsx`:**

1. **Remove** the top-level `EVENT_TYPES`, `PRODUCTS`, `REMINDERS`, `HOLIDAYS`, and `ADMIN_PASSWORD` constants

2. **Replace** every reference to `EVENT_TYPES` with `departmentConfig.eventTypes`

3. **Replace** every reference to `PRODUCTS` with `departmentConfig.products`

4. **Replace** every reference to `REMINDERS` with `regionConfig.reminders`

5. **Replace** every reference to `HOLIDAYS` with `regionConfig.holidays`

6. **Replace** the `ADMIN_PASSWORD` reference with `regionConfig.adminPassword`

7. **Refactor `getEventTypeColor()`** to use `departmentConfig.eventTypeColors` and `departmentConfig.comboColors` instead of the hardcoded color map:
   ```javascript
   const getEventTypeColor = (eventTypes, tentative = false) => {
     if (tentative) return 'bg-gray-200 border-gray-400 text-gray-600 border-dashed';
     const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];

     // Check combo colors first
     const sortedKey = [...types].sort().join('+');
     const combo = departmentConfig.comboColors[sortedKey];
     if (combo) return `${combo.bg} ${combo.border} ${combo.text}`;

     // Use first event type color
     const firstType = types[0];
     const color = departmentConfig.eventTypeColors[firstType];
     if (color) return `${color.bg} ${color.border} ${color.text}`;

     return 'bg-gray-100 border-gray-300 text-gray-800';
   };
   ```

8. **Make the 2-month view legend dynamic** — replace the hardcoded legend HTML with a map over `departmentConfig.eventTypes`:
   ```javascript
   {/* Event Type Legend — generated from config */}
   <div className="bg-gray-50 border-t p-3">
     <div className="flex flex-wrap gap-3 justify-center">
       {departmentConfig.eventTypes.map(type => {
         const color = departmentConfig.eventTypeColors[type];
         if (!color) return null;
         return (
           <div key={type} className="flex items-center gap-1.5">
             <div className={`w-4 h-4 rounded ${color.bg} border ${color.border}`} />
             <span className="text-xs text-gray-700">{type}</span>
           </div>
         );
       })}
       {/* Combo colors */}
       {Object.entries(departmentConfig.comboColors).map(([key, color]) => (
         <div key={key} className="flex items-center gap-1.5">
           <div className={`w-4 h-4 rounded ${color.bg} border ${color.border}`} />
           <span className="text-xs text-gray-700">{key.replace(/\+/g, ' + ')}</span>
         </div>
       ))}
       {/* Tentative */}
       <div className="flex items-center gap-1.5">
         <div className="w-4 h-4 rounded bg-gray-200 border border-gray-400 border-dashed" />
         <span className="text-xs text-gray-700">Tentative</span>
       </div>
     </div>
   </div>
   ```

9. **Update the page title/header** to show the department and region:
   ```javascript
   // In the header area, add a subtitle or modify the title:
   <span className="text-sm text-gray-500">{regionConfig.label} — {departmentConfig.label}</span>
   ```

#### Step 1.3: Add environment variables

Create `.env` files for **local development only** — production env vars will be set in the Vercel dashboard per-project.

**`.env`** (default — used in local development):
```
VITE_REGION=americas
VITE_DEPARTMENT=field_service
```

**`.env.clinical`** (for testing clinical locally):
```
VITE_REGION=americas
VITE_DEPARTMENT=clinical
```

To run locally as clinical: `npx vite --mode clinical`

Update `vite.config.js` if needed to support the env mode. Note: in production (Vercel), the env vars are set per-project in the Vercel dashboard, not via files.

#### Step 1.4: Verify

- Run the app with default env vars — should look and behave exactly like it does today
- Run with `VITE_DEPARTMENT=clinical` — should show clinical event types, labels, etc.
- All existing events and employees should still display correctly

---

### Phase 2: Firebase Data Migration

**Goal:** Add `region` and `department` fields to all existing employees and events in Firestore, and update the app to filter by them.

#### Step 2.1: Write a one-time migration script

Create a script (can be run from the Firebase console or a local Node.js script) that:
1. Reads all documents in `/employees`
2. Adds `region: "americas"` and `department: "field_service"` to each
3. Reads all documents in `/events`
4. Adds `region: "americas"` and `department: "field_service"` to each

This is safe because all existing data IS Americas Field Service.

```javascript
// Example migration script (run once)
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

async function migrateData(db) {
  // Migrate employees
  const empSnapshot = await getDocs(collection(db, 'employees'));
  for (const empDoc of empSnapshot.docs) {
    await updateDoc(doc(db, 'employees', empDoc.id), {
      region: 'americas',
      department: 'field_service'
    });
  }

  // Migrate events
  const eventSnapshot = await getDocs(collection(db, 'events'));
  for (const eventDoc of eventSnapshot.docs) {
    await updateDoc(doc(db, 'events', eventDoc.id), {
      region: 'americas',
      department: 'field_service'
    });
  }

  console.log('Migration complete');
}
```

#### Step 2.2: Update Firestore queries to filter by region + department

In `crad-calendar.jsx`, update the real-time listeners:

**Employees listener** — change from:
```javascript
onSnapshot(collection(db, 'employees'), ...)
```
To:
```javascript
import { query, where } from 'firebase/firestore';

const employeesQuery = query(
  collection(db, 'employees'),
  where('region', '==', REGION),
  where('department', '==', DEPARTMENT)
);
onSnapshot(employeesQuery, ...)
```

**Events listener** — change from:
```javascript
onSnapshot(collection(db, 'events'), ...)
```
To:
```javascript
const eventsQuery = query(
  collection(db, 'events'),
  where('region', '==', REGION),
  where('department', '==', DEPARTMENT)
);
onSnapshot(eventsQuery, ...)
```

#### Step 2.3: Update event/employee creation to include region + department

When saving new events, include the region and department:
```javascript
const eventWithId = {
  ...newEvent,
  id: Date.now(),
  region: REGION,
  department: DEPARTMENT
};
```

Same for new employees:
```javascript
const employeeData = {
  id: employeeId,
  name: newEmployee.name.trim(),
  title: newEmployee.title.trim(),
  color: newEmployee.color,
  region: REGION,
  department: DEPARTMENT
};
```

#### Step 2.4: Create Firestore indexes

You'll need composite indexes for the filtered queries. Firebase will usually prompt you with a link to create these when you first run a query that needs one. The indexes needed:

- `employees`: composite index on `region` (asc) + `department` (asc)
- `events`: composite index on `region` (asc) + `department` (asc)

#### Step 2.5: Update Firestore security rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Employees — anyone can read, write requires valid data
    match /employees/{employeeId} {
      allow read: if true;
      allow write: if request.resource.data.keys().hasAll(['region', 'department', 'name']);
    }

    // Events — anyone can read, write requires valid data
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.resource.data.keys().hasAll(['region', 'department', 'employee']);
    }

    // Config — read only
    match /config/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

Note: These are permissive rules suitable for an internal company tool. If this ever becomes public-facing, add proper auth.

#### Step 2.6: (Optional) Seed department config in Firebase

If you want to eventually manage event types from Firebase instead of code files, add config documents:

```
/config/departments/field_service → { eventTypes: [...], products: [...], ... }
/config/departments/clinical → { eventTypes: [...], products: [...], ... }
/config/regions/americas → { holidays: [...], reminders: [...], ... }
```

For now, the local config files are fine. Firebase config becomes useful when non-developers need to modify event types without redeploying.

---

### Phase 3: Cross-Department Toggle

**Goal:** Allow users to peek at the other department's calendar data from their home view.

#### Step 3.1: Add toggle state

In `crad-calendar.jsx`, add state for the cross-department view:

```javascript
const [crossViewDepartment, setCrossViewDepartment] = useState(null); // null = off, 'clinical' or 'field_service' = viewing
const [crossViewEvents, setCrossViewEvents] = useState([]);
const [crossViewEmployees, setCrossViewEmployees] = useState([]);
```

#### Step 3.2: Add cross-department Firestore listener

When the toggle is active, subscribe to the other department's data:

```javascript
useEffect(() => {
  if (!crossViewDepartment) {
    setCrossViewEvents([]);
    setCrossViewEmployees([]);
    return;
  }

  // Listen to other department's employees
  const empQuery = query(
    collection(db, 'employees'),
    where('region', '==', REGION),
    where('department', '==', crossViewDepartment)
  );

  const unsubEmployees = onSnapshot(empQuery, (snapshot) => {
    const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    loaded.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    setCrossViewEmployees(loaded);
  });

  // Listen to other department's events
  const evtQuery = query(
    collection(db, 'events'),
    where('region', '==', REGION),
    where('department', '==', crossViewDepartment)
  );

  const unsubEvents = onSnapshot(evtQuery, (snapshot) => {
    setCrossViewEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });

  return () => {
    unsubEmployees();
    unsubEvents();
  };
}, [crossViewDepartment]);
```

#### Step 3.3: Add toggle UI

Add a toggle button in the header area, near the existing filter/add buttons:

```javascript
// Determine the "other" department
const otherDepartment = DEPARTMENT === 'field_service' ? 'clinical' : 'field_service';
const otherDepartmentLabel = allDepartments[otherDepartment]?.label || otherDepartment;

// Toggle button
<button
  onClick={() => setCrossViewDepartment(prev => prev ? null : otherDepartment)}
  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
    crossViewDepartment
      ? 'bg-amber-100 text-amber-800 border border-amber-300'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  }`}
>
  {crossViewDepartment ? `Viewing: ${otherDepartmentLabel}` : `Show ${otherDepartmentLabel}`}
</button>
```

#### Step 3.4: Render cross-department events

When `crossViewDepartment` is active, merge the cross-view data into the display. Cross-department events should be visually distinct:

- Render with **reduced opacity** (e.g., `opacity-50`)
- Add a **department badge** or **border indicator**
- Make them **read-only** (clicking shows detail but no edit/delete buttons)
- Show them **below** the home department's events in each employee row, OR in a separate section

The simplest approach: when toggle is on, append `crossViewEmployees` to the `filteredEmployees` list, but mark them as `isCrossView: true` so the rendering can style them differently.

#### Step 3.5: Future enhancement — Region toggle

For later (not needed now), add a second dropdown that allows selecting a different region. Same pattern: subscribe to that region+department combo and render the data with visual distinction.

---

### Phase 4: Vercel Deployment with Custom Domain

**Goal:** Deploy each region+department combo as a separate Vercel project with its own subdomain on a custom domain (e.g., `cradcalendar.com`).

#### Step 4.1: Purchase domain

Buy `cradcalendar.com` (or similar) from any registrar (Namecheap, Google Domains, Cloudflare, etc.). Cost is typically $10-15/year.

#### Step 4.2: Create Vercel account and connect GitHub

1. Sign up at vercel.com (free tier is sufficient)
2. Connect your GitHub account
3. This gives Vercel access to your repos for auto-deployment

#### Step 4.3: Create the first Vercel project (Field Service Americas)

1. In Vercel dashboard → "Add New Project"
2. Select your `crad-field-service-calendar` repo
3. Framework preset: Vite
4. Set environment variables:
   ```
   VITE_REGION=americas
   VITE_DEPARTMENT=field_service
   ```
5. Deploy — Vercel will build and give you a `.vercel.app` URL
6. In project settings → Domains → Add `fs-americas.cradcalendar.com`

#### Step 4.4: Create the second Vercel project (Clinical Americas)

1. In Vercel dashboard → "Add New Project"
2. Select the **same** `crad-field-service-calendar` repo again
3. Vercel will ask you to name this project differently (e.g., `crad-clinical-americas`)
4. Framework preset: Vite
5. Set environment variables:
   ```
   VITE_REGION=americas
   VITE_DEPARTMENT=clinical
   ```
6. Deploy
7. In project settings → Domains → Add `clinical-americas.cradcalendar.com`

#### Step 4.5: Configure DNS

In your domain registrar, add DNS records pointing to Vercel. Vercel will give you the exact records to add when you assign custom domains. Typically:

```
# For each subdomain, add a CNAME record:
fs-americas.cradcalendar.com      → cname.vercel-dns.com
clinical-americas.cradcalendar.com → cname.vercel-dns.com

# Optionally, point the root domain to a landing page or redirect:
cradcalendar.com                   → cname.vercel-dns.com
```

Vercel handles SSL certificates automatically — all subdomains get HTTPS for free.

#### Step 4.6: Update `vite.config.js`

Since Vercel deploys each project at the root of its subdomain, simplify the base path:

```javascript
export default defineConfig({
  base: '/',
  // ... rest of config
});
```

No more dynamic `VITE_BASE_PATH` — each subdomain serves from root. This is cleaner than the GitHub Pages approach where every deployment was under a subpath.

#### Step 4.7: How auto-deployment works

After initial setup, the workflow is:

1. You push code to `master` on your single GitHub repo
2. Vercel automatically detects the push
3. Vercel builds ALL projects that point to that repo — each with its own env vars
4. All deployments update simultaneously
5. Vercel provides preview deployments for pull requests automatically

You never touch deployment config again unless you're adding a new region/department combo.

#### Step 4.8: Adding future regions

To add EU Field Service, for example:

1. Create region config file `src/config/regions/eu.js` with EU holidays, etc.
2. Push to master
3. In Vercel → "Add New Project" → same repo
4. Set env vars: `VITE_REGION=eu`, `VITE_DEPARTMENT=field_service`
5. Assign domain: `fs-eu.cradcalendar.com`
6. Add DNS record for the new subdomain
7. Done — no code changes needed beyond the region config file

Full subdomain structure as the platform scales:

```
fs-americas.cradcalendar.com
clinical-americas.cradcalendar.com
fs-eu.cradcalendar.com
clinical-eu.cradcalendar.com
fs-asia.cradcalendar.com
clinical-asia.cradcalendar.com
fs-australia.cradcalendar.com
clinical-australia.cradcalendar.com
```

#### Step 4.9: Vercel free tier limits

Vercel's free (Hobby) plan includes:
- Unlimited projects
- Automatic deployments from GitHub
- Free SSL
- Preview deployments on PRs
- 100GB bandwidth/month (more than enough for an internal tool)

If C-rad wants to put this on a company Vercel account later, the Pro plan ($20/month) adds team collaboration and higher limits. But the free tier will work fine for getting started.

#### Step 4.10: Remove GitHub Pages configuration

Once Vercel is set up and working:
1. Delete the `.github/workflows/deploy.yml` file (if it exists)
2. In your GitHub repo settings → Pages → disable GitHub Pages
3. Update the repo README to reflect the new Vercel deployment URLs

---

### Phase 5: Optional Future Enhancements

These are NOT needed for the initial implementation but are documented for future reference.

#### 5.1: Firebase-driven config
Move department and region configs from local files to Firestore `/config` collection. This allows non-developers to modify event types, holidays, etc. from the Firebase console without redeploying.

#### 5.2: Region toggle
Add a second toggle that allows viewing other regions' data (e.g., Americas Field Service peeking at EU Field Service).

#### 5.3: Authentication
Add Firebase Auth if the tool goes public-facing. Currently it's internal-only with a simple admin password.

#### 5.4: Role-based permissions
Use Firebase Auth custom claims to restrict write access by region+department while allowing cross-department read access.

#### 5.5: Shared "all-hands" events
Events with `region: "all"` or `department: "all"` that appear on every calendar (e.g., company-wide holidays, global meetings).

---

## File Change Summary

### New Files to Create
```
src/config/
  index.js                          ← Config loader with env var logic
  departments/
    field_service.js                ← Event types, colors, products for FS
    clinical.js                     ← Event types, colors, products for Clinical
  regions/
    americas.js                     ← Holidays, reminders for Americas
.env                                ← Default env vars (americas + field_service)
.env.clinical                       ← Clinical env vars (for local dev only)
scripts/migrate-firestore.js        ← One-time migration script
```

### Files to Modify
```
src/crad-calendar.jsx               ← Main refactor: replace hardcoded constants with config imports,
                                       add region/department to queries and saves,
                                       add cross-department toggle,
                                       make legend dynamic
src/firebase.js                     ← No changes needed (same Firebase project)
vite.config.js                      ← Simplify base path to '/' for Vercel
```

### Files to Remove (after Vercel migration)
```
.github/workflows/deploy.yml        ← No longer needed, Vercel handles deployment
```

### Firestore Changes
```
/employees/* → add region + department fields to all existing docs
/events/* → add region + department fields to all existing docs
/config/departments/field_service → (optional) seed config
/config/departments/clinical → (optional) seed config
/config/regions/americas → (optional) seed config
Create composite indexes for region+department queries
```

---

## Implementation Order for Claude Code

When implementing with Claude Code, follow this exact order:

1. **Create the config files first** (Phase 1, Steps 1.1)
2. **Refactor crad-calendar.jsx** to import from config (Phase 1, Steps 1.2)
3. **Add .env files** (Phase 1, Step 1.3)
4. **Test** — everything should work identically to before
5. **Write and run the migration script** (Phase 2, Step 2.1)
6. **Update Firestore queries** with region/department filters (Phase 2, Step 2.2)
7. **Update event/employee creation** to include region/department (Phase 2, Step 2.3)
8. **Create Firestore indexes** (Phase 2, Step 2.4)
9. **Test** — still works, but now queries are scoped
10. **Add cross-department toggle** state and listeners (Phase 3, Steps 3.1-3.2)
11. **Add toggle UI** and render cross-view events (Phase 3, Steps 3.3-3.4)
12. **Test** — toggle shows other department's data
13. **Purchase domain** (e.g., cradcalendar.com)
14. **Set up Vercel** — create account, connect GitHub, create first project for FS Americas (Phase 4, Steps 4.2-4.3)
15. **Create second Vercel project** for Clinical Americas (Phase 4, Step 4.4)
16. **Configure DNS** — point subdomains to Vercel (Phase 4, Step 4.5)
17. **Simplify vite.config.js** — set base to '/' (Phase 4, Step 4.6)
18. **Disable GitHub Pages** — remove old deployment workflow (Phase 4, Step 4.10)

Each step should be a separate commit for easy rollback.

---

## Key Gotchas to Watch For

1. **DEFAULT_EMPLOYEES fallback** — The current code initializes Firestore with default employees if the collection is empty. After the migration, this logic needs to also include `region` and `department` fields. But ideally, remove this fallback entirely since employees are managed in Firebase now.

2. **The `filterEmployees` state** — Currently initialized from `DEFAULT_EMPLOYEES.map(e => e.id)`. This needs to initialize from the loaded (filtered) employees instead.

3. **Event type filter dropdown** — Currently uses the hardcoded `EVENT_TYPES` array. Must use `departmentConfig.eventTypes`.

4. **Admin password** — Currently hardcoded. Move to `regionConfig.adminPassword`.

5. **Firestore composite indexes** — The region+department queries WILL fail until you create the composite indexes. Firebase will give you a direct link to create them when you first hit the error.

6. **Cross-department event colors** — When viewing clinical events from the field service view, the event type colors need to come from the CLINICAL config, not the field service config. Import `allDepartments` and look up the right color map based on the event's department.
