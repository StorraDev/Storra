import { createClient } from 'redis';
import { logger } from '../../utils/logger'; // adjust the path as needed
import type { RedisClientType } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const client: RedisClientType = createClient({ url: REDIS_URL });

client.on('error', (err: Error) => {
  logger.error('❌ Redis Client Error', { error: err.message });
});

const connectRedis = async () => {
  try {
    await client.connect();
    logger.info('✅ Connected to Redis');
  } catch (err: any) {
    logger.error('❌ Failed to connect to Redis', { error: err.message });
    process.exit(1); // exit if Redis is critical
  }
};

const CACHE_TTL = 3600; // 1 hour

export { client, connectRedis, CACHE_TTL };

// docker run -d \
//   --name redis-dev \
//   -p 6379:6379 \
//docker start redis-dev
//   redis

