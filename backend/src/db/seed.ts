import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './db.js';
import { users, bins, routes, routeBins } from './schema/index.js';
import bcrypt from 'bcrypt';


async function seed() {
  console.log('--- Cleaning Database ---');
  await db.delete(routeBins);
  await db.delete(routes);
  await db.delete(bins);
  await db.delete(users);

  console.log('--- Seeding Users ---');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const driverPassword = await bcrypt.hash('driver123', 10);
  
  const [admin] = await db.insert(users).values({
    name: 'Admin Manager',
    email: 'admin@waste.com',
    passwordHash: adminPassword,
    role: 'admin',
  }).returning();

  const [driver] = await db.insert(users).values({
    name: 'John the Driver',
    email: 'driver@waste.com',
    passwordHash: driverPassword,
    role: 'driver',
  }).returning();

  if (!driver) throw new Error('Failed to create driver user');

  console.log('--- Seeding Bins ---');
  const insertedBins = await db.insert(bins).values([
    { latitude: 30.316496, longitude: 78.032188, zone: 'North' }, 
    { latitude: 30.326496, longitude: 78.042188, zone: 'North' },
    { latitude: 30.336496, longitude: 78.052188, zone: 'South' },
  ]).returning();

  if (!insertedBins || insertedBins.length < 2) throw new Error('Failed to create bins');

  console.log('--- Seeding Today\'s Route for John ---');
  const [route] = await db.insert(routes).values({
    driverId: driver.id,
    assignedDate: new Date().toISOString(), // Today
    status: 'pending'
  }).returning();

  if (!route) throw new Error('Failed to create route');

  await db.insert(routeBins).values([
    { routeId: route.id, binId: insertedBins[0]!.id, sequenceNumber: 1, fillStatus: 'unknown' },
    { routeId: route.id, binId: insertedBins[1]!.id, sequenceNumber: 2, fillStatus: 'unknown' },
  ]);

  console.log('--- Seed Complete! ---');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});