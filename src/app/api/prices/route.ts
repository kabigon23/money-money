import { NextRequest, NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance();

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const symbolsRaw = searchParams.get('symbols')

    // If symbols are provided, split them. Otherwise, empty array.
    const symbols = symbolsRaw ? symbolsRaw.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0) : []

    try {
        // symbols might contain things like "KODEX 미국나스닥100" which Yahoo Finance might not handle well directly
        // We might need to map some Korean names to their actual ticker if they aren't tickers

        // However, assuming the symbols provided are valid Yahoo tickers (e.g., 453950.KS for KODEX Nasdaq)
        // For this mock-to-real transition, let's just attempt to fetch them.

        // Also fetch USD/KRW rate
        const promises: Promise<any>[] = [yahooFinance.quote('USDKRW=X')]

        if (symbols.length > 0) {
            promises.unshift(yahooFinance.quote(symbols))
        }

        const resultsRaw = await Promise.all(promises)

        // If symbols exist, resultsRaw[0] is prices, resultsRaw[1] is rate.
        // If no symbols, resultsRaw[0] is rate.

        const priceResults = symbols.length > 0 ? resultsRaw[0] : []
        const exchangeRateResult = symbols.length > 0 ? resultsRaw[1] : resultsRaw[0]

        const results: Record<string, any> = {}

        // Handle single symbol return (yahooFinance.quote returns an array if passed an array,
        // but it's safer to handle both cases if it varies)
        const quotes = Array.isArray(priceResults) ? priceResults : [priceResults]

        quotes.forEach((quote: any) => {
            if (quote && quote.symbol) {
                results[quote.symbol] = {
                    symbol: quote.symbol,
                    currentPrice: quote.regularMarketPrice,
                    change: quote.regularMarketChange,
                    changePercent: quote.regularMarketChangePercent,
                    lastUpdated: Date.now()
                }
            }
        })

        const exchangeRate = (exchangeRateResult as any)?.regularMarketPrice || 1350

        return NextResponse.json({
            prices: results,
            exchangeRate: exchangeRate
        })
    } catch (error: any) {
        console.error('Yahoo Finance Error:', error)
        return NextResponse.json({ error: 'Failed to fetch market data', details: error.message }, { status: 500 })
    }
}
