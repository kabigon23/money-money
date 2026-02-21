import { v4 as uuidv4 } from 'uuid'
import { redis } from './redis'

const SESSION_TTL = 60 * 60 * 24 * 7 // 7 days in seconds

export async function createSession(userId: string): Promise<string> {
    const token = uuidv4()
    await redis.set(`session:${token}`, userId, 'EX', SESSION_TTL)
    return token
}

export async function getSession(token: string): Promise<string | null> {
    return redis.get(`session:${token}`)
}

export async function deleteSession(token: string): Promise<void> {
    await redis.del(`session:${token}`)
}
