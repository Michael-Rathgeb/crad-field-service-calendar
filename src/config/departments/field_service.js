export default {
  id: 'field_service',
  label: 'Field Service',
  eventTypes: [
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
  products: [
    'Catalyst +',
    'Catalyst Classic',
    'Sentinel',
    'VCLP',
    'c4D Server',
    'cAutoVerify'
  ]
};
