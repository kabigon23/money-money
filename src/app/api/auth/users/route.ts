import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { requireAdmin } from '@/lib/api-auth'

export async function GET() {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error

    const userIds = await redis.smembers('users:list')
    const users = await Promise.all(
        userIds.map(async (id: string) => {
            const json = await redis.get(`user:${id}`)
            return json ? JSON.parse(json) : null
        })
    )

    return NextResponse.json({ users: users.filter(Boolean) })
}
