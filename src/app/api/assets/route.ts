import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { requireUser } from '@/lib/api-auth'
import { parseBody, assetsBodySchema } from '@/lib/schemas'

const getAssetsKey = (userId: string) => `assets:${userId}`

export async function GET() {
    const auth = await requireUser()
    if ('error' in auth) return auth.error

    try {
        const data = await redis.get(getAssetsKey(auth.user.id))
        return NextResponse.json(data ? JSON.parse(data) : [])
    } catch (error) {
        console.error('[assets] GET error:', error)
        return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireUser()
    if ('error' in auth) return auth.error

    try {
        const parsed = await parseBody(request, assetsBodySchema)
        if ('error' in parsed) return parsed.error
        await redis.set(getAssetsKey(auth.user.id), JSON.stringify(parsed.data))
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[assets] POST error:', error)
        return NextResponse.json({ error: 'Failed to save assets' }, { status: 500 })
    }
}
