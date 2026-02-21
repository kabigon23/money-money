import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { redis } from '@/lib/redis'

export async function GET() {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value

    if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const requesterId = await getSession(token)
    if (!requesterId) return NextResponse.json({ error: '세션이 만료되었습니다.' }, { status: 401 })

    const requesterJson = await redis.get(`user:${requesterId}`)
    if (!requesterJson) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })

    const requester = JSON.parse(requesterJson)
    if (requester.role !== 'ADMIN') return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const userIds = await redis.smembers('users:list')
    const users = await Promise.all(
        userIds.map(async (id: string) => {
            const json = await redis.get(`user:${id}`)
            return json ? JSON.parse(json) : null
        })
    )

    return NextResponse.json({ users: users.filter(Boolean) })
}
