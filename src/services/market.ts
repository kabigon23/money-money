import { Exchange, PriceInfo } from '@/types'

/**
 * 실시간 시세 조회를 위한 서비스 클래스
 * 실제 구현 시 Yahoo Finance, Alpha Vantage 등 외부 API를 연동합니다.
 */
export class MarketService {
    /**
     * 종목 리스트의 현재가를 조회합니다.
     */
    static async getPrices(symbols: { symbol: string; exchange: Exchange }[]): Promise<Record<string, PriceInfo>> {
        // 실제 외부 API 연동 대신 목(Mock) 데이터를 반환합니다.
        // 추후 실 연동 시 이 부분을 수정하면 됩니다.

        const results: Record<string, PriceInfo> = {}

        for (const { symbol, exchange } of symbols) {
            // 랜덤하게 가격 변동 시뮬레이션
            let mockPrice = 0
            if (exchange === 'CRYPTO') {
                // Crypto prices (e.g. BTC around $90k, ETH around $2.5k)
                const basePrices: Record<string, number> = {
                    'BTC': 95000,
                    'ETH': 27000,
                    'SOL': 180,
                }
                const base = basePrices[symbol.toUpperCase()] || 100
                mockPrice = base + (Math.random() * base * 0.05)
            } else {
                mockPrice = exchange === 'US' ? 150 + Math.random() * 50 : 50000 + Math.random() * 10000
            }

            const mockChange = (Math.random() * 4 - 2).toFixed(2)

            results[symbol] = {
                symbol,
                currentPrice: mockPrice,
                change: Number(mockChange),
                changePercent: (Number(mockChange) / (mockPrice / 100)),
                lastUpdated: Date.now()
            }
        }

        return results
    }

    static getExchangeRate(): number {
        // Mock USD/KRW exchange rate (1 USD = 1350 KRW)
        // In a real app, this would be fetched from an API
        return 1350 + (Math.random() * 10 - 5) // Slight fluctuation
    }
}
