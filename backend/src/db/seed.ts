import { db } from './db.js';
import { users, bins, routes, routeBins } from './schema/index.js';
import bcrypt from 'bcrypt';

const dateDaysAgo = (daysAgo: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
};

async function seed() {
  console.log('Wiping database clean...');

  try {
    await db.delete(routeBins);
    await db.delete(routes);
    await db.delete(bins);
    await db.delete(users);
    console.log('Database wiped successfully.');

    console.log('Seeding users...');
    const driverPasswordHash = await bcrypt.hash('password123', 10);
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    
    const seededUsers = await db
      .insert(users)
      .values([
        { name: 'System Admin', email: 'admin@waste.com', passwordHash: adminPasswordHash, role: 'admin' },
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

    const getUserByEmail = (email: string) => {
      const user = seededUsers.find((seededUser) => seededUser.email === email);
      if (!user) {
        throw new Error(`Expected seeded user not found: ${email}`);
      }
      return user;
    };

    const amit = getUserByEmail('amit@waste.com');
    const rahul = getUserByEmail('rahul@waste.com');

    console.log('Seeding bins across Dehradun...');
    const seededBins = await db
      .insert(bins)
      .values([
        { latitude: 30.3400, longitude: 78.0600, zone: 'Rajpur Road' },
        { latitude: 30.3350, longitude: 78.0550, zone: 'Rajpur Road' },
        { latitude: 30.3500, longitude: 78.0750, zone: 'Pacific Mall Area' },
        { latitude: 30.3240, longitude: 78.0400, zone: 'Clock Tower' },
        { latitude: 30.3200, longitude: 78.0350, zone: 'Paltan Bazaar' },
        { latitude: 30.2880, longitude: 77.9980, zone: 'ISBT' },
        { latitude: 30.2680, longitude: 78.0050, zone: 'Clement Town' },
        { latitude: 30.2750, longitude: 78.0100, zone: 'Subhash Nagar' },
        { latitude: 30.3350, longitude: 77.9640, zone: 'Prem Nagar' },
        { latitude: 30.3400, longitude: 77.9500, zone: 'Vikasnagar Road' },
      ])
      .returning({ id: bins.id });

    const [
      bin1,
      bin2,
      bin3,
      bin4,
      bin5,
      bin6,
      bin7,
      bin8,
      bin9,
      bin10,
    ] = seededBins;

    if (!bin1 || !bin2 || !bin3 || !bin4 || !bin5 || !bin6 || !bin7 || !bin8 || !bin9 || !bin10) {
      throw new Error('Expected 10 seeded bins for route_bin setup.');
    }

    console.log('Seeding routes for My Stats endpoint testing...');
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

    const [amitRouteRecent, amitRouteWeekly, amitRouteOld, amitRoutePending, rahulRoute] = seededRoutes;

    if (!amitRouteRecent || !amitRouteWeekly || !amitRouteOld || !amitRoutePending || !rahulRoute) {
      throw new Error('Expected 5 seeded routes for stats test setup.');
    }

    await db.insert(routeBins).values([
      { routeId: amitRouteRecent.id, binId: bin1.id, sequenceNumber: 1, fillStatus: 'collected' },
      { routeId: amitRouteRecent.id, binId: bin2.id, sequenceNumber: 2, fillStatus: 'overflowing' },
      { routeId: amitRouteRecent.id, binId: bin3.id, sequenceNumber: 3, fillStatus: 'collected' },

      { routeId: amitRouteWeekly.id, binId: bin4.id, sequenceNumber: 1, fillStatus: 'collected' },
      { routeId: amitRouteWeekly.id, binId: bin5.id, sequenceNumber: 2, fillStatus: 'collected' },

      { routeId: amitRouteOld.id, binId: bin6.id, sequenceNumber: 1, fillStatus: 'overflowing' },
      { routeId: amitRouteOld.id, binId: bin7.id, sequenceNumber: 2, fillStatus: 'collected' },

      { routeId: amitRoutePending.id, binId: bin8.id, sequenceNumber: 1, fillStatus: 'unknown' },
      { routeId: amitRoutePending.id, binId: bin9.id, sequenceNumber: 2, fillStatus: 'unknown' },

      { routeId: rahulRoute.id, binId: bin10.id, sequenceNumber: 1, fillStatus: 'collected' },
      { routeId: rahulRoute.id, binId: bin1.id, sequenceNumber: 2, fillStatus: 'overflowing' },
    ]);

    console.log('Seeding complete.');
    console.log('');
    console.log('Driver to test My Stats endpoint:');
    console.log(`  Name: ${amit.name}`);
    console.log(`  Email: ${amit.email}`);
    console.log('  Password: password123');
    console.log(`  Driver ID: ${amit.id}`);
    console.log(`  Endpoint: GET /api/users/drivers/${amit.id}/stats`);
    console.log('');
    console.log('Expected stats snapshot for this driver:');
    console.log(
      JSON.stringify(
        {
          totalRoutesCompleted: 3,
          binHealth: {
            collected: 5,
            overflowing: 2,
            total: 7,
            overflowRatio: 29,
          },
          weeklyVelocity: [
            { date: amitRouteWeekly.assignedDate, count: 2 },
            { date: amitRouteRecent.assignedDate, count: 2 },
          ],
        },
        null,
        2
      )
    );

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();