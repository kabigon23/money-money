import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

export async function GET() {
    const results: Record<string, any> = {}

    // 1. yahoo-finance2 라이브러리 직접 테스트
    try {
        const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })
        const quote = await yf.quote('AAPL')
        results.yahoo_finance2 = {
            ok: true,
            price: quote.regularMarketPrice,
            symbol: quote.symbol,
        }
    } catch (e: any) {
        results.yahoo_finance2 = {
            ok: false,
            error: e.message,
            name: e.name,
            stack: e.stack?.slice(0, 600),
        }
    }

    // 2. Yahoo Finance 직접 fetch 테스트 (라이브러리 없이)
    try {
        const res = await fetch(
            'https://query2.finance.yahoo.com/v8/finance/quote?symbols=AAPL',
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            }
        )
        const text = await res.text()
        const isJson = text.trim().startsWith('{') || text.trim().startsWith('[')
        results.direct_fetch = {
            ok: res.ok,
            status: res.status,
            isJson,
            preview: text.slice(0, 300),
        }
    } catch (e: any) {
        results.direct_fetch = { ok: false, error: e.message }
    }

    // 3. Yahoo Finance v7 endpoint 테스트
    try {
        const res = await fetch(
            'https://query1.finance.yahoo.com/v7/finance/quote?symbols=AAPL',
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Accept': 'application/json',
                },
            }
        )
        results.v7_fetch = {
            ok: res.ok,
            status: res.status,
            preview: (await res.text()).slice(0, 200),
        }
    } catch (e: any) {
        results.v7_fetch = { ok: false, error: e.message }
    }

    // 4. 환경 정보
    results.env = {
        NODE_VERSION: process.version,
        VERCEL: process.env.VERCEL ?? 'not set',
        VERCEL_REGION: process.env.VERCEL_REGION ?? 'not set',
    }

    return NextResponse.json(results, { status: 200 })
}
