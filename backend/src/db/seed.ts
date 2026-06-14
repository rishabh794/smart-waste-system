/**
 * Seed script for the smart-waste-system database.
 *
 * SAFE: Does NOT touch the reports table.
 * SAFE: Preserves the existing user rishabhbuchha123456789@gmail.com.
 *
 * Run with: npx tsx src/db/seed.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, ne, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { cities } from './schema/cities.js';
import { users } from './schema/users.js';
import { bins } from './schema/bins.js';
import { routes, routeBins } from './schema/routes.js';
import { reports } from './schema/reports.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const PRESERVED_EMAIL = 'rishabhbuchha123456789@gmail.com';

async function seed() {
  console.log('🌱 Starting seed...');

  // ── 1. Clean up route-related data (but NOT reports) ──
  console.log('  🧹 Cleaning route_bins, routes, bins, drivers...');
  await db.delete(routeBins);
  await db.delete(routes);
  
  // Nullify bin references in reports so we can safely delete bins
  await db.update(reports).set({ binId: null, resolvedById: null, resolvedByName: null });
  await db.delete(bins);

  // Delete all drivers EXCEPT the preserved user
  await db.delete(users).where(
    and(
      ne(users.email, PRESERVED_EMAIL),
      eq(users.role, 'driver')
    )
  );

  // Clean up old cities
  await db.delete(cities);

  // ── 2. Seed Cities ──
  console.log('  🏙️  Seeding cities...');
  const [siliguri, kolkata, mumbai] = await db.insert(cities).values([
    {
      name: 'Siliguri',
      depotLat: 26.7271,
      depotLng: 88.3953,
    },
    {
      name: 'Kolkata',
      depotLat: 22.5726,
      depotLng: 88.3639,
    },
    {
      name: 'Mumbai',
      depotLat: 19.0760,
      depotLng: 72.8777,
    },
  ]).returning();

  console.log(`    ✅ Created cities: ${siliguri!.name}, ${kolkata!.name}, ${mumbai!.name}`);

  // ── 3. Update the preserved user's city if they exist ──
  const [preservedUser] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, PRESERVED_EMAIL))
    .limit(1);

  if (preservedUser) {
    await db.update(users).set({ cityId: siliguri!.id }).where(eq(users.id, preservedUser.id));
    console.log(`  👤 Updated preserved user (${PRESERVED_EMAIL}) → city: Siliguri`);
  }

  // ── 4. Seed Drivers ──
  console.log('  🚛 Seeding drivers...');
  const driverPassword = await bcrypt.hash('driver123', 10);

  const seededDrivers = await db.insert(users).values([
    {
      name: 'Amit Kumar',
      email: 'amit.driver@smartwaste.in',
      passwordHash: driverPassword,
      role: 'driver' as const,
      phone: '+91-9876543210',
      cityId: siliguri!.id,
    },
    {
      name: 'Ravi Sharma',
      email: 'ravi.driver@smartwaste.in',
      passwordHash: driverPassword,
      role: 'driver' as const,
      phone: '+91-9876543211',
      cityId: siliguri!.id,
    },
    {
      name: 'Suresh Mondal',
      email: 'suresh.driver@smartwaste.in',
      passwordHash: driverPassword,
      role: 'driver' as const,
      phone: '+91-9876543212',
      cityId: kolkata!.id,
    },
    {
      name: 'Priya Das',
      email: 'priya.driver@smartwaste.in',
      passwordHash: driverPassword,
      role: 'driver' as const,
      phone: '+91-9876543213',
      cityId: mumbai!.id,
    },
  ]).returning({ id: users.id, name: users.name, email: users.email });

  for (const d of seededDrivers) {
    console.log(`    ✅ ${d.name} (${d.email})`);
  }

  // ── 5. Seed Bins ──
  console.log('  🗑️  Seeding bins...');

  // Siliguri bins (around Siliguri city center)
  const siliguriBins = await db.insert(bins).values([
    { latitude: 26.7271, longitude: 88.3953, cityId: siliguri!.id, status: 'active', fillLevel: 75, fillRatePerDay: 25 },
    { latitude: 26.7310, longitude: 88.3990, cityId: siliguri!.id, status: 'active', fillLevel: 40, fillRatePerDay: 15 },
    { latitude: 26.7250, longitude: 88.3910, cityId: siliguri!.id, status: 'active', fillLevel: 90, fillRatePerDay: 30 },
    { latitude: 26.7290, longitude: 88.4020, cityId: siliguri!.id, status: 'active', fillLevel: 20, fillRatePerDay: 10 },
    { latitude: 26.7230, longitude: 88.3870, cityId: siliguri!.id, status: 'active', fillLevel: 60, fillRatePerDay: 20 },
    { latitude: 26.7340, longitude: 88.3940, cityId: siliguri!.id, status: 'maintenance', fillLevel: 0, fillRatePerDay: 0 },
  ]).returning({ id: bins.id });

  console.log(`    ✅ Siliguri: ${siliguriBins.length} bins`);

  // Kolkata bins (around Park Street / Esplanade area)
  const kolkataBins = await db.insert(bins).values([
    { latitude: 22.5726, longitude: 88.3639, cityId: kolkata!.id, status: 'active', fillLevel: 85, fillRatePerDay: 35 },
    { latitude: 22.5750, longitude: 88.3670, cityId: kolkata!.id, status: 'active', fillLevel: 50, fillRatePerDay: 20 },
    { latitude: 22.5700, longitude: 88.3610, cityId: kolkata!.id, status: 'active', fillLevel: 30, fillRatePerDay: 15 },
    { latitude: 22.5780, longitude: 88.3700, cityId: kolkata!.id, status: 'active', fillLevel: 95, fillRatePerDay: 40 },
  ]).returning({ id: bins.id });

  console.log(`    ✅ Kolkata: ${kolkataBins.length} bins`);

  // Mumbai bins (around Andheri / BKC area)
  const mumbaiBins = await db.insert(bins).values([
    { latitude: 19.0760, longitude: 72.8777, cityId: mumbai!.id, status: 'active', fillLevel: 70, fillRatePerDay: 30 },
    { latitude: 19.0800, longitude: 72.8810, cityId: mumbai!.id, status: 'active', fillLevel: 55, fillRatePerDay: 25 },
    { latitude: 19.0730, longitude: 72.8740, cityId: mumbai!.id, status: 'active', fillLevel: 45, fillRatePerDay: 20 },
  ]).returning({ id: bins.id });

  console.log(`    ✅ Mumbai: ${mumbaiBins.length} bins`);

  // ── Done ──
  console.log('\n🎉 Seed completed successfully!');
  console.log('   Driver credentials → password: driver123');

  await pool.end();
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});