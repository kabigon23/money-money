import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { Tag } from '@/types'

const getTagsKey = (userId: string) => `tags:${userId}`

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'UserId is required' }, { status: 400 })
        }

        const data = await redis.get(getTagsKey(userId))
        const tags = data ? JSON.parse(data) : []
        return NextResponse.json(tags)
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch tags', details: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'UserId is required' }, { status: 400 })
        }

        const tags = await request.json()
        await redis.set(getTagsKey(userId), JSON.stringify(tags))
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to save tags', details: error.message }, { status: 500 })
    }
}
