import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'

const getKey = (userId: string) => `tag_combos:${userId}`

export async function GET() {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = await getSession(token)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await redis.get(getKey(userId))
    return NextResponse.json(data ? JSON.parse(data) : [])
}

export async function POST(request: NextRequest) {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = await getSession(token)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const combos = await request.json()
    await redis.set(getKey(userId), JSON.stringify(combos))
    return NextResponse.json({ success: true })
}
