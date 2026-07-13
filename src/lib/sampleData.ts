// Sample St. Louis-area data used as a graceful fallback when Firestore has no
// pantries/events yet (unseeded project) or a read fails — so the app is never
// blank. Pages surface a subtle "sample data" note when this is in use. Shapes
// mirror what Pantries.tsx / Events.tsx / CommandCenter.tsx read, and the
// Firestore schema in firestore.rules / scripts/seed.ts.

export interface SamplePantry {
  id: string;
  name: string;
  address: string;
  county?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  hours?: string;
  services?: string;
  inventoryStatus: 'high' | 'medium' | 'low' | 'empty';
}

export const SAMPLE_PANTRIES: SamplePantry[] = [
  { id: 's-p1', name: 'Gateway Community Pantry', address: '2800 Olive St, St. Louis, MO 63103', county: 'St. Louis City', latitude: 38.6367, longitude: -90.2137, phone: '(314) 555-0141', hours: 'Mon–Fri 9am–4pm', services: 'Groceries, fresh produce, hygiene kits', inventoryStatus: 'high' },
  { id: 's-p2', name: 'North City Food Share', address: '4225 N Grand Blvd, St. Louis, MO 63107', county: 'St. Louis City', latitude: 38.6634, longitude: -90.2088, phone: '(314) 555-0172', hours: 'Tue & Thu 10am–2pm, Sat 9am–12pm', services: 'Groceries, baby supplies', inventoryStatus: 'medium' },
  { id: 's-p3', name: 'Tower Grove Neighbors Pantry', address: '3617 Grandel Sq, St. Louis, MO 63108', county: 'St. Louis City', latitude: 38.6415, longitude: -90.2312, phone: '(314) 555-0119', hours: 'Wed 12pm–6pm', services: 'Groceries, senior boxes', inventoryStatus: 'low' },
  { id: 's-p4', name: 'Soulard Market Food Bank', address: '730 Carroll St, St. Louis, MO 63104', county: 'St. Louis City', latitude: 38.6104, longitude: -90.2065, phone: '(314) 555-0163', hours: 'Mon, Wed, Fri 8am–1pm', services: 'Fresh produce, bread', inventoryStatus: 'high' },
  { id: 's-p5', name: 'Dutchtown Helping Hands', address: '4200 S Grand Blvd, St. Louis, MO 63111', county: 'St. Louis City', latitude: 38.5824, longitude: -90.2401, phone: '(314) 555-0186', hours: 'Tue–Sat 10am–3pm', services: 'Groceries, hot meals', inventoryStatus: 'medium' },
  { id: 's-p6', name: 'The Ville Community Cupboard', address: '4144 St Louis Ave, St. Louis, MO 63113', county: 'St. Louis City', latitude: 38.6591, longitude: -90.2419, phone: '(314) 555-0128', hours: 'Thu 1pm–6pm, Sat 9am–1pm', inventoryStatus: 'empty' },
  { id: 's-p7', name: 'University City Food Network', address: '6801 Delmar Blvd, University City, MO 63130', county: 'St. Louis County', latitude: 38.6560, longitude: -90.3021, phone: '(314) 555-0154', hours: 'Mon–Fri 11am–5pm', services: 'Groceries, fresh produce', inventoryStatus: 'high' },
  { id: 's-p8', name: 'Ferguson Shared Table', address: '25 S Florissant Rd, Ferguson, MO 63135', county: 'St. Louis County', latitude: 38.7442, longitude: -90.3054, phone: '(314) 555-0137', hours: 'Wed & Fri 10am–4pm', services: 'Groceries, diapers', inventoryStatus: 'low' },
];

export interface SampleEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  type: 'mobile_market' | 'pop_up' | 'drive_thru';
  latitude: number;
  longitude: number;
}

// Dates are generated relative to now so the sample events are always upcoming.
const daysOut = (days: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

export const SAMPLE_EVENTS: SampleEvent[] = [
  { id: 's-e1', title: 'Mobile Market: O’Fallon Park', description: 'Fresh produce, dairy, and pantry staples from the mobile market truck. First come, first served.', date: daysOut(2, 10), location: 'O’Fallon Park Rec Complex, 4343 W Florissant Ave', type: 'mobile_market', latitude: 38.6706, longitude: -90.2224 },
  { id: 's-e2', title: 'Pop-Up Pantry at Fairground Park', description: 'Community pop-up distribution with shelf-stable goods and hygiene kits.', date: daysOut(4, 13), location: 'Fairground Park, 3715 Natural Bridge Ave', type: 'pop_up', latitude: 38.6650, longitude: -90.2223 },
  { id: 's-e3', title: 'Drive-Thru Food Distribution', description: 'Stay in your car — volunteers load a box of groceries into your trunk. One box per household.', date: daysOut(6, 9), location: 'Friendly Temple Church, 5515 Dr Martin Luther King Dr', type: 'drive_thru', latitude: 38.6607, longitude: -90.2648 },
  { id: 's-e4', title: 'Mobile Market: Dutchtown', description: 'Weekly mobile market stop with fruits, vegetables, and bread.', date: daysOut(9, 15), location: 'Marquette Park, 4025 Minnesota Ave', type: 'mobile_market', latitude: 38.5860, longitude: -90.2331 },
  { id: 's-e5', title: 'Weekend Pop-Up: University City', description: 'Saturday morning pop-up pantry with fresh and frozen items.', date: daysOut(11, 9), location: 'Heman Park Community Center, 975 Pennsylvania Ave', type: 'pop_up', latitude: 38.6663, longitude: -90.3232 },
  { id: 's-e6', title: 'Drive-Thru Distribution: Ferguson', description: 'Monthly drive-thru grocery distribution in partnership with area churches.', date: daysOut(14, 10), location: 'Ferguson Community Center, 1050 Smith Ave', type: 'drive_thru', latitude: 38.7492, longitude: -90.2955 },
];
