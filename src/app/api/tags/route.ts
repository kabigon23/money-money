import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { requireUser } from '@/lib/api-auth'
import { parseBody, tagsBodySchema } from '@/lib/schemas'

const getTagsKey = (userId: string) => `tags:${userId}`

export async function GET() {
    const auth = await requireUser()
    if ('error' in auth) return auth.error

    try {
        const data = await redis.get(getTagsKey(auth.user.id))
        return NextResponse.json(data ? JSON.parse(data) : [])
    } catch (error) {
        console.error('[tags] GET error:', error)
        return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireUser()
    if ('error' in auth) return auth.error

    try {
        const parsed = await parseBody(request, tagsBodySchema)
        if ('error' in parsed) return parsed.error
        await redis.set(getTagsKey(auth.user.id), JSON.stringify(parsed.data))
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[tags] POST error:', error)
        return NextResponse.json({ error: 'Failed to save tags' }, { status: 500 })
    }
}
