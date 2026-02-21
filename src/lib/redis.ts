import Redis from 'ioredis'

const getRedisUrl = () => {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL
    }
    throw new Error('REDIS_URL is not defined')
}

// Global variable to maintain the connection in development (HMR)
const globalForRedis = global as unknown as { redis: Redis }

export const redis =
    globalForRedis.redis ||
    new Redis(getRedisUrl(), {
        // Retry strategy if connection fails
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3,
    })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
