import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('REDIS_URL is not set. BullMQ queues will not work properly.');
}

// Ensure the standard maximum connection limits are respected for Upstash Redis
export const redisConnection = redisUrl ? new Redis(redisUrl, {
  maxRetriesPerRequest: null,
}) : null;
