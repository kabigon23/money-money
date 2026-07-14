import { NextRequest, NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// 미국 주식 장 구분 (EST 기준)
// Pre-market:  04:00 ~ 09:30  → KST 18:00 ~ 23:30
// Regular:     09:30 ~ 16:00  → KST 23:30 ~ 06:00+1
// After-hours: 16:00 ~ 20:00  → KST 06:00 ~ 10:00
// 한국 시간 = EST + 14시간 (EDT 기준 +13h)

function getMarketSession(quoteType: string | undefined, marketState: string | undefined): 'PRE' | 'REGULAR' | 'POST' | 'CLOSED' {
    if (quoteType !== 'EQUITY' && quoteType !== 'ETF') return 'REGULAR'
    switch (marketState) {
        case 'PRE': return 'PRE'
        case 'REGULAR': return 'REGULAR'
        case 'POST':
        case 'POSTPOST': return 'POST'
        default: return 'CLOSED'
    }
}

/** KRX 금현물 시세를 /api/gold 에서 조회하여 PriceInfo 형태로 반환 */
async function fetchGoldKrxPrice(baseUrl: string): Promise<Record<string, any>> {
    try {
        const res = await fetch(`${baseUrl}/api/gold?term=5M`, { next: { revalidate: 1800 } })
        if (!res.ok) return {}
        const data = await res.json()
        const latest = data?.latest
        if (!latest) return {}
        return {
            GOLD_KRX: {
                symbol: 'GOLD_KRX',
                currentPrice: latest.clpr,          // 원/g
                change: latest.vs,
                changePercent: latest.fltRt,
                regularPrice: latest.clpr,
                regularChange: latest.vs,
                regularChangePercent: latest.fltRt,
                preMarketPrice: null,
                preMarketChange: null,
                preMarketChangePercent: null,
                postMarketPrice: null,
                postMarketChange: null,
                postMarketChangePercent: null,
                marketSession: 'CLOSED' as const,
                lastUpdated: Date.now(),
            }
        }
    } catch {
        return {}
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const symbolsRaw = searchParams.get('symbols')
    const allSymbols = symbolsRaw ? symbolsRaw.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0) : []

    // GOLD_KRX 와 일반 심볼 분리
    const hasGold = allSymbols.includes('GOLD_KRX')
    const symbols  = allSymbols.filter(s => s !== 'GOLD_KRX')

    try {
        // Yahoo Finance 호출 (금 제외)
        const yfPromises: Promise<any>[] = [yahooFinance.quote('USDKRW=X')]
        if (symbols.length > 0) {
            yfPromises.unshift(yahooFinance.quote(symbols))
        }

        // KRX 금시세 호출 (금 있을 때만)
        const origin = request.headers.get('host')
            ? `${request.nextUrl.protocol}//${request.headers.get('host')}`
            : 'http://localhost:3000'
        const goldPromise = hasGold ? fetchGoldKrxPrice(origin) : Promise.resolve({})

        const [yfResults, goldPrices] = await Promise.all([
            Promise.all(yfPromises),
            goldPromise,
        ])

        const priceResults = symbols.length > 0 ? yfResults[0] : []
        const exchangeRateResult = symbols.length > 0 ? yfResults[1] : yfResults[0]
        const results: Record<string, any> = {}

        const quotes = Array.isArray(priceResults) ? priceResults : [priceResults]

        quotes.forEach((quote: any) => {
            if (!quote?.symbol) return

            const session = getMarketSession(quote.quoteType, quote.marketState)

            // 현재 실효 가격 결정
            // PRE: 프리장 가격 (없으면 정규장 종가 fallback)
            // POST: 에프터장 가격 (없으면 정규장 종가 fallback)
            // REGULAR / CLOSED: 정규장 가격
            let effectivePrice = quote.regularMarketPrice
            let effectiveChange = quote.regularMarketChange
            let effectiveChangePercent = quote.regularMarketChangePercent

            if (session === 'PRE' && quote.preMarketPrice) {
                effectivePrice = quote.preMarketPrice
                effectiveChange = quote.preMarketChange ?? (quote.preMarketPrice - quote.regularMarketPrice)
                effectiveChangePercent = quote.preMarketChangePercent ?? ((effectiveChange / quote.regularMarketPrice) * 100)
            } else if (session === 'POST' && quote.postMarketPrice) {
                effectivePrice = quote.postMarketPrice
                effectiveChange = quote.postMarketChange ?? (quote.postMarketPrice - quote.regularMarketPrice)
                effectiveChangePercent = quote.postMarketChangePercent ?? ((effectiveChange / quote.regularMarketPrice) * 100)
            }

            results[quote.symbol] = {
                symbol: quote.symbol,
                // 실효 가격 (현재 세션 기준)
                currentPrice: effectivePrice,
                change: effectiveChange,
                changePercent: effectiveChangePercent,
                // 정규장 가격 (항상 제공)
                regularPrice: quote.regularMarketPrice,
                regularChange: quote.regularMarketChange,
                regularChangePercent: quote.regularMarketChangePercent,
                // 프리장
                preMarketPrice: quote.preMarketPrice ?? null,
                preMarketChange: quote.preMarketChange ?? null,
                preMarketChangePercent: quote.preMarketChangePercent ?? null,
                // 에프터장
                postMarketPrice: quote.postMarketPrice ?? null,
                postMarketChange: quote.postMarketChange ?? null,
                postMarketChangePercent: quote.postMarketChangePercent ?? null,
                // 현재 세션
                marketSession: session,
                lastUpdated: Date.now()
            }
        })

        // KRX 금시세 병합
        Object.assign(results, goldPrices)

        const exchangeRate = (exchangeRateResult as any)?.regularMarketPrice || 1350

        return NextResponse.json({ prices: results, exchangeRate })
    } catch (error: any) {
        console.error('[/api/prices] Yahoo Finance Error:', {
            message: error?.message,
            name: error?.name,
            stack: error?.stack?.slice(0, 500),
            symbols: symbols,
        })
        return NextResponse.json({ error: 'Failed to fetch market data', details: error.message }, { status: 500 })
    }
}
