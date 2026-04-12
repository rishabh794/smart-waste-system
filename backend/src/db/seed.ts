import { db } from './db.js';
import { users, bins, routes, routeBins } from './schema/index.js';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🗑️  Wiping database clean...');

  try {
    await db.delete(routeBins);
    await db.delete(routes);
    await db.delete(bins);
    await db.delete(users);
    console.log('✅ Database wiped successfully.');

    console.log('👨‍✈️ Seeding Drivers...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const seededDrivers = await db.insert(users).values([
      { name: 'System Admin', email: 'admin@waste.com', passwordHash: adminPassword, role: 'admin' },
      { name: 'Amit Singh', email: 'amit@waste.com', passwordHash: hashedPassword, role: 'driver' },
      { name: 'Rahul Sharma', email: 'rahul@waste.com', passwordHash: hashedPassword, role: 'driver' },
      { name: 'Priya Patel', email: 'priya@waste.com', passwordHash: hashedPassword, role: 'driver' },
    ]).returning();

    console.log('🗑️  Seeding Bins across Dehradun...');
    await db.insert(bins).values([
      // North / Rajpur Area
      { latitude: 30.3400, longitude: 78.0600, zone: 'Rajpur Road' },
      { latitude: 30.3350, longitude: 78.0550, zone: 'Rajpur Road' },
      { latitude: 30.3500, longitude: 78.0750, zone: 'Pacific Mall Area' },
      
      // Central / Clock Tower
      { latitude: 30.3240, longitude: 78.0400, zone: 'Clock Tower' },
      { latitude: 30.3200, longitude: 78.0350, zone: 'Paltan Bazaar' },
      
      // South / ISBT & Clement Town
      { latitude: 30.2880, longitude: 77.9980, zone: 'ISBT' },
      { latitude: 30.2680, longitude: 78.0050, zone: 'Clement Town' },
      { latitude: 30.2750, longitude: 78.0100, zone: 'Subhash Nagar' },
      
      // West / Prem Nagar
      { latitude: 30.3350, longitude: 77.9640, zone: 'Prem Nagar' },
      { latitude: 30.3400, longitude: 77.9500, zone: 'Vikasnagar Road' },
    ]);

    console.log('✅ Seeding Complete! Drivers and Bins are ready.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();