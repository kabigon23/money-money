import { useState, useEffect } from 'react'
import { Asset, Exchange, PriceInfo } from '@/types'
import { MarketService } from '@/services/market'

export function useAssetPrices(assets: Asset[]) {
    const [prices, setPrices] = useState<Record<string, PriceInfo>>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const fetchPrices = async () => {
        if (assets.length === 0) return

        setLoading(true)
        try {
            const symbols = assets.map(a => ({ symbol: a.symbol, exchange: a.exchange }))
            const newPrices = await MarketService.getPrices(symbols)
            setPrices(newPrices)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch prices'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPrices()

        // 1분마다 가격 갱신 (선택 사항)
        const interval = setInterval(fetchPrices, 60000)
        return () => clearInterval(interval)
    }, [assets])

    return { prices, loading, error, refresh: fetchPrices }
}
