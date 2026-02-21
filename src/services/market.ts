import { Exchange, PriceInfo } from '@/types'

/**
 * 실시간 시세 조회를 위한 서비스 클래스
 * 실제 구현 시 Yahoo Finance, Alpha Vantage 등 외부 API를 연동합니다.
 */
export class MarketService {
    /**
     * 종목 리스트의 현재가를 조회합니다.
     */
    static async getPrices(symbols: { symbol: string; exchange: Exchange }[]): Promise<{ prices: Record<string, PriceInfo>, exchangeRate: number }> {
        const symbolList = symbols.map(s => s.symbol).join(',')
        const query = symbolList ? `?symbols=${encodeURIComponent(symbolList)}` : ''

        try {
            const response = await fetch(`/api/prices${query}`)
            if (!response.ok) {
                throw new Error('Failed to fetch prices')
            }
            const data = await response.json()
            return {
                prices: data.prices,
                exchangeRate: data.exchangeRate
            }
        } catch (error) {
            console.error('Error fetching prices:', error)
            // Fallback to empty results if API fails
            return {
                prices: {},
                exchangeRate: 1350
            }
        }
    }

    // This is now integrated into getPrices to reduce API calls
    static async getExchangeRate(): Promise<number> {
        try {
            const response = await fetch('/api/prices?symbols=AAPL') // Just to get the rate
            const data = await response.json()
            return data.exchangeRate || 1350
        } catch {
            return 1350
        }
    }
}
