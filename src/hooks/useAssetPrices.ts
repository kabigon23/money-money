import { useState, useEffect, useCallback } from 'react'
import { Asset, PriceInfo } from '@/types'
import { MarketService } from '@/services/market'

export function useAssetPrices(assets: Asset[]) {
    const [prices, setPrices] = useState<Record<string, PriceInfo>>({})
    const [exchangeRate, setExchangeRate] = useState<number>(1350)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const fetchPrices = useCallback(async () => {

        setLoading(true)
        try {
            const symbols = assets.map(a => ({ symbol: a.symbol, exchange: a.exchange }))
            const { prices: newPrices, exchangeRate: newRate } = await MarketService.getPrices(symbols)

            setPrices(newPrices)
            setExchangeRate(newRate)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch prices or exchange rate'))
        } finally {
            setLoading(false)
        }
    }, [assets])

    useEffect(() => {
        fetchPrices()

        const interval = setInterval(fetchPrices, 60000)
        return () => clearInterval(interval)
    }, [fetchPrices])

    return { prices, exchangeRate, loading, error, refresh: fetchPrices }
}
