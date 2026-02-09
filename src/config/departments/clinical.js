export default {
  id: 'clinical',
  label: 'Clinical Applications',
  eventTypes: [
    'First Line',
    'Vacation',
    'Refresh Catalyst',
    'Refresh Sentinel',
    'Phase 1 Catalyst Training',
    'Phase 2 Catalyst Training',
    'Phase 1 Sentinel Training',
    'Phase 2 Sentinel Training',
    'Custom'
  ],
  eventTypeColors: {
    'First Line': { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800' },
    'Vacation': { bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-800' },
    'Refresh Catalyst': { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800' },
    'Refresh Sentinel': { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-800' },
    'Phase 1 Catalyst Training': { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800' },
    'Phase 2 Catalyst Training': { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-800' },
    'Phase 1 Sentinel Training': { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800' },
    'Phase 2 Sentinel Training': { bg: 'bg-fuchsia-100', border: 'border-fuchsia-300', text: 'text-fuchsia-800' },
    'Custom': { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800' }
  },
  comboColors: {},
  products: [
    'Catalyst + HD',
    'Catalyst + Lite',
    'Catalyst + HD PT',
    'Sentinel',
    'cAutoVerify'
  ]
};
