import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json({ error: 'UserId is required' }, { status: 400 })
        }

        // Delete all keys associated with this user
        // Using pipeline for efficiency (though only 3 keys)
        const pipeline = redis.pipeline()
        pipeline.del(`assets:${userId}`)
        pipeline.del(`categories:${userId}`)
        pipeline.del(`tags:${userId}`)
        await pipeline.exec()

        return NextResponse.json({ success: true, message: `Data for user ${userId} wiped` })
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to wipe user data', details: error.message }, { status: 500 })
    }
}
