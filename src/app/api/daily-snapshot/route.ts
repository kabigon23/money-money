import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import YahooFinance from 'yahoo-finance2'
import { Asset } from '@/types'

const yahooFinance = new YahooFinance()

// Redis Key 형식: asset-daily:{userId}:{date}:{symbol}
// date: KST 기준 YYYY-MM-DD
const getDailyKey = (userId: string, date: string, symbol: string) =>
  `asset-daily:${userId}:${date}:${symbol}`

// 당일 이미 기록했는지 확인하는 락(lock) 키
const getDailyLockKey = (userId: string, date: string) =>
  `asset-daily-lock:${userId}:${date}`

// KST 기준 오늘 날짜 (YYYY-MM-DD)
function getKSTDateString(timestamp?: number): string {
  const date = timestamp ? new Date(timestamp) : new Date()
  // KST = UTC + 9h
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

// 현재 KST 시간이 09:30 ~ 09:40 사이인지 확인
function isInSnapshotWindow(): boolean {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const hhmm = kst.getUTCHours() * 60 + kst.getUTCMinutes()
  return hhmm >= 9 * 60 + 30 && hhmm < 9 * 60 + 40
}

// Yahoo Finance에서 가격 조회 (prices API route와 동일한 로직)
async function fetchPricesForAssets(assets: Asset[]): Promise<{
  prices: Record<string, number>,   // symbol → 현재가(원본 통화)
  exchangeRate: number
}> {
  const tradableAssets = assets.filter(a =>
    a.exchange !== 'CASH_KRW' && a.exchange !== 'CASH_USD'
  )
  const symbols = [...new Set(tradableAssets.map(a => a.symbol))]

  try {
    const promises: Promise<any>[] = [yahooFinance.quote('USDKRW=X')]
    if (symbols.length > 0) {
      promises.unshift(yahooFinance.quote(symbols))
    }

    const resultsRaw = await Promise.all(promises)
    const priceResults = symbols.length > 0 ? resultsRaw[0] : []
    const exchangeRateResult = symbols.length > 0 ? resultsRaw[1] : resultsRaw[0]
    const exchangeRate: number = (exchangeRateResult as any)?.regularMarketPrice || 1350

    const prices: Record<string, number> = {}
    const quotes = Array.isArray(priceResults) ? priceResults : (priceResults ? [priceResults] : [])

    quotes.forEach((quote: any) => {
      if (!quote?.symbol) return
      const marketState = quote.marketState
      let price = quote.regularMarketPrice

      if (marketState === 'PRE' && quote.preMarketPrice) {
        price = quote.preMarketPrice
      } else if ((marketState === 'POST' || marketState === 'POSTPOST') && quote.postMarketPrice) {
        price = quote.postMarketPrice
      }

      prices[quote.symbol] = price
    })

    return { prices, exchangeRate }
  } catch (e) {
    console.error('[daily-snapshot] 가격 조회 실패:', e)
    return { prices: {}, exchangeRate: 1350 }
  }
}

// 자산별 KRW, USD 평가금액 계산
function calcValuation(asset: Asset, priceMap: Record<string, number>, exchangeRate: number) {
  let rawPrice = 0

  if (asset.exchange === 'CASH_KRW') {
    // KRW 현금: quantity = 원화 금액
    return { krw: asset.quantity, usd: asset.quantity / exchangeRate }
  }
  if (asset.exchange === 'CASH_USD') {
    // USD 현금: quantity = 달러 금액
    return { krw: asset.quantity * exchangeRate, usd: asset.quantity }
  }

  rawPrice = priceMap[asset.symbol] || 0
  const quantity = asset.quantity

  if (asset.exchange === 'US' || asset.exchange === 'CRYPTO') {
    const usd = rawPrice * quantity
    return { krw: usd * exchangeRate, usd }
  } else {
    // KR
    const krw = rawPrice * quantity
    return { krw, usd: krw / exchangeRate }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET: 특정 userId의 날짜 범위 스냅샷 조회
// Query params: userId, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), symbol(optional)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const symbol = searchParams.get('symbol')

    if (!userId || !startDate || !endDate) {
      return NextResponse.json({ error: 'userId, startDate, endDate are required' }, { status: 400 })
    }

    // 날짜 범위 생성
    const dates: string[] = []
    const cursor = new Date(startDate + 'T00:00:00Z')
    const end = new Date(endDate + 'T00:00:00Z')
    while (cursor <= end) {
      dates.push(cursor.toISOString().slice(0, 10))
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }

    // Redis에서 키 일괄 조회
    const pattern = symbol
      ? dates.map(d => getDailyKey(userId, d, symbol))
      : null

    if (pattern) {
      // 특정 symbol
      const values = await redis.mget(...pattern)
      const result: Record<string, { krw: number; usd: number; recordedAt: number } | null> = {}
      dates.forEach((d, i) => {
        result[d] = values[i] ? JSON.parse(values[i]!) : null
      })
      return NextResponse.json({ symbol, data: result })
    }

    // 모든 symbol → SCAN으로 조회
    const allKeys: string[] = []
    for (const date of dates) {
      const pattern = `asset-daily:${userId}:${date}:*`
      let cursor = '0'
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
        allKeys.push(...keys)
        cursor = nextCursor
      } while (cursor !== '0')
    }

    if (allKeys.length === 0) {
      return NextResponse.json({ data: {} })
    }

    const rawValues = await redis.mget(...allKeys)
    // data[date][symbol] = { krw, usd, recordedAt }
    const data: Record<string, Record<string, { krw: number; usd: number; recordedAt: number }>> = {}

    allKeys.forEach((key, i) => {
      if (!rawValues[i]) return
      // key = asset-daily:{userId}:{date}:{symbol}
      const parts = key.split(':')
      const date = parts[2]
      const sym = parts.slice(3).join(':')  // symbol에 ':'가 있을 수 있음
      if (!data[date]) data[date] = {}
      data[date][sym] = JSON.parse(rawValues[i]!)
    })

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[daily-snapshot] GET 오류:', error)
    return NextResponse.json({ error: 'Failed to get snapshot', details: error.message }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST: 현재 자산 평가금액을 오늘 날짜로 저장
// Query params: userId (cron 호출 시), cron=true
// Body (브라우저 호출 시): { assets: Asset[] }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isCron = searchParams.get('cron') === 'true'
    const queryUserId = searchParams.get('userId')

    // Vercel Cron 인증 헤더 확인 (cron=true 일 때만)
    if (isCron) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // 현재 시간 체크: cron이 아닌 클라이언트 호출이면 09:30~09:40 창인지 확인
    // (cron 자체가 이미 09:30에 호출되므로 cron은 창 검사 생략)
    if (!isCron && !isInSnapshotWindow()) {
      return NextResponse.json({ skipped: true, reason: 'outside_window' })
    }

    const today = getKSTDateString()

    // Cron일 때: 모든 유저 또는 특정 유저 처리
    // 클라이언트 호출일 때: body에서 userId와 assets 받음
    let assetsToProcess: { userId: string; assets: Asset[] }[] = []

    if (isCron) {
      // Cron: Redis에서 모든 유저의 자산 목록을 가져옴
      let cursor = '0'
      const userIds = new Set<string>()
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'assets:*', 'COUNT', 100)
        keys.forEach(k => {
          const uid = k.replace('assets:', '')
          userIds.add(uid)
        })
        cursor = nextCursor
      } while (cursor !== '0')

      for (const uid of userIds) {
        // 특정 userId 필터 (선택적)
        if (queryUserId && uid !== queryUserId) continue

        // 당일 락 확인
        const lockKey = getDailyLockKey(uid, today)
        const alreadyDone = await redis.get(lockKey)
        if (alreadyDone) continue

        const raw = await redis.get(`assets:${uid}`)
        if (!raw) continue
        const userAssets: Asset[] = JSON.parse(raw)
        assetsToProcess.push({ userId: uid, assets: userAssets })
      }
    } else {
      // 클라이언트 호출
      const body = await request.json()
      const { userId, assets } = body as { userId: string; assets: Asset[] }

      if (!userId || !assets) {
        return NextResponse.json({ error: 'userId and assets are required' }, { status: 400 })
      }

      // 당일 락 확인
      const lockKey = getDailyLockKey(userId, today)
      const alreadyDone = await redis.get(lockKey)
      if (alreadyDone) {
        return NextResponse.json({ skipped: true, reason: 'already_recorded', date: today })
      }

      assetsToProcess.push({ userId, assets })
    }

    if (assetsToProcess.length === 0) {
      return NextResponse.json({ skipped: true, reason: 'no_users_to_process' })
    }

    // 가격 조회 (모든 유저 자산의 심볼 합산해서 한 번에 조회)
    const allAssets = assetsToProcess.flatMap(u => u.assets)
    const { prices, exchangeRate } = await fetchPricesForAssets(allAssets)

    const recordedAt = Date.now()
    const TTL = 90 * 24 * 60 * 60 // 90일

    const results: Record<string, number> = {}

    for (const { userId, assets } of assetsToProcess) {
      const pipeline = redis.pipeline()

      for (const asset of assets) {
        const { krw, usd } = calcValuation(asset, prices, exchangeRate)
        const key = getDailyKey(userId, today, asset.symbol)
        const value = JSON.stringify({ krw, usd, recordedAt })
        pipeline.set(key, value, 'EX', TTL)
      }

      // 당일 락 설정 (26시간 TTL — 자정 넘어도 안전하게)
      const lockKey = getDailyLockKey(userId, today)
      pipeline.set(lockKey, '1', 'EX', 26 * 60 * 60)

      await pipeline.exec()
      results[userId] = assets.length
    }

    return NextResponse.json({
      success: true,
      date: today,
      recordedAt,
      usersProcessed: assetsToProcess.length,
      assetCounts: results,
    })
  } catch (error: any) {
    console.error('[daily-snapshot] POST 오류:', error)
    return NextResponse.json({ error: 'Failed to save snapshot', details: error.message }, { status: 500 })
  }
}
