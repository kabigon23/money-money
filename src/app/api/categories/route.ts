import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { Category } from '@/types'

const getCategoriesKey = (userId: string) => `categories:${userId}`

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'UserId is required' }, { status: 400 })
        }

        const data = await redis.get(getCategoriesKey(userId))
        const categories = data ? JSON.parse(data) : []
        return NextResponse.json(categories)
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch categories', details: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'UserId is required' }, { status: 400 })
        }

        const categories = await request.json()
        await redis.set(getCategoriesKey(userId), JSON.stringify(categories))
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to save categories', details: error.message }, { status: 500 })
    }
}
