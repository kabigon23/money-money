import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { requireUser } from '@/lib/api-auth'
import { parseBody, tagCombosBodySchema } from '@/lib/schemas'

const getKey = (userId: string) => `tag_combos:${userId}`

export async function GET() {
    const auth = await requireUser()
    if ('error' in auth) return auth.error

    const data = await redis.get(getKey(auth.user.id))
    return NextResponse.json(data ? JSON.parse(data) : [])
}

export async function POST(request: NextRequest) {
    const auth = await requireUser()
    if ('error' in auth) return auth.error

    const parsed = await parseBody(request, tagCombosBodySchema)
    if ('error' in parsed) return parsed.error

    await redis.set(getKey(auth.user.id), JSON.stringify(parsed.data))
    return NextResponse.json({ success: true })
}
