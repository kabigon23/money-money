import { NextRequest, NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance();

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

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const symbolsRaw = searchParams.get('symbols')
    const symbols = symbolsRaw ? symbolsRaw.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0) : []

    try {
        const promises: Promise<any>[] = [yahooFinance.quote('USDKRW=X')]
        if (symbols.length > 0) {
            promises.unshift(yahooFinance.quote(symbols))
        }

        const resultsRaw = await Promise.all(promises)
        const priceResults = symbols.length > 0 ? resultsRaw[0] : []
        const exchangeRateResult = symbols.length > 0 ? resultsRaw[1] : resultsRaw[0]
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

        const exchangeRate = (exchangeRateResult as any)?.regularMarketPrice || 1350

        return NextResponse.json({ prices: results, exchangeRate })
    } catch (error: any) {
        console.error('Yahoo Finance Error:', error)
        return NextResponse.json({ error: 'Failed to fetch market data', details: error.message }, { status: 500 })
    }
}
