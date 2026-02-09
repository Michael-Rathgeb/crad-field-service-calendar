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
