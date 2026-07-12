// Seeds the Firestore `pantries` and `events` collections with realistic
// St. Louis-area sample data so the app has something to render.
//
// Firestore rules only allow admins/pantry staff to create these documents,
// so this script uses the Admin SDK (which bypasses rules) with a service
// account:
//
//   export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json
//   npm run seed            # skips any collection that already has documents
//   npm run seed -- --force # seeds even if the collections are non-empty
//
// Data shapes match the validators in firestore.rules exactly — documents
// written here remain editable by staff through the client SDK later.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';

const here = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(here, '../firebase-applet-config.json'), 'utf8')) as {
  projectId: string;
  firestoreDatabaseId: string;
};

const FORCE = process.argv.includes('--force');

// Schema per firestore.rules isValidPantry:
// name, address, latitude, longitude, phone?, hours?, inventoryStatus, lastUpdated?
const PANTRIES = [
  { name: 'Gateway Community Pantry', address: '2800 Olive St, St. Louis, MO 63103', latitude: 38.6367, longitude: -90.2137, phone: '(314) 555-0141', hours: 'Mon-Fri 9am-4pm', inventoryStatus: 'high' },
  { name: 'North City Food Share', address: '4225 N Grand Blvd, St. Louis, MO 63107', latitude: 38.6634, longitude: -90.2088, phone: '(314) 555-0172', hours: 'Tue & Thu 10am-2pm, Sat 9am-12pm', inventoryStatus: 'medium' },
  { name: 'Tower Grove Neighbors Pantry', address: '3617 Grandel Sq, St. Louis, MO 63108', latitude: 38.6415, longitude: -90.2312, phone: '(314) 555-0119', hours: 'Wed 12pm-6pm', inventoryStatus: 'low' },
  { name: 'Soulard Market Food Bank', address: '730 Carroll St, St. Louis, MO 63104', latitude: 38.6104, longitude: -90.2065, phone: '(314) 555-0163', hours: 'Mon, Wed, Fri 8am-1pm', inventoryStatus: 'high' },
  { name: 'Dutchtown Helping Hands', address: '4200 S Grand Blvd, St. Louis, MO 63111', latitude: 38.5824, longitude: -90.2401, phone: '(314) 555-0186', hours: 'Tue-Sat 10am-3pm', inventoryStatus: 'medium' },
  { name: 'The Ville Community Cupboard', address: '4144 St Louis Ave, St. Louis, MO 63113', latitude: 38.6591, longitude: -90.2419, phone: '(314) 555-0128', hours: 'Thu 1pm-6pm, Sat 9am-1pm', inventoryStatus: 'empty' },
  { name: 'Carondelet Neighborhood Pantry', address: '7701 S Broadway, St. Louis, MO 63111', latitude: 38.5569, longitude: -90.2559, phone: '(314) 555-0195', hours: 'Mon & Thu 9am-2pm', inventoryStatus: 'medium' },
  { name: 'University City Food Network', address: '6801 Delmar Blvd, University City, MO 63130', latitude: 38.6560, longitude: -90.3021, phone: '(314) 555-0154', hours: 'Mon-Fri 11am-5pm', inventoryStatus: 'high' },
  { name: 'Ferguson Shared Table', address: '25 S Florissant Rd, Ferguson, MO 63135', latitude: 38.7442, longitude: -90.3054, phone: '(314) 555-0137', hours: 'Wed & Fri 10am-4pm', inventoryStatus: 'low' },
  { name: 'East Side Nutrition Hub', address: '601 James R Thompson Blvd, East St. Louis, IL 62201', latitude: 38.6270, longitude: -90.1520, phone: '(618) 555-0148', hours: 'Tue & Thu 9am-3pm', inventoryStatus: 'medium' },
] as const;

function daysFromNow(days: number, hour: number): Timestamp {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return Timestamp.fromDate(date);
}

// Schema per firestore.rules isValidEvent:
// title, description?, date, location, latitude?, longitude?, type, createdBy
const EVENTS = [
  { title: 'Mobile Market: O’Fallon Park', description: 'Fresh produce, dairy, and pantry staples from the mobile market truck. First come, first served.', date: daysFromNow(2, 10), location: 'O’Fallon Park Rec Complex, 4343 W Florissant Ave', latitude: 38.6706, longitude: -90.2224, type: 'mobile_market', createdBy: 'seed-script' },
  { title: 'Pop-Up Pantry at Fairground Park', description: 'Community pop-up distribution with shelf-stable goods and hygiene kits.', date: daysFromNow(4, 13), location: 'Fairground Park, 3715 Natural Bridge Ave', latitude: 38.6650, longitude: -90.2223, type: 'pop_up', createdBy: 'seed-script' },
  { title: 'Drive-Thru Food Distribution', description: 'Stay in your car — volunteers load a box of groceries into your trunk. One box per household.', date: daysFromNow(6, 9), location: 'Friendly Temple Church, 5515 Dr Martin Luther King Dr', latitude: 38.6607, longitude: -90.2648, type: 'drive_thru', createdBy: 'seed-script' },
  { title: 'Mobile Market: Dutchtown', description: 'Weekly mobile market stop with fruits, vegetables, and bread.', date: daysFromNow(9, 15), location: 'Marquette Park, 4025 Minnesota Ave', latitude: 38.5860, longitude: -90.2331, type: 'mobile_market', createdBy: 'seed-script' },
  { title: 'Weekend Pop-Up: University City', description: 'Saturday morning pop-up pantry with fresh and frozen items.', date: daysFromNow(11, 9), location: 'Heman Park Community Center, 975 Pennsylvania Ave', latitude: 38.6663, longitude: -90.3232, type: 'pop_up', createdBy: 'seed-script' },
  { title: 'Drive-Thru Distribution: Ferguson', description: 'Monthly drive-thru grocery distribution in partnership with area churches.', date: daysFromNow(14, 10), location: 'Ferguson Community Center, 1050 Smith Ave', latitude: 38.7492, longitude: -90.2955, type: 'drive_thru', createdBy: 'seed-script' },
] as const;

async function seedCollection(db: Firestore, name: string, docs: readonly Record<string, unknown>[]) {
  const existing = await db.collection(name).limit(1).get();
  if (!existing.empty && !FORCE) {
    console.log(`✓ ${name}: already has documents, skipping (use --force to seed anyway)`);
    return;
  }

  const batch = db.batch();
  for (const doc of docs) {
    batch.set(db.collection(name).doc(), doc);
  }
  await batch.commit();
  console.log(`✓ ${name}: wrote ${docs.length} documents`);
}

async function main() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error(
      'GOOGLE_APPLICATION_CREDENTIALS is not set.\n' +
      'Download a service-account key (Firebase console → Project settings → Service accounts)\n' +
      'and run: export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json',
    );
    process.exit(1);
  }

  const app = initializeApp({ credential: applicationDefault(), projectId: config.projectId });
  // The app uses a NAMED database (not "(default)") — must match src/firebase.ts.
  const db = getFirestore(app, config.firestoreDatabaseId);

  const pantries = PANTRIES.map((p) => ({ ...p, lastUpdated: Timestamp.now() }));
  await seedCollection(db, 'pantries', pantries);
  await seedCollection(db, 'events', EVENTS as unknown as Record<string, unknown>[]);

  console.log('Done.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
