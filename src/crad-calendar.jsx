import React, { useState, useEffect } from 'react';
import { Plus, X, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const EMPLOYEES = [
  { id: 'mike', name: 'Mike', title: 'Field Service Engineer', color: 'bg-blue-500' },
  { id: 'jordan', name: 'Jordan', title: 'Senior Field Service Engineer', color: 'bg-green-500' },
  { id: 'febin', name: 'Febin', title: 'Field Service Engineer', color: 'bg-purple-500' },
  { id: 'peter', name: 'Peter', title: 'Field Service Manager', color: 'bg-orange-500' }
];

const EVENT_TYPES = [
  'Install',
  'PM',
  'Service Visit',
  'Software Upgrade',
  'De Install',
  'Acceptance Test',
  'Remote Service',
  'Site Visit',
  'No Travel',
  'Vacation',
  'First Line',
  'Custom'
];

const PRODUCTS = [
  'Catalyst +',
  'Catalyst Classic',
  'Sentinel',
  'VCLP',
  'c4D Server',
  'cAutoVerify'
];

// Recurring reminders - startDate is the first occurrence, intervalDays is how often it repeats
const REMINDERS = [
  { id: 'timecard', label: 'Time Card', startDate: '2026-01-05', intervalDays: 14, color: 'bg-amber-500' },
  { id: 'payday', label: 'Payday', startDate: '2026-01-09', intervalDays: 14, color: 'bg-emerald-500' }
];

const FieldServiceCalendar = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterEventType, setFilterEventType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [viewMode, setViewMode] = useState('week'); // 'week', 'biweekly', 'monthly'
  const [expandedCells, setExpandedCells] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);

  const [newEvent, setNewEvent] = useState({
    employee: '',
    eventTypes: [],
    customEventType: '',
    products: [],
    customer: '',
    location: '',
    notes: '',
    startDate: '',
    endDate: '',
    tentative: false
  });

  // Load events from localStorage with migration
  useEffect(() => {
    const saved = localStorage.getItem('crad-events');
    if (saved) {
      const parsedEvents = JSON.parse(saved);
      // Migrate old events
      const migratedEvents = parsedEvents.map(event => {
        let migrated = { ...event };
        // Migrate single 'date' field to startDate/endDate
        if (event.date && !event.startDate) {
          migrated.startDate = event.date;
          migrated.endDate = event.date;
          delete migrated.date;
        }
        // Migrate single 'eventType' to 'eventTypes' array
        if (event.eventType && !event.eventTypes) {
          migrated.eventTypes = [event.eventType];
          delete migrated.eventType;
        }
        return migrated;
      });
      setEvents(migratedEvents);
    }
    setIsInitialized(true);
  }, []);

  // Save events to localStorage (only after initial load)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('crad-events', JSON.stringify(events));
    }
  }, [events, isInitialized]);

  // Date utility functions
  const formatDate = (date) => {
    // Use local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Get reminders that fall on a specific date
  const getRemindersForDate = (date) => {
    const dateStr = formatDate(date);
    const targetDate = parseDate(dateStr);

    return REMINDERS.filter(reminder => {
      const startDate = parseDate(reminder.startDate);
      const diffTime = targetDate.getTime() - startDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Check if this date falls on the reminder schedule (on or after start, and divisible by interval)
      return diffDays >= 0 && diffDays % reminder.intervalDays === 0;
    });
  };

  const getWeekDates = (date) => {
    const curr = new Date(date);
    const week = [];
    // Start on Monday (day 1). If current day is Sunday (0), go back 6 days
    const dayOfWeek = curr.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    curr.setDate(curr.getDate() + diff);

    for (let i = 0; i < 7; i++) {
      week.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return week;
  };

  const getBiWeeklyDates = (date) => {
    const curr = new Date(date);
    const dates = [];
    // Start on Monday (day 1). If current day is Sunday (0), go back 6 days
    const dayOfWeek = curr.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    curr.setDate(curr.getDate() + diff);

    for (let i = 0; i < 14; i++) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const getMonthDates = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from Monday of the week containing the first day
    const startDate = new Date(firstDay);
    const startDayOfWeek = startDate.getDay();
    const startDiff = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek;
    startDate.setDate(startDate.getDate() + startDiff);

    // End on Sunday of the week containing the last day
    const endDate = new Date(lastDay);
    const endDayOfWeek = endDate.getDay();
    const endDiff = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
    endDate.setDate(endDate.getDate() + endDiff);

    const dates = [];
    const curr = new Date(startDate);
    while (curr <= endDate) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const getDisplayDates = () => {
    switch (viewMode) {
      case 'biweekly':
        return getBiWeeklyDates(selectedDate);
      case 'monthly':
        return getMonthDates(selectedDate);
      default:
        return getWeekDates(selectedDate);
    }
  };

  const displayDates = getDisplayDates();

  // Filter employees based on selected filter
  const filteredEmployees = filterEmployee === 'all'
    ? EMPLOYEES
    : EMPLOYEES.filter(emp => emp.id === filterEmployee);

  // Check if an event spans a specific date
  const eventSpansDate = (event, date) => {
    const dateStr = formatDate(date);
    return event.startDate <= dateStr && event.endDate >= dateStr;
  };

  // Get events for a specific date (for monthly view)
  const getEventsForDate = (date) => {
    return events.filter(event =>
      eventSpansDate(event, date) &&
      (filterEmployee === 'all' || event.employee === filterEmployee) &&
      (filterEventType === 'all' || (event.eventTypes && event.eventTypes.includes(filterEventType)))
    );
  };

  // Get events for a specific employee that appear in the visible date range
  const getEventsForEmployee = (employeeId) => {
    const startDateStr = formatDate(displayDates[0]);
    const endDateStr = formatDate(displayDates[displayDates.length - 1]);

    return events.filter(event =>
      event.employee === employeeId &&
      event.startDate <= endDateStr &&
      event.endDate >= startDateStr &&
      (filterEventType === 'all' || (event.eventTypes && event.eventTypes.includes(filterEventType)))
    );
  };

  // Get display label for event (Event Types + Customer)
  const getEventLabel = (event) => {
    const types = event.eventTypes?.map(t =>
      t === 'Custom' && event.customEventType ? event.customEventType : t
    ).join(', ') || '';
    return event.customer ? `${types} ${event.customer}` : types;
  };

  // Get short label for compact display
  const getEventShortLabel = (event) => {
    const types = event.eventTypes?.map(t =>
      t === 'Custom' && event.customEventType ? event.customEventType : t
    ).join('/') || '';
    return event.customer ? `${types} - ${event.customer}` : types;
  };

  // Calculate event span info for rendering
  const getEventSpanInfo = (event, dates) => {
    const dateStrings = dates.map(d => formatDate(d));
    const startIdx = dateStrings.findIndex(d => d >= event.startDate);
    const endIdx = dateStrings.findLastIndex(d => d <= event.endDate);

    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
      // Event is outside visible range or invalid
      const firstVisibleIdx = dateStrings.findIndex(d => d >= event.startDate && d <= event.endDate);
      if (firstVisibleIdx === -1) return null;

      const lastVisibleIdx = dateStrings.findLastIndex(d => d >= event.startDate && d <= event.endDate);
      return {
        startCol: firstVisibleIdx,
        spanLength: lastVisibleIdx - firstVisibleIdx + 1,
        isStart: event.startDate >= dateStrings[0],
        isEnd: event.endDate <= dateStrings[dateStrings.length - 1]
      };
    }

    return {
      startCol: Math.max(0, startIdx),
      spanLength: endIdx - Math.max(0, startIdx) + 1,
      isStart: event.startDate >= dateStrings[0],
      isEnd: event.endDate <= dateStrings[dateStrings.length - 1]
    };
  };

  const handleSaveEvent = () => {
    if (!newEvent.employee || newEvent.eventTypes.length === 0 || !newEvent.startDate || !newEvent.endDate) {
      alert('Please fill in Employee, at least one Event Type, Start Date, and End Date');
      return;
    }

    if (newEvent.eventTypes.includes('Custom') && !newEvent.customEventType.trim()) {
      alert('Please enter a custom event type description');
      return;
    }

    if (newEvent.endDate < newEvent.startDate) {
      alert('End Date must be on or after Start Date');
      return;
    }

    if (editingEventId) {
      // Update existing event
      setEvents(events.map(e => e.id === editingEventId ? { ...newEvent, id: editingEventId } : e));
    } else {
      // Add new event
      setEvents([...events, { ...newEvent, id: Date.now() }]);
    }

    setShowModal(false);
    setEditingEventId(null);
    setNewEvent({
      employee: '',
      eventTypes: [],
      customEventType: '',
      products: [],
      customer: '',
      location: '',
      notes: '',
      startDate: '',
      endDate: '',
      tentative: false
    });
  };

  const handleEditEvent = (event) => {
    setNewEvent({
      employee: event.employee,
      eventTypes: event.eventTypes || [],
      customEventType: event.customEventType || '',
      products: event.products || [],
      customer: event.customer || '',
      location: event.location || '',
      notes: event.notes || '',
      startDate: event.startDate,
      endDate: event.endDate,
      tentative: event.tentative || false
    });
    setEditingEventId(event.id);
    setSelectedEvent(null);
    setShowModal(true);
  };

  const handleDeleteEvent = (eventId) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const toggleProduct = (product) => {
    setNewEvent(prev => ({
      ...prev,
      products: prev.products.includes(product)
        ? prev.products.filter(p => p !== product)
        : [...prev.products, product]
    }));
  };

  const toggleEventType = (eventType) => {
    setNewEvent(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(eventType)
        ? prev.eventTypes.filter(t => t !== eventType)
        : [...prev.eventTypes, eventType]
    }));
  };

  const handleStartDateChange = (value) => {
    setNewEvent(prev => ({
      ...prev,
      startDate: value,
      endDate: prev.endDate && prev.endDate < value ? value : prev.endDate
    }));
  };

  const navigate = (direction) => {
    const newDate = new Date(selectedDate);
    switch (viewMode) {
      case 'biweekly':
        newDate.setDate(newDate.getDate() + (direction * 14));
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
      default:
        newDate.setDate(newDate.getDate() + (direction * 7));
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getEventTypeColor = (eventTypes, tentative = false) => {
    // If tentative, return grey color
    if (tentative) {
      return 'bg-gray-200 border-gray-400 text-gray-600 border-dashed';
    }

    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];

    // Check for specific combinations first
    const hasPM = types.includes('PM');
    const hasSoftwareUpgrade = types.includes('Software Upgrade');

    if (hasPM && hasSoftwareUpgrade) {
      return 'bg-cyan-100 border-cyan-300 text-cyan-800'; // PM + Software Upgrade combo
    }

    const colors = {
      'Install': 'bg-blue-100 border-blue-300 text-blue-800',
      'PM': 'bg-green-100 border-green-300 text-green-800',
      'Service Visit': 'bg-yellow-100 border-yellow-300 text-yellow-800',
      'Software Upgrade': 'bg-purple-100 border-purple-300 text-purple-800',
      'De Install': 'bg-red-100 border-red-300 text-red-800',
      'Acceptance Test': 'bg-indigo-100 border-indigo-300 text-indigo-800',
      'Remote Service': 'bg-teal-100 border-teal-300 text-teal-800',
      'Site Visit': 'bg-lime-100 border-lime-300 text-lime-800',
      'No Travel': 'bg-slate-100 border-slate-300 text-slate-800',
      'Vacation': 'bg-sky-100 border-sky-300 text-sky-800',
      'First Line': 'bg-orange-100 border-orange-300 text-orange-800',
      'Custom': 'bg-pink-100 border-pink-300 text-pink-800'
    };
    // Use first event type for color, or default if none
    const firstType = types[0];
    return colors[firstType] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const getEmployeeColor = (employeeId) => {
    const employee = EMPLOYEES.find(e => e.id === employeeId);
    return employee?.color || 'bg-gray-500';
  };

  const getNavigationLabel = () => {
    if (viewMode === 'monthly') {
      return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    const start = displayDates[0];
    const end = displayDates[displayDates.length - 1];
    if (start.getMonth() === end.getMonth()) {
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return `${start.toLocaleDateString('en-US', { month: 'short' })} - ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  };

  // Render Week/Bi-Weekly View with spanning bars
  const renderWeekBiWeeklyView = () => {
    const colCount = displayDates.length;
    const fixedRowHeight = 140; // Fixed row height in pixels
    const rowPadding = 8; // Total padding (top + bottom)

    return (
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-max">
          {/* Header */}
          <div className="flex bg-gray-50 border-b">
            <div className="w-40 flex-shrink-0 px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r">
              Employee
            </div>
            {displayDates.map((date, idx) => {
              const reminders = getRemindersForDate(date);
              return (
                <div
                  key={idx}
                  className="flex-1 min-w-[100px] px-2 py-2 text-center text-sm font-semibold text-gray-700 border-r"
                >
                  <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className={`text-lg ${formatDate(date) === formatDate(new Date()) ? 'text-blue-600 font-bold' : ''}`}>
                    {date.getDate()}
                  </div>
                  {reminders.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-1">
                      {reminders.map(r => (
                        <span key={r.id} className={`text-[10px] px-1.5 py-0.5 rounded text-white ${r.color}`}>
                          {r.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Employee Rows */}
          {filteredEmployees.map((employee) => {
            const employeeEvents = getEventsForEmployee(employee.id);

            // Calculate row index for each event based on overlaps
            // and find max overlaps for height calculation
            const eventsWithSpanInfo = employeeEvents.map(event => ({
              ...event,
              spanInfo: getEventSpanInfo(event, displayDates)
            })).filter(e => e.spanInfo);

            // Sort by start column
            eventsWithSpanInfo.sort((a, b) => a.spanInfo.startCol - b.spanInfo.startCol);

            // Assign row indices based on column overlap
            const rowOccupancy = []; // Track which columns are used by which row
            eventsWithSpanInfo.forEach(event => {
              const { startCol, spanLength } = event.spanInfo;
              const endCol = startCol + spanLength - 1;

              // Find the first row where this event fits
              let assignedRow = 0;
              for (let row = 0; row < rowOccupancy.length; row++) {
                const occupied = rowOccupancy[row];
                let canFit = true;
                for (let col = startCol; col <= endCol; col++) {
                  if (occupied.includes(col)) {
                    canFit = false;
                    break;
                  }
                }
                if (canFit) {
                  assignedRow = row;
                  break;
                } else if (row === rowOccupancy.length - 1) {
                  assignedRow = row + 1;
                }
              }

              // Ensure row exists
              if (!rowOccupancy[assignedRow]) {
                rowOccupancy[assignedRow] = [];
              }

              // Mark columns as occupied
              for (let col = startCol; col <= endCol; col++) {
                rowOccupancy[assignedRow].push(col);
              }

              event.rowIndex = assignedRow;
            });

            const maxRows = Math.max(rowOccupancy.length, 2); // Minimum 2 rows so single events take half

            // Calculate event height based on max overlapping rows
            const availableHeight = fixedRowHeight - rowPadding;
            const gap = 4;
            const totalGaps = maxRows > 1 ? (maxRows - 1) * gap : 0;
            const eventHeight = Math.floor((availableHeight - totalGaps) / maxRows);

            return (
              <div key={employee.id} className="flex border-b hover:bg-gray-50">
                <div className="w-40 flex-shrink-0 px-4 py-3 border-r bg-gray-50">
                  <div className="font-semibold text-gray-900">{employee.name}</div>
                  <div className="text-xs text-gray-600">{employee.title}</div>
                </div>
                <div className="flex-1 relative" style={{ height: `${fixedRowHeight}px` }}>
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {displayDates.map((_, idx) => (
                      <div key={idx} className="flex-1 min-w-[100px] border-r" />
                    ))}
                  </div>

                  {/* Events */}
                  <div className="relative p-1 h-full">
                    {eventsWithSpanInfo.map((event) => {
                      const { spanInfo, rowIndex } = event;
                      const leftPercent = (spanInfo.startCol / colCount) * 100;
                      const widthPercent = (spanInfo.spanLength / colCount) * 100;
                      const topPosition = rowIndex * (eventHeight + gap) + 4;

                      return (
                        <div
                          key={event.id}
                          className={`absolute p-1 border cursor-pointer hover:shadow-lg transition-shadow overflow-hidden ${getEventTypeColor(event.eventTypes, event.tentative)}`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            top: `${topPosition}px`,
                            height: `${eventHeight}px`,
                            borderRadius: `${spanInfo.isStart ? '6px' : '0'} ${spanInfo.isEnd ? '6px' : '0'} ${spanInfo.isEnd ? '6px' : '0'} ${spanInfo.isStart ? '6px' : '0'}`
                          }}
                          onClick={() => setSelectedEvent(event)}
                          title={`${getEventLabel(event)}${event.location ? ` @ ${event.location}` : ''}`}
                        >
                          <div className="text-xs font-semibold truncate">{getEventShortLabel(event)}</div>
                          {eventHeight > 45 && event.location && <div className="text-xs text-gray-600 truncate">{event.location}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Monthly View - Traditional Calendar Grid
  const toggleCellExpand = (cellKey) => {
    setExpandedCells(prev => ({
      ...prev,
      [cellKey]: !prev[cellKey]
    }));
  };

  const renderMonthlyView = () => {
    const weeks = [];
    for (let i = 0; i < displayDates.length; i += 7) {
      weeks.push(displayDates.slice(i, i + 7));
    }

    const currentMonth = selectedDate.getMonth();

    // Get events that span within a week and calculate their positions
    const getWeekEvents = (week) => {
      const weekStart = formatDate(week[0]);
      const weekEnd = formatDate(week[6]);

      // Get all events that appear in this week
      const weekEvents = events.filter(event =>
        event.startDate <= weekEnd &&
        event.endDate >= weekStart &&
        (filterEmployee === 'all' || event.employee === filterEmployee) &&
        (filterEventType === 'all' || (event.eventTypes && event.eventTypes.includes(filterEventType)))
      );

      const processedEvents = weekEvents.map(event => {
        const eventStart = event.startDate;
        const eventEnd = event.endDate;

        // Find start column (0-6) within this week
        let startCol = 0;
        for (let i = 0; i < 7; i++) {
          if (formatDate(week[i]) >= eventStart) {
            startCol = i;
            break;
          }
          if (i === 6) startCol = 0; // Event starts before this week
        }
        if (eventStart < weekStart) startCol = 0;

        // Find end column (0-6) within this week
        let endCol = 6;
        for (let i = 6; i >= 0; i--) {
          if (formatDate(week[i]) <= eventEnd) {
            endCol = i;
            break;
          }
        }
        if (eventEnd > weekEnd) endCol = 6;

        return {
          ...event,
          startCol,
          endCol,
          span: endCol - startCol + 1,
          startsThisWeek: eventStart >= weekStart,
          endsThisWeek: eventEnd <= weekEnd
        };
      });

      // Assign row indices to prevent visual overlap
      // Sort by startCol first, then by span (longer events first)
      processedEvents.sort((a, b) => a.startCol - b.startCol || b.span - a.span);

      // Track which columns are occupied by which row
      const rowOccupancy = []; // Array of arrays, each inner array tracks occupied columns for that row

      processedEvents.forEach(event => {
        // Find the first row where this event can fit
        let assignedRow = 0;
        for (let row = 0; row < rowOccupancy.length; row++) {
          const occupied = rowOccupancy[row];
          let canFit = true;
          for (let col = event.startCol; col <= event.endCol; col++) {
            if (occupied.includes(col)) {
              canFit = false;
              break;
            }
          }
          if (canFit) {
            assignedRow = row;
            break;
          } else if (row === rowOccupancy.length - 1) {
            assignedRow = row + 1;
          }
        }

        // Ensure row exists
        if (!rowOccupancy[assignedRow]) {
          rowOccupancy[assignedRow] = [];
        }

        // Mark columns as occupied
        for (let col = event.startCol; col <= event.endCol; col++) {
          rowOccupancy[assignedRow].push(col);
        }

        event.rowIndex = assignedRow;
      });

      return processedEvents;
    };

    return (
      <div className="hidden md:block">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="px-3 py-4 text-center text-base font-semibold text-gray-700 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {weeks.map((week, weekIdx) => {
          const weekEvents = getWeekEvents(week);

          return (
            <div key={weekIdx} className="border-b last:border-b-0">
              {/* Date row */}
              <div className="grid grid-cols-7">
                {week.map((date, dayIdx) => {
                  const isCurrentMonth = date.getMonth() === currentMonth;
                  const isToday = formatDate(date) === formatDate(new Date());
                  const reminders = getRemindersForDate(date);

                  return (
                    <div
                      key={dayIdx}
                      className={`px-3 py-2 border-r last:border-r-0 ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-base font-medium ${isToday ? 'text-blue-600 font-bold' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                          {date.getDate()}
                        </span>
                        {reminders.length > 0 && (
                          <div className="flex gap-1">
                            {reminders.map(r => (
                              <span key={r.id} className={`text-[9px] px-1 py-0.5 rounded text-white ${r.color}`}>
                                {r.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Events row */}
              {(() => {
                const maxRow = Math.max(0, ...weekEvents.map(e => e.rowIndex || 0));
                const eventRowHeight = 32; // Height per event row
                const totalHeight = Math.max(120, (maxRow + 1) * eventRowHeight + 12);
                const cellKey = `week-${weekIdx}`;
                const isExpanded = expandedCells[cellKey];
                const visibleRows = isExpanded ? maxRow + 1 : 2;
                const hiddenCount = maxRow + 1 - 2;

                return (
                  <div className="relative" style={{ height: isExpanded ? `${totalHeight}px` : '90px', overflow: 'hidden' }}>
                    {/* Background grid */}
                    <div className="absolute inset-0 grid grid-cols-7">
                      {week.map((date, dayIdx) => {
                        const isCurrentMonth = date.getMonth() === currentMonth;
                        return (
                          <div
                            key={dayIdx}
                            className={`border-r last:border-r-0 ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}`}
                          />
                        );
                      })}
                    </div>

                    {/* Events */}
                    {weekEvents.map(event => {
                      const rowIndex = event.rowIndex || 0;
                      if (!isExpanded && rowIndex >= 2) return null;

                      const leftPercent = (event.startCol / 7) * 100;
                      const widthPercent = (event.span / 7) * 100;
                      const topPosition = rowIndex * eventRowHeight + 4;

                      return (
                        <div
                          key={event.id}
                          className={`absolute text-sm p-1.5 border cursor-pointer hover:shadow-md transition ${getEventTypeColor(event.eventTypes, event.tentative)}`}
                          style={{
                            left: `calc(${leftPercent}% + 4px)`,
                            width: `calc(${widthPercent}% - 8px)`,
                            top: `${topPosition}px`,
                            height: `${eventRowHeight - 4}px`,
                            borderRadius: `${event.startsThisWeek ? '4px' : '0'} ${event.endsThisWeek ? '4px' : '0'} ${event.endsThisWeek ? '4px' : '0'} ${event.startsThisWeek ? '4px' : '0'}`,
                            zIndex: 10
                          }}
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="flex items-center gap-1.5 h-full">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getEmployeeColor(event.employee)}`} />
                            <span className="truncate font-medium">{getEventShortLabel(event)}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Show more/less button */}
                    {!isExpanded && hiddenCount > 0 && (
                      <button
                        onClick={() => toggleCellExpand(cellKey)}
                        className="absolute bottom-1 left-2 text-xs text-blue-600 hover:text-blue-800 font-medium bg-white px-1 rounded z-20"
                      >
                        +{hiddenCount} more
                      </button>
                    )}
                    {isExpanded && maxRow >= 2 && (
                      <button
                        onClick={() => toggleCellExpand(cellKey)}
                        className="absolute bottom-1 left-2 text-xs text-blue-600 hover:text-blue-800 font-medium bg-white px-1 rounded z-20"
                      >
                        Show less
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}

        {/* Employee Legend */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex flex-wrap gap-4">
            {EMPLOYEES.map(emp => (
              <div key={emp.id} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${emp.color}`} />
                <span className="text-sm text-gray-700">{emp.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Mobile View
  const renderMobileView = () => (
    <div className="md:hidden">
      {viewMode === 'monthly' ? (
        // Mobile Monthly - simplified list view
        <div>
          {displayDates.filter(date => date.getMonth() === selectedDate.getMonth()).map((date, idx) => {
            const dayEvents = getEventsForDate(date);
            if (dayEvents.length === 0) return null;

            return (
              <div key={idx} className="border-b">
                <div className="bg-gray-50 px-4 py-2 font-semibold text-sm text-gray-700">
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="p-2 space-y-2">
                  {dayEvents.map(event => {
                    const employee = EMPLOYEES.find(e => e.id === event.employee);
                    return (
                      <div
                        key={event.id}
                        className={`p-3 rounded border ${getEventTypeColor(event.eventTypes, event.tentative)}`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${getEmployeeColor(event.employee)}`} />
                          <span className="text-sm font-medium">{employee?.name}</span>
                        </div>
                        <div className="font-semibold">{getEventLabel(event)}</div>
                        {event.location && <div className="text-sm text-gray-600">{event.location}</div>}
                        {event.startDate !== event.endDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            {event.startDate} to {event.endDate}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Mobile Week/Bi-Weekly - by employee
        filteredEmployees.map((employee) => {
          const employeeEvents = getEventsForEmployee(employee.id);

          return (
            <div key={employee.id} className="border-b last:border-b-0">
              <div className="bg-gray-50 px-4 py-3 font-semibold text-gray-900">
                {employee.name}
                <div className="text-xs text-gray-600 font-normal">{employee.title}</div>
              </div>
              {employeeEvents.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No events</div>
              ) : (
                <div className="p-2 space-y-2">
                  {employeeEvents.map(event => (
                    <div
                      key={event.id}
                      className={`p-3 rounded border ${getEventTypeColor(event.eventTypes, event.tentative)}`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="font-semibold">{getEventLabel(event)}</div>
                      {event.location && <div className="text-sm text-gray-600">{event.location}</div>}
                      <div className="text-xs text-gray-500 mt-1">
                        {event.startDate === event.endDate
                          ? parseDate(event.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                          : `${parseDate(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${parseDate(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        }
                      </div>
                      {event.products.length > 0 && (
                        <div className="text-xs text-gray-600 mt-1">{event.products.join(', ')}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="min-h-screen p-2 md:p-4" style={{ backgroundColor: '#00384E' }}>
      {/* Header */}
      <div className="max-w-[98%] mx-auto mb-2">
        <div className="bg-white rounded-lg shadow-sm p-1 md:p-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
            <div className="flex items-center">
              <img src="/c_rad.png" alt="C-rad Logo" className="h-32 w-auto -my-10" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                {['week', 'biweekly', 'monthly'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-2 text-sm font-medium transition ${
                      viewMode === mode
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {mode === 'biweekly' ? '2 Week' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={() => {
                  setEditingEventId(null);
                  setNewEvent({
                    employee: '',
                    eventTypes: [],
                    customEventType: '',
                    products: [],
                    customer: '',
                    location: '',
                    notes: '',
                    startDate: '',
                    endDate: '',
                    tentative: false
                  });
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Add Event
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Employee</label>
                <select
                  value={filterEmployee}
                  onChange={(e) => setFilterEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Employees</option>
                  {EMPLOYEES.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Event Type</label>
                <select
                  value={filterEventType}
                  onChange={(e) => setFilterEventType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Event Types</option>
                  {EVENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-[98%] mx-auto mb-4">
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition"
            >
              Today
            </button>
            <span className="font-semibold text-gray-900">
              {getNavigationLabel()}
            </span>
          </div>
          <button
            onClick={() => navigate(1)}
            className="flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="max-w-[98%] mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {viewMode === 'monthly' ? renderMonthlyView() : renderWeekBiWeeklyView()}
          {renderMobileView()}
        </div>
      </div>

      {/* Add/Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{editingEventId ? 'Edit Event' : 'Add New Event'}</h2>
                <button
                  onClick={() => { setShowModal(false); setEditingEventId(null); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Employee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee *
                  </label>
                  <select
                    value={newEvent.employee}
                    onChange={(e) => setNewEvent({...newEvent, employee: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {EMPLOYEES.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={newEvent.startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={newEvent.endDate}
                      min={newEvent.startDate}
                      onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Tentative */}
                <div className="flex items-center">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEvent.tentative}
                      onChange={(e) => setNewEvent({...newEvent, tentative: e.target.checked})}
                      className="w-5 h-5 text-gray-600 rounded focus:ring-2 focus:ring-gray-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Tentative (not confirmed)</span>
                  </label>
                </div>

                {/* Event Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type(s) *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {EVENT_TYPES.map(type => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newEvent.eventTypes.includes(type)}
                          onChange={() => toggleEventType(type)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                  {newEvent.eventTypes.includes('Custom') && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={newEvent.customEventType}
                        onChange={(e) => setNewEvent({...newEvent, customEventType: e.target.value})}
                        placeholder="Enter custom event type..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* Products */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Products
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRODUCTS.map(product => (
                      <label key={product} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newEvent.products.includes(product)}
                          onChange={() => toggleProduct(product)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{product}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Customer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={newEvent.customer}
                    onChange={(e) => setNewEvent({...newEvent, customer: e.target.value})}
                    placeholder="Enter customer name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    placeholder="Enter location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newEvent.notes}
                    onChange={(e) => setNewEvent({...newEvent, notes: e.target.value})}
                    placeholder="Add any notes or special instructions"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSaveEvent}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                >
                  {editingEventId ? 'Save Changes' : 'Add Event'}
                </button>
                <button
                  onClick={() => { setShowModal(false); setEditingEventId(null); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Popup */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className={`p-4 rounded-t-lg ${getEventTypeColor(selectedEvent.eventTypes, selectedEvent.tentative)}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{selectedEvent.eventTypes?.map(t => t === 'Custom' && selectedEvent.customEventType ? selectedEvent.customEventType : t).join(', ')}</h3>
                    {selectedEvent.tentative && (
                      <span className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded">Tentative</span>
                    )}
                  </div>
                  {selectedEvent.customer && (
                    <p className="text-sm font-medium mt-1">{selectedEvent.customer}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Employee */}
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${getEmployeeColor(selectedEvent.employee)}`} />
                <span className="font-medium">
                  {EMPLOYEES.find(e => e.id === selectedEvent.employee)?.name}
                </span>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {selectedEvent.startDate === selectedEvent.endDate
                    ? parseDate(selectedEvent.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                    : `${parseDate(selectedEvent.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${parseDate(selectedEvent.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  }
                </span>
              </div>

              {/* Location */}
              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {/* Products */}
              {selectedEvent.products && selectedEvent.products.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <span>{selectedEvent.products.join(', ')}</span>
                </div>
              )}

              {/* Notes */}
              {selectedEvent.notes && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-700 mb-1">Notes:</p>
                  <p>{selectedEvent.notes}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex gap-2">
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${getEventLabel(selectedEvent)}" event?`)) {
                    handleDeleteEvent(selectedEvent.id);
                    setSelectedEvent(null);
                  }
                }}
                className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 rounded-lg transition"
              >
                Delete
              </button>
              <button
                onClick={() => handleEditEvent(selectedEvent)}
                className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 rounded-lg transition"
              >
                Edit
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldServiceCalendar;
