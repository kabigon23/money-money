import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

// snapshot:{userId}:{date}:{currency}:{categoryId}:{type}
// type: 'stock' | 'crypto'
const getSnapshotKey = (userId: string, date: string, currency: string, categoryId: string, type: string) =>
  `snapshot:${userId}:${date}:${currency}:${categoryId}:${type}`

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')
    const currency = searchParams.get('currency')
    const categoryId = searchParams.get('categoryId')
    const type = searchParams.get('type') ?? 'stock'

    if (!userId || !date || !currency || !categoryId) {
      return NextResponse.json({ error: 'Missing required params' }, { status: 400 })
    }

    const key = getSnapshotKey(userId, date, currency, categoryId, type)
    const value = await redis.get(key)

    return NextResponse.json({ value: value ? parseFloat(value) : null })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to get snapshot', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const { date, currency, categoryId, value, type = 'stock' } = await request.json()

    if (!date || !currency || !categoryId || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const key = getSnapshotKey(userId, date, currency, categoryId, type)
    // 당일 기준 24시간 TTL
    await redis.set(key, String(value), 'EX', 86400)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to save snapshot', details: error.message }, { status: 500 })
  }
}
