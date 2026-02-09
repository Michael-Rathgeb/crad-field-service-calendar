import React, { useState, useEffect } from 'react';
import { Plus, X, Filter, ChevronLeft, ChevronRight, Settings, Trash2, GripVertical } from 'lucide-react';
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { departmentConfig, regionConfig, allDepartments, DEPARTMENT, REGION } from './config';

// Available colors for employees
const EMPLOYEE_COLORS = [
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Rose', value: 'bg-rose-500' },
  { name: 'Teal', value: 'bg-teal-500' },
  { name: 'Indigo', value: 'bg-indigo-500' },
  { name: 'Amber', value: 'bg-amber-500' },
  { name: 'Cyan', value: 'bg-cyan-500' },
  { name: 'Lime', value: 'bg-lime-500' }
];

const FieldServiceCalendar = () => {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterEmployees, setFilterEmployees] = useState([]); // Array of selected employee IDs (loaded from Firestore)
  const [filterEventType, setFilterEventType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [employeesInitialized, setEmployeesInitialized] = useState(false);
  const [viewMode, setViewMode] = useState('week'); // 'week', 'biweekly', 'monthly', '2month'
  const [expandedCells, setExpandedCells] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);

  // Employee management state
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', title: '', color: 'bg-blue-500' });
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [draggedEmployee, setDraggedEmployee] = useState(null);

  // Cross-department view state
  const [crossViewEnabled, setCrossViewEnabled] = useState(false);
  const [crossViewEvents, setCrossViewEvents] = useState([]);
  const [crossViewEmployees, setCrossViewEmployees] = useState([]);

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

  // Load events from Firestore with real-time updates (filtered by region+department)
  useEffect(() => {
    const eventsQuery = query(
      collection(db, 'events'),
      where('region', '==', REGION),
      where('department', '==', DEPARTMENT)
    );

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const loadedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(loadedEvents);
      setIsInitialized(true);
    }, (error) => {
      console.error('Error loading events:', error);
      setIsInitialized(true);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Save event to Firestore
  const saveEventToFirestore = async (event) => {
    try {
      await setDoc(doc(db, 'events', String(event.id)), event);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  // Delete event from Firestore
  const deleteEventFromFirestore = async (eventId) => {
    try {
      await deleteDoc(doc(db, 'events', String(eventId)));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Load employees from Firestore with real-time updates (filtered by region+department)
  useEffect(() => {
    const employeesQuery = query(
      collection(db, 'employees'),
      where('region', '==', REGION),
      where('department', '==', DEPARTMENT)
    );

    const unsubscribe = onSnapshot(employeesQuery, (snapshot) => {
      if (snapshot.empty) {
        // No employees for this region+department yet
        setEmployees([]);
        setFilterEmployees([]);
      } else {
        const loadedEmployees = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort by sortOrder, fallback to name if no sortOrder
        loadedEmployees.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
        setEmployees(loadedEmployees);
        // Update filter to include all employees if not initialized
        if (!employeesInitialized) {
          setFilterEmployees(loadedEmployees.map(e => e.id));
        }
      }
      setEmployeesInitialized(true);
    }, (error) => {
      console.error('Error loading employees:', error);
      setEmployeesInitialized(true);
    });

    return () => unsubscribe();
  }, [employeesInitialized]);

  // Cross-department data listener
  const otherDepartment = DEPARTMENT === 'field_service' ? 'clinical' : 'field_service';
  const otherDepartmentConfig = allDepartments[otherDepartment];

  useEffect(() => {
    if (!crossViewEnabled) {
      setCrossViewEvents([]);
      setCrossViewEmployees([]);
      return;
    }

    // Listen to other department's employees
    const empQuery = query(
      collection(db, 'employees'),
      where('region', '==', REGION),
      where('department', '==', otherDepartment)
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
      where('department', '==', otherDepartment)
    );

    const unsubEvents = onSnapshot(evtQuery, (snapshot) => {
      setCrossViewEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubEmployees();
      unsubEvents();
    };
  }, [crossViewEnabled]);

  // Save employee to Firestore
  const saveEmployeeToFirestore = async (employee) => {
    try {
      await setDoc(doc(db, 'employees', employee.id), employee);
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  // Delete employee from Firestore
  const deleteEmployeeFromFirestore = async (employeeId) => {
    try {
      await deleteDoc(doc(db, 'employees', employeeId));
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  // Password verification
  const handlePasswordSubmit = () => {
    if (passwordInput === regionConfig.adminPassword) {
      setIsAdmin(true);
      setShowPasswordPrompt(false);
      setShowEmployeeModal(true);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
    }
  };

  // Handle add/edit employee
  const handleSaveEmployee = () => {
    if (!newEmployee.name.trim()) {
      alert('Please enter an employee name');
      return;
    }

    const employeeId = editingEmployeeId || newEmployee.name.toLowerCase().replace(/\s+/g, '-');
    const employeeData = {
      id: employeeId,
      name: newEmployee.name.trim(),
      title: newEmployee.title.trim(),
      color: newEmployee.color,
      region: REGION,
      department: DEPARTMENT
    };

    saveEmployeeToFirestore(employeeData);

    // Add to filter if new employee
    if (!editingEmployeeId) {
      setFilterEmployees(prev => [...prev, employeeId]);
    }

    setNewEmployee({ name: '', title: '', color: 'bg-blue-500' });
    setEditingEmployeeId(null);
  };

  // Handle edit employee
  const handleEditEmployee = (employee) => {
    setNewEmployee({
      name: employee.name,
      title: employee.title,
      color: employee.color
    });
    setEditingEmployeeId(employee.id);
  };

  // Handle delete employee
  const handleDeleteEmployee = (employeeId) => {
    if (confirm('Are you sure you want to delete this employee? Their events will remain but show as unassigned.')) {
      deleteEmployeeFromFirestore(employeeId);
      setFilterEmployees(prev => prev.filter(id => id !== employeeId));
    }
  };

  // Drag and drop handlers for employee reordering
  const handleDragStart = (e, employee) => {
    setDraggedEmployee(employee);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetEmployee) => {
    e.preventDefault();
    if (!draggedEmployee || draggedEmployee.id === targetEmployee.id) return;
  };

  const handleDrop = (e, targetEmployee) => {
    e.preventDefault();
    if (!draggedEmployee || draggedEmployee.id === targetEmployee.id) return;

    const draggedIndex = employees.findIndex(emp => emp.id === draggedEmployee.id);
    const targetIndex = employees.findIndex(emp => emp.id === targetEmployee.id);

    // Reorder the array
    const newEmployees = [...employees];
    newEmployees.splice(draggedIndex, 1);
    newEmployees.splice(targetIndex, 0, draggedEmployee);

    // Update sortOrder for all employees and save to Firestore
    newEmployees.forEach((emp, index) => {
      const updatedEmployee = { ...emp, sortOrder: index };
      saveEmployeeToFirestore(updatedEmployee);
    });

    setDraggedEmployee(null);
  };

  const handleDragEnd = () => {
    setDraggedEmployee(null);
  };

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

    return regionConfig.reminders.filter(reminder => {
      const startDate = parseDate(reminder.startDate);
      const diffTime = targetDate.getTime() - startDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Check if this date falls on the reminder schedule (on or after start, and divisible by interval)
      return diffDays >= 0 && diffDays % reminder.intervalDays === 0;
    });
  };

  // Get holiday for a specific date (if any)
  const getHolidayForDate = (date) => {
    const month = date.getMonth() + 1; // getMonth() is 0-indexed
    const day = date.getDate();
    return regionConfig.holidays.find(h => h.month === month && h.day === day);
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

  const getTwoMonthDates = (date) => {
    // Start from Monday of the current week
    const startDate = new Date(date);
    const startDayOfWeek = startDate.getDay();
    const startDiff = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek;
    startDate.setDate(startDate.getDate() + startDiff);

    // End 8 weeks (56 days) later on Sunday - approximately 2 months
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 55); // 8 weeks - 1 day = 55 days to get to Sunday

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
      case '2month':
        return getTwoMonthDates(selectedDate);
      default:
        return getWeekDates(selectedDate);
    }
  };

  const displayDates = getDisplayDates();

  // Filter employees based on selected filters
  const filteredEmployees = employees.filter(emp => filterEmployees.includes(emp.id));

  // Combined employees including cross-view (marked with isCrossView flag)
  const allDisplayEmployees = crossViewEnabled
    ? [
        ...filteredEmployees,
        ...crossViewEmployees.map(emp => ({ ...emp, isCrossView: true }))
      ]
    : filteredEmployees;

  // Toggle employee filter
  const toggleEmployeeFilter = (empId) => {
    setFilterEmployees(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  // Select all / deselect all employees
  const selectAllEmployees = () => setFilterEmployees(employees.map(e => e.id));
  const deselectAllEmployees = () => setFilterEmployees([]);

  // Check if an event spans a specific date
  const eventSpansDate = (event, date) => {
    const dateStr = formatDate(date);
    return event.startDate <= dateStr && event.endDate >= dateStr;
  };

  // Get events for a specific date (for monthly view)
  const getEventsForDate = (date) => {
    return events.filter(event =>
      eventSpansDate(event, date) &&
      filterEmployees.includes(event.employee) &&
      (filterEventType === 'all' || (event.eventTypes && event.eventTypes.includes(filterEventType)))
    );
  };

  // Get events for a specific employee that appear in the visible date range
  const getEventsForEmployee = (employeeId, isCrossView = false) => {
    const startDateStr = formatDate(displayDates[0]);
    const endDateStr = formatDate(displayDates[displayDates.length - 1]);
    const eventSource = isCrossView ? crossViewEvents : events;

    return eventSource.filter(event =>
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
      // Update existing event (preserve region/department)
      const updatedEvent = { ...newEvent, id: editingEventId, region: REGION, department: DEPARTMENT };
      saveEventToFirestore(updatedEvent);
    } else {
      // Add new event with region and department
      const eventWithId = { ...newEvent, id: Date.now(), region: REGION, department: DEPARTMENT };
      saveEventToFirestore(eventWithId);
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
    deleteEventFromFirestore(eventId);
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

    // Check combo colors first (sorted key for consistent lookup)
    const sortedKey = [...types].sort().join('+');
    const combo = departmentConfig.comboColors[sortedKey];
    if (combo) {
      return `${combo.bg} ${combo.border} ${combo.text}`;
    }

    // Use first event type color, or default if none
    const firstType = types[0];
    const color = departmentConfig.eventTypeColors[firstType];
    if (color) {
      return `${color.bg} ${color.border} ${color.text}`;
    }

    return 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const getEmployeeColor = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
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
              const holiday = getHolidayForDate(date);
              return (
                <div
                  key={idx}
                  className={`flex-1 min-w-[100px] px-2 py-2 text-center text-sm font-semibold border-r ${holiday ? 'bg-red-50' : ''}`}
                >
                  <div className={holiday ? 'text-red-700' : 'text-gray-700'}>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className={`text-lg ${formatDate(date) === formatDate(new Date()) ? 'text-blue-600 font-bold' : holiday ? 'text-red-700' : ''}`}>
                    {date.getDate()}
                  </div>
                  {holiday && (
                    <div className="text-[10px] px-1.5 py-0.5 rounded bg-red-500 text-white mt-1 inline-block">
                      {holiday.label}
                    </div>
                  )}
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
          {allDisplayEmployees.map((employee) => {
            const employeeEvents = getEventsForEmployee(employee.id, employee.isCrossView);

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
              <div key={`${employee.id}-${employee.isCrossView ? 'cross' : 'home'}`} className={`flex border-b hover:bg-gray-50 ${employee.isCrossView ? 'opacity-60' : ''}`}>
                <div className={`w-40 flex-shrink-0 px-4 py-3 border-r ${employee.isCrossView ? 'bg-amber-50' : 'bg-gray-50'}`}>
                  <div className="font-semibold text-gray-900">
                    {employee.name}
                    {employee.isCrossView && <span className="ml-1 text-xs text-amber-600">({otherDepartmentConfig?.label})</span>}
                  </div>
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
                          title={`${getEventLabel(event)}${event.location ? ` @ ${event.location}` : ''}${event.notes ? ` - ${event.notes}` : ''}`}
                        >
                          <div className="text-xs font-semibold truncate">{getEventShortLabel(event)}</div>
                          {eventHeight > 45 && event.location && <div className="text-xs text-gray-600 truncate">{event.location}</div>}
                          {eventHeight > 60 && event.notes && <div className="text-xs text-gray-500 truncate italic">{event.notes}</div>}
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

  // Render 2-Month View - Compact color-only bars
  const render2MonthView = () => {
    const colCount = displayDates.length;
    const fixedRowHeight = 120; // Larger row height for better visibility
    const rowPadding = 6;

    // Get month labels for header
    const months = [];
    let currentMonth = -1;
    displayDates.forEach((date, idx) => {
      if (date.getMonth() !== currentMonth) {
        currentMonth = date.getMonth();
        months.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          startIdx: idx,
          year: date.getFullYear()
        });
      }
    });

    return (
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-max">
          {/* Month Headers */}
          <div className="flex bg-gray-100 border-b">
            <div className="w-36 flex-shrink-0 px-3 py-2 text-left text-sm font-semibold text-gray-700 border-r">
              Employee
            </div>
            <div className="flex-1 flex">
              {months.map((m, idx) => {
                const nextStart = months[idx + 1]?.startIdx || colCount;
                const span = nextStart - m.startIdx;
                const widthPercent = (span / colCount) * 100;
                return (
                  <div
                    key={idx}
                    className="text-center text-sm font-bold text-gray-700 py-2 border-r"
                    style={{ width: `${widthPercent}%` }}
                  >
                    {m.month} {m.year}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Numbers Header */}
          <div className="flex bg-gray-50 border-b">
            <div className="w-36 flex-shrink-0 px-3 py-1 border-r" />
            {displayDates.map((date, idx) => {
              const isToday = formatDate(date) === formatDate(new Date());
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const holiday = getHolidayForDate(date);
              return (
                <div
                  key={idx}
                  className={`flex-1 min-w-[28px] text-center text-[10px] py-1 border-r ${holiday ? 'bg-red-100 text-red-700 font-bold' : isWeekend ? 'bg-gray-100' : ''} ${isToday ? 'bg-blue-100 font-bold text-blue-600' : ''}`}
                  title={holiday ? holiday.label : ''}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>

          {/* Employee Rows */}
          {allDisplayEmployees.map((employee) => {
            const employeeEvents = getEventsForEmployee(employee.id, employee.isCrossView);

            const eventsWithSpanInfo = employeeEvents.map(event => ({
              ...event,
              spanInfo: getEventSpanInfo(event, displayDates)
            })).filter(e => e.spanInfo);

            eventsWithSpanInfo.sort((a, b) => a.spanInfo.startCol - b.spanInfo.startCol);

            const rowOccupancy = [];
            eventsWithSpanInfo.forEach(event => {
              const { startCol, spanLength } = event.spanInfo;
              const endCol = startCol + spanLength - 1;

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

              if (!rowOccupancy[assignedRow]) {
                rowOccupancy[assignedRow] = [];
              }

              for (let col = startCol; col <= endCol; col++) {
                rowOccupancy[assignedRow].push(col);
              }

              event.rowIndex = assignedRow;
            });

            const maxRows = Math.max(rowOccupancy.length, 2);
            const availableHeight = fixedRowHeight - rowPadding;
            const gap = 2;
            const totalGaps = maxRows > 1 ? (maxRows - 1) * gap : 0;
            const eventHeight = Math.floor((availableHeight - totalGaps) / maxRows);

            return (
              <div key={`${employee.id}-${employee.isCrossView ? 'cross' : 'home'}`} className={`flex border-b hover:bg-gray-50 ${employee.isCrossView ? 'opacity-60' : ''}`}>
                <div className={`w-36 flex-shrink-0 px-3 py-2 border-r ${employee.isCrossView ? 'bg-amber-50' : 'bg-gray-50'}`}>
                  <div className="font-semibold text-sm text-gray-900">
                    {employee.name}
                    {employee.isCrossView && <span className="ml-1 text-xs text-amber-600">({otherDepartmentConfig?.label})</span>}
                  </div>
                  <div className="text-xs text-gray-600 truncate">{employee.title}</div>
                </div>
                <div className="flex-1 relative" style={{ height: `${fixedRowHeight}px` }}>
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {displayDates.map((date, idx) => {
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      return (
                        <div key={idx} className={`flex-1 min-w-[28px] border-r ${isWeekend ? 'bg-gray-50' : ''}`} />
                      );
                    })}
                  </div>

                  {/* Events - color only, no text */}
                  <div className="relative p-0.5 h-full">
                    {eventsWithSpanInfo.map((event) => {
                      const { spanInfo, rowIndex } = event;
                      const leftPercent = (spanInfo.startCol / colCount) * 100;
                      const widthPercent = (spanInfo.spanLength / colCount) * 100;
                      const topPosition = rowIndex * (eventHeight + gap) + 2;

                      return (
                        <div
                          key={event.id}
                          className={`absolute border cursor-pointer hover:shadow-lg transition-shadow ${getEventTypeColor(event.eventTypes, event.tentative)}`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            top: `${topPosition}px`,
                            height: `${eventHeight}px`,
                            borderRadius: `${spanInfo.isStart ? '3px' : '0'} ${spanInfo.isEnd ? '3px' : '0'} ${spanInfo.isEnd ? '3px' : '0'} ${spanInfo.isStart ? '3px' : '0'}`
                          }}
                          onClick={() => setSelectedEvent(event)}
                          title={`${employee.name}: ${getEventLabel(event)}${event.location ? ` @ ${event.location}` : ''}${event.notes ? ` - ${event.notes}` : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

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
        filterEmployees.includes(event.employee) &&
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
                  const holiday = getHolidayForDate(date);

                  return (
                    <div
                      key={dayIdx}
                      className={`px-3 py-2 border-r last:border-r-0 ${holiday ? 'bg-red-50' : isCurrentMonth ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-base font-medium ${isToday ? 'text-blue-600 font-bold' : holiday ? 'text-red-700 font-bold' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                          {date.getDate()}
                        </span>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {holiday && (
                            <span className="text-[9px] px-1 py-0.5 rounded text-white bg-red-500">
                              {holiday.label}
                            </span>
                          )}
                          {reminders.map(r => (
                            <span key={r.id} className={`text-[9px] px-1 py-0.5 rounded text-white ${r.color}`}>
                              {r.label}
                            </span>
                          ))}
                        </div>
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
                          title={event.notes ? `${getEventShortLabel(event)} - ${event.notes}` : getEventShortLabel(event)}
                        >
                          <div className="flex items-center gap-1.5 h-full">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getEmployeeColor(event.employee)}`} />
                            <span className="truncate font-medium">
                              {getEventShortLabel(event)}
                              {event.notes && <span className="font-normal text-gray-600 ml-1">- {event.notes}</span>}
                            </span>
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
            {employees.map(emp => (
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
                    const employee = employees.find(e => e.id === event.employee);
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
        allDisplayEmployees.map((employee) => {
          const employeeEvents = getEventsForEmployee(employee.id, employee.isCrossView);

          return (
            <div key={`${employee.id}-${employee.isCrossView ? 'cross' : 'home'}`} className={`border-b last:border-b-0 ${employee.isCrossView ? 'opacity-60' : ''}`}>
              <div className={`px-4 py-3 font-semibold text-gray-900 ${employee.isCrossView ? 'bg-amber-50' : 'bg-gray-50'}`}>
                {employee.name}
                {employee.isCrossView && <span className="ml-1 text-xs text-amber-600">({otherDepartmentConfig?.label})</span>}
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
            <div className="flex items-center gap-4">
              <img src={import.meta.env.BASE_URL + "c_rad.png"} alt="C-rad Logo" className="h-32 w-auto -my-10" />
              <div className="hidden md:block">
                <span className="text-sm text-gray-500">{regionConfig.label} — {departmentConfig.label}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                {['week', 'biweekly', 'monthly', '2month'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-2 text-sm font-medium transition ${
                      viewMode === mode
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {mode === 'biweekly' ? '2 Week' : mode === '2month' ? '2 Month' : mode.charAt(0).toUpperCase() + mode.slice(1)}
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
                onClick={() => setCrossViewEnabled(!crossViewEnabled)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  crossViewEnabled
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {crossViewEnabled ? `Hide ${otherDepartmentConfig?.label}` : `Show ${otherDepartmentConfig?.label}`}
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
              <button
                onClick={() => {
                  if (isAdmin) {
                    setShowEmployeeModal(true);
                  } else {
                    setShowPasswordPrompt(true);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                <Settings className="w-4 h-4" />
                Manage Team
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Employee</label>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    onClick={selectAllEmployees}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllEmployees}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                  >
                    Clear All
                  </button>
                  {employees.map(emp => (
                    <label
                      key={emp.id}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition ${
                        filterEmployees.includes(emp.id)
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filterEmployees.includes(emp.id)}
                        onChange={() => toggleEmployeeFilter(emp.id)}
                        className="w-3 h-3"
                      />
                      <span className={`w-2 h-2 rounded-full ${emp.color}`} />
                      <span className="text-sm">{emp.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Event Type</label>
                <select
                  value={filterEventType}
                  onChange={(e) => setFilterEventType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Event Types</option>
                  {departmentConfig.eventTypes.map(type => (
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
          {viewMode === 'monthly' ? renderMonthlyView() : viewMode === '2month' ? render2MonthView() : renderWeekBiWeeklyView()}
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
                    {employees.map(emp => (
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
                    {departmentConfig.eventTypes.map(type => (
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
                    {departmentConfig.products.map(product => (
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
                  {employees.find(e => e.id === selectedEvent.employee)?.name}
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

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Admin Access Required</h3>
              <button
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setPasswordInput('');
                  setPasswordError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-2">{passwordError}</p>
              )}
            </div>
            <div className="p-4 border-t flex gap-2">
              <button
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setPasswordInput('');
                  setPasswordError('');
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Management Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Manage Team Members</h3>
              <button
                onClick={() => {
                  setShowEmployeeModal(false);
                  setNewEmployee({ name: '', title: '', color: 'bg-blue-500' });
                  setEditingEmployeeId(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {/* Add/Edit Employee Form */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  {editingEmployeeId ? 'Edit Employee' : 'Add New Employee'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      placeholder="Employee name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={newEmployee.title}
                      onChange={(e) => setNewEmployee({ ...newEmployee, title: e.target.value })}
                      placeholder="Job title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {EMPLOYEE_COLORS.map(color => (
                        <button
                          key={color.value}
                          onClick={() => setNewEmployee({ ...newEmployee, color: color.value })}
                          className={`w-6 h-6 rounded-full ${color.value} ${
                            newEmployee.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                          }`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleSaveEmployee}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    {editingEmployeeId ? 'Update Employee' : 'Add Employee'}
                  </button>
                  {editingEmployeeId && (
                    <button
                      onClick={() => {
                        setNewEmployee({ name: '', title: '', color: 'bg-blue-500' });
                        setEditingEmployeeId(null);
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Employee List */}
              <h4 className="font-medium text-gray-900 mb-3">Current Team Members</h4>
              <p className="text-sm text-gray-500 mb-2">Drag to reorder employees</p>
              <div className="space-y-2">
                {employees.map(emp => (
                  <div
                    key={emp.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, emp)}
                    onDragOver={(e) => handleDragOver(e, emp)}
                    onDrop={(e) => handleDrop(e, emp)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50 cursor-move transition ${
                      draggedEmployee?.id === emp.id ? 'opacity-50 border-blue-400' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <span className={`w-4 h-4 rounded-full ${emp.color}`} />
                      <div>
                        <p className="font-medium text-gray-900">{emp.name}</p>
                        <p className="text-sm text-gray-500">{emp.title}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditEmployee(emp)}
                        className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => {
                  setShowEmployeeModal(false);
                  setNewEmployee({ name: '', title: '', color: 'bg-blue-500' });
                  setEditingEmployeeId(null);
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition"
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
