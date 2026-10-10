import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { requireUser } from '@/lib/api-auth'

// snapshot:{userId}:{date}:{currency}:{categoryId}:{type}
// type: 'stock' | 'crypto'
const getSnapshotKey = (userId: string, date: string, currency: string, categoryId: string, type: string) =>
  `snapshot:${userId}:${date}:${currency}:${categoryId}:${type}`

export async function GET(request: NextRequest) {
  const auth = await requireUser()
  if ('error' in auth) return auth.error
  const userId = auth.user.id

  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const currency = searchParams.get('currency')
    const categoryId = searchParams.get('categoryId')
    const type = searchParams.get('type') ?? 'stock'

    if (!date || !currency || !categoryId) {
      return NextResponse.json({ error: 'Missing required params' }, { status: 400 })
    }

    const key = getSnapshotKey(userId, date, currency, categoryId, type)
    const value = await redis.get(key)

    return NextResponse.json({ value: value ? parseFloat(value) : null })
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Failed to get snapshot', details }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser()
  if ('error' in auth) return auth.error
  const userId = auth.user.id

  try {
    const { date, currency, categoryId, value, type = 'stock' } = await request.json()

    if (!date || !currency || !categoryId || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const key = getSnapshotKey(userId, date, currency, categoryId, type)
    // 당일 기준 24시간 TTL
    await redis.set(key, String(value), 'EX', 86400)

    return NextResponse.json({ success: true })
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Failed to save snapshot', details }, { status: 500 })
  }
}
