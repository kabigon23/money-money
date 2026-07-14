import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Asset, PriceInfo } from '@/types'
import { MarketService } from '@/services/market'

// 가격 조회가 필요 없는 자산 타입
const NON_TRADEABLE = new Set(['CASH_KRW', 'CASH_USD', 'GOLD_KRX'])

export function useAssetPrices(assets: Asset[]) {
    const [prices, setPrices] = useState<Record<string, PriceInfo>>({})
    const [exchangeRate, setExchangeRate] = useState<number>(1350)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    // CASH/GOLD는 Yahoo Finance에 보내지 않음
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
