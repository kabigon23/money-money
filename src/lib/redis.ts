import Redis from 'ioredis'

const getRedisUrl = () => {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL
    }
    throw new Error('REDIS_URL is not defined')
}

// Global variable to maintain the connection in development (HMR)
const globalForRedis = global as unknown as { redis: Redis }

function createRedisClient(): Redis {
    const url = getRedisUrl()
    // Upstash 등 TLS(rediss://) 연결 자동 감지
    const isTls = url.startsWith('rediss://')

    return new Redis(url, {
        tls: isTls ? {} : undefined,
        // Retry strategy
        retryStrategy(times) {
            if (times > 5) return null // 5회 초과 시 재시도 중단
            return Math.min(times * 100, 3000)
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: false, // Upstash 호환성
        lazyConnect: false,
    })
}

export const redis = globalForRedis.redis || createRedisClient()

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
