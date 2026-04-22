import bcrypt from 'bcrypt';
import { db } from './db.js';
import { bins, routeBins, routes, users } from './schema/index.js';

const ADMIN_EMAIL = 'admin@waste.com';
const ADMIN_PASSWORD = 'admin123';
const DRIVER_PASSWORD = 'password123';

const dateDaysAgo = (daysAgo: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
};

const hoursAgo = (hours: number) => new Date(Date.now() - (hours * 60 * 60 * 1000));

const binSeedData = [
  { latitude: 30.3400, longitude: 78.0600, zone: 'Rajpur Road', fillLevel: 78, fillRatePerDay: 28, status: 'active', lastEmptiedAt: hoursAgo(42) },
  { latitude: 30.3350, longitude: 78.0550, zone: 'Rajpur Road', fillLevel: 85, fillRatePerDay: 35, status: 'active', lastEmptiedAt: hoursAgo(30) },
  { latitude: 30.3500, longitude: 78.0750, zone: 'Pacific Mall Area', fillLevel: 51, fillRatePerDay: 22, status: 'active', lastEmptiedAt: hoursAgo(14) },
  { latitude: 30.3240, longitude: 78.0400, zone: 'Clock Tower', fillLevel: 62, fillRatePerDay: 26, status: 'active', lastEmptiedAt: hoursAgo(20) },
  { latitude: 30.3200, longitude: 78.0350, zone: 'Paltan Bazaar', fillLevel: 34, fillRatePerDay: 18, status: 'active', lastEmptiedAt: hoursAgo(9) },
  { latitude: 30.2880, longitude: 77.9980, zone: 'ISBT', fillLevel: 88, fillRatePerDay: 40, status: 'active', lastEmptiedAt: hoursAgo(55) },
  { latitude: 30.2680, longitude: 78.0050, zone: 'Clement Town', fillLevel: 44, fillRatePerDay: 16, status: 'active', lastEmptiedAt: hoursAgo(16) },
  { latitude: 30.2750, longitude: 78.0100, zone: 'Subhash Nagar', fillLevel: 70, fillRatePerDay: 25, status: 'active', lastEmptiedAt: hoursAgo(26) },
  { latitude: 30.3350, longitude: 77.9640, zone: 'Prem Nagar', fillLevel: 40, fillRatePerDay: 14, status: 'active', lastEmptiedAt: hoursAgo(11) },
  { latitude: 30.3400, longitude: 77.9500, zone: 'Vikasnagar Road', fillLevel: 66, fillRatePerDay: 24, status: 'active', lastEmptiedAt: hoursAgo(24) },
] as const;

async function seed() {
  console.log('Resetting database tables...');

  try {
    await db.delete(routeBins);
    await db.delete(routes);
    await db.delete(bins);
    await db.delete(users);

    const [adminPasswordHash, driverPasswordHash] = await Promise.all([
      bcrypt.hash(ADMIN_PASSWORD, 10),
      bcrypt.hash(DRIVER_PASSWORD, 10),
    ]);

    const seededUsers = await db
      .insert(users)
      .values([
        { name: 'System Admin', email: ADMIN_EMAIL, passwordHash: adminPasswordHash, role: 'admin' },
        { name: 'Amit Singh', email: 'amit@waste.com', passwordHash: driverPasswordHash, role: 'driver' },
        { name: 'Rahul Sharma', email: 'rahul@waste.com', passwordHash: driverPasswordHash, role: 'driver' },
        { name: 'Priya Patel', email: 'priya@waste.com', passwordHash: driverPasswordHash, role: 'driver' },
      ])
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    const usersByEmail = new Map(seededUsers.map((seededUser) => [seededUser.email, seededUser]));

    const getUserByEmail = (email: string) => {
      const user = usersByEmail.get(email);
      if (!user) {
        throw new Error(`Expected seeded user not found: ${email}`);
      }
      return user;
    };

    const amit = getUserByEmail('amit@waste.com');
    const rahul = getUserByEmail('rahul@waste.com');

    const seededBins = await db
      .insert(bins)
      .values([...binSeedData])
      .returning({ id: bins.id });

    if (seededBins.length !== 10) {
      throw new Error('Expected 10 seeded bins for route assignment setup.');
    }

    const [bin1, bin2, bin3, bin4, bin5, bin6, bin7, bin8, bin9, bin10] = seededBins;

    if (!bin1 || !bin2 || !bin3 || !bin4 || !bin5 || !bin6 || !bin7 || !bin8 || !bin9 || !bin10) {
      throw new Error('Expected 10 seeded bins for route_bin setup.');
    }

    const seededRoutes = await db
      .insert(routes)
      .values([
        { driverId: amit.id, assignedDate: dateDaysAgo(1), status: 'completed' },
        { driverId: amit.id, assignedDate: dateDaysAgo(3), status: 'completed' },
        { driverId: amit.id, assignedDate: dateDaysAgo(8), status: 'completed' },
        { driverId: amit.id, assignedDate: dateDaysAgo(0), status: 'pending' },
        { driverId: rahul.id, assignedDate: dateDaysAgo(2), status: 'completed' },
      ])
      .returning({
        id: routes.id,
        assignedDate: routes.assignedDate,
      });

    if (seededRoutes.length !== 5) {
      throw new Error('Expected 5 seeded routes for dashboard/stats setup.');
    }

    const [amitRouteRecent, amitRouteWeekly, amitRouteOld, amitRoutePending, rahulRoute] = seededRoutes;

    if (!amitRouteRecent || !amitRouteWeekly || !amitRouteOld || !amitRoutePending || !rahulRoute) {
      throw new Error('Expected 5 seeded routes for stats test setup.');
    }

    await db.insert(routeBins).values([
      { routeId: amitRouteRecent.id, binId: bin1.id, sequenceNumber: 1, fillStatus: 'collected' },
      {
        routeId: amitRouteRecent.id,
        binId: bin2.id,
        sequenceNumber: 2,
        fillStatus: 'collected',
        wasOverflowing: true,
      },
      { routeId: amitRouteRecent.id, binId: bin3.id, sequenceNumber: 3, fillStatus: 'collected' },

      { routeId: amitRouteWeekly.id, binId: bin4.id, sequenceNumber: 1, fillStatus: 'collected' },
      { routeId: amitRouteWeekly.id, binId: bin5.id, sequenceNumber: 2, fillStatus: 'collected' },

      {
        routeId: amitRouteOld.id,
        binId: bin6.id,
        sequenceNumber: 1,
        fillStatus: 'collected',
        wasOverflowing: true,
      },
      { routeId: amitRouteOld.id, binId: bin7.id, sequenceNumber: 2, fillStatus: 'collected' },

      { routeId: amitRoutePending.id, binId: bin8.id, sequenceNumber: 1, fillStatus: 'unknown' },
      {
        routeId: amitRoutePending.id,
        binId: bin9.id,
        sequenceNumber: 2,
        fillStatus: 'missed',
        missedReason: 'road_blocked',
        missedNote: 'Waterlogging and barricades blocked truck access.',
      },

      { routeId: rahulRoute.id, binId: bin10.id, sequenceNumber: 1, fillStatus: 'collected' },
      {
        routeId: rahulRoute.id,
        binId: bin1.id,
        sequenceNumber: 2,
        fillStatus: 'collected',
        wasOverflowing: true,
      },
    ]);

    console.log('Seed complete.');
    console.log(`Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log('Driver login: amit@waste.com / password123');
    console.log('Driver login: rahul@waste.com / password123');
    console.log('Driver login: priya@waste.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

void seed();