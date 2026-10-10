import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { requireUser } from '@/lib/api-auth'
import { parseBody, categoriesBodySchema } from '@/lib/schemas'

const getCategoriesKey = (userId: string) => `categories:${userId}`

export async function GET() {
    const auth = await requireUser()
    if ('error' in auth) return auth.error

    try {
        const data = await redis.get(getCategoriesKey(auth.user.id))
        return NextResponse.json(data ? JSON.parse(data) : [])
    } catch (error) {
        console.error('[categories] GET error:', error)
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireUser()
    if ('error' in auth) return auth.error

    try {
        const parsed = await parseBody(request, categoriesBodySchema)
        if ('error' in parsed) return parsed.error
        await redis.set(getCategoriesKey(auth.user.id), JSON.stringify(parsed.data))
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[categories] POST error:', error)
        return NextResponse.json({ error: 'Failed to save categories' }, { status: 500 })
    }
}
