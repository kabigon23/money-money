import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { Asset } from '@/types'

const getAssetsKey = (userId: string) => `assets:${userId}`

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'UserId is required' }, { status: 400 })
        }

        const data = await redis.get(getAssetsKey(userId))
        const assets = data ? JSON.parse(data) : []
        return NextResponse.json(assets)
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch assets', details: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'UserId is required' }, { status: 400 })
        }

        const assets = await request.json()
        await redis.set(getAssetsKey(userId), JSON.stringify(assets))
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to save assets', details: error.message }, { status: 500 })
    }
}
