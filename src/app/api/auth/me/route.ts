import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { redis } from '@/lib/redis'

export async function GET() {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value

    if (!token) {
        return NextResponse.json({ user: null }, { status: 401 })
    }

    const userId = await getSession(token)
    if (!userId) {
        return NextResponse.json({ user: null }, { status: 401 })
    }

    const userJson = await redis.get(`user:${userId}`)
    if (!userJson) {
        return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user: JSON.parse(userJson) })
}
