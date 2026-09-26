import { useState, useEffect, useCallback, useMemo } from 'react'
import { Asset, PriceInfo } from '@/types'
import { MarketService } from '@/services/market'

// 현금처럼 가격 조회 자체가 필요 없는 자산 (금은 별도 API로 조회하므로 제외)
const NON_TRADEABLE = new Set(['CASH_KRW', 'CASH_USD'])

export function useAssetPrices(assets: Asset[]) {
    const [prices, setPrices] = useState<Record<string, PriceInfo>>({})
    const [exchangeRate, setExchangeRate] = useState<number>(1350)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    // 현금은 제외, GOLD_KRX는 포함 (서버에서 별도 KRX API로 처리)
    const tradeableAssets = useMemo(
        () => assets.filter(a => !NON_TRADEABLE.has(a.exchange)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(assets.map(a => a.symbol + a.exchange))]
    )

    const fetchPrices = useCallback(async () => {
        setLoading(true)
        try {
            const symbols = tradeableAssets.map(a => ({ symbol: a.symbol, exchange: a.exchange }))
            const { prices: newPrices, exchangeRate: newRate } = await MarketService.getPrices(symbols)

            setPrices(newPrices)
            setExchangeRate(newRate)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch prices or exchange rate'))
        } finally {
            setLoading(false)
        }
    }, [tradeableAssets])

    useEffect(() => {
        fetchPrices()
        const interval = setInterval(fetchPrices, 60000)
        return () => clearInterval(interval)
    }, [fetchPrices])

    return { prices, exchangeRate, loading, error, refresh: fetchPrices }
}
