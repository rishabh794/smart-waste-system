import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './db.js';
import { sql } from 'drizzle-orm';

async function dropTables() {
  console.log('--- Dropping All Tables ---');
  
  try {
    await db.execute(sql`DROP TABLE IF EXISTS route_bins, routes, bins, users CASCADE;`);
    console.log('✅ Tables dropped successfully.');
  } catch (error) {
    console.error('❌ Failed to drop tables:', error);
  }

  process.exit(0);
}

dropTables();