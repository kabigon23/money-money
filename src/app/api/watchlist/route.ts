import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'

const getWatchlistKey = (userId: string) => `watchlist:${userId}`

export async function GET() {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = await getSession(token)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await redis.get(getWatchlistKey(userId))
    const watchlist = data ? JSON.parse(data) : []
    return NextResponse.json(watchlist)
}

export async function POST(request: NextRequest) {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = await getSession(token)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const watchlist = await request.json()
    await redis.set(getWatchlistKey(userId), JSON.stringify(watchlist))
    return NextResponse.json({ success: true })
}
