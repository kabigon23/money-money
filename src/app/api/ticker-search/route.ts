import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const includeIndex = searchParams.get('includeIndex') === 'true'

    if (!query || query.trim().length < 1) {
        return NextResponse.json([])
    }

    try {
        const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0&enableFuzzyQuery=true&enableNavLinks=false`
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json',
            },
            next: { revalidate: 0 }
        })

        if (!res.ok) {
            return NextResponse.json([])
        }

        const data = await res.json()
        const quotes = data?.quotes || []

        const allowedTypes = ['EQUITY', 'ETF', 'CRYPTOCURRENCY', 'MUTUALFUND']
        if (includeIndex) allowedTypes.push('INDEX', 'FUTURE')

        const results = quotes
            .filter((q: any) => q.symbol && allowedTypes.includes(q.quoteType))
            .map((q: any) => ({
                symbol: q.symbol,
                name: q.shortname || q.longname || q.symbol,
                exchange: q.exchange || '',
                type: q.quoteType,
            }))

        return NextResponse.json(results)
    } catch (error) {
        return NextResponse.json([])
    }
}
