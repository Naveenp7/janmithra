/**
 * LSG Kerala Civic Issue Categories and Standard Departmental Staff
 */

export const CIVIC_CATEGORIES = ['Road', 'Water', 'Electricity', 'Waste', 'Drainage', 'Other'];

export const LSG_DEPARTMENTS = [
  'Road Infrastructure',
  'Water Authority (KWA)',
  'Electricity Board (KSEB)',
  'Solid Waste Management',
  'Drainage & Sewerage',
  'General Administration'
];

/**
 * Standard departmental field staff designations for Kerala LSGs
 * (Used to initialize workers collection in Firestore if empty)
 */
export const DEFAULT_LSG_WORKERS = [
  { workerId: 'w-road-1', name: 'Rajesh Kumar', department: 'Road', phone: '+91 98470 12345' },
  { workerId: 'w-water-1', name: 'Sujith Varma', department: 'Water', phone: '+91 94471 23456' },
  { workerId: 'w-elec-1', name: 'Anitha Nair', department: 'Electricity', phone: '+91 97455 34567' },
  { workerId: 'w-waste-1', name: 'Muhammed Shafi', department: 'Waste', phone: '+91 98950 45678' },
  { workerId: 'w-drain-1', name: 'Pradeep Chandran', department: 'Drainage', phone: '+91 94000 56789' },
  { workerId: 'w-road-2', name: 'Deepa George', department: 'Road', phone: '+91 97472 67890' },
];
