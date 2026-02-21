'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TickerSearch, TickerResult } from '@/components/TickerSearch'

interface WatchlistItem {
    symbol: string
    name: string
    exchange: 'US' | 'KR' | 'CRYPTO'
}

interface PriceInfo {
    currentPrice: number
    change: number
    changePercent: number
}

interface WatchlistProps {
    userId: string
}

// exchange 타입 추론 (Yahoo Finance type → app type)
function inferExchange(item: TickerResult): 'US' | 'KR' | 'CRYPTO' {
    if (item.type === 'CRYPTOCURRENCY') return 'CRYPTO'
    if (item.exchange === 'KSE' || item.exchange === 'KOE') return 'KR'
    return 'US'
}

export function Watchlist({ userId }: WatchlistProps) {
    const [items, setItems] = useState<WatchlistItem[]>([])
    const [prices, setPrices] = useState<Record<string, PriceInfo>>({})
    const [loading, setLoading] = useState(false)
    const [showSearch, setShowSearch] = useState(false)

    // 불러오기
    useEffect(() => {
        fetch('/api/watchlist', { credentials: 'include' })
            .then(r => r.json())
            .then(data => Array.isArray(data) && setItems(data))
            .catch(() => { })
    }, [userId])

    // 시세 가져오기
    const fetchPrices = useCallback(async () => {
        if (items.length === 0) return
        setLoading(true)
        try {
            const symbolStr = items.map(i => i.symbol).join(',')
            const res = await fetch(`/api/prices?symbols=${encodeURIComponent(symbolStr)}`)
            const data = await res.json()
            setPrices(data.prices || {})
        } catch { }
        finally { setLoading(false) }
    }, [items])

    useEffect(() => {
        fetchPrices()
        const interval = setInterval(fetchPrices, 60000)
        return () => clearInterval(interval)
    }, [fetchPrices])

    const persist = async (newItems: WatchlistItem[]) => {
        await fetch('/api/watchlist', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItems)
        })
    }

    const addItem = async (result: TickerResult) => {
        if (items.some(i => i.symbol === result.symbol)) return
        const newItem: WatchlistItem = {
            symbol: result.symbol,
            name: result.name,
            exchange: inferExchange(result),
        }
        const newItems = [...items, newItem]
        setItems(newItems)
        await persist(newItems)
        setShowSearch(false)
    }

    const removeItem = async (symbol: string) => {
        const newItems = items.filter(i => i.symbol !== symbol)
        setItems(newItems)
        await persist(newItems)
    }

    return (
        <div className="flex flex-col h-full">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-3">
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    onClick={() => setShowSearch(v => !v)}
                >
                    <Plus className="w-3.5 h-3.5" />
                    종목 추가
                </Button>
                <button
                    onClick={fetchPrices}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="시세 새로고침"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* 검색창 */}
            {showSearch && (
                <div className="mb-3 rounded-xl border bg-slate-50 p-3">
                    <TickerSearch
                        exchange="US"
                        includeIndex={true}
                        onSelect={addItem}
                    />
                </div>
            )}

            {/* 목록 */}
            {items.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-10 border border-dashed rounded-xl flex-1">
                    관심 종목을 추가해보세요.
                </p>
            ) : (
                <div className="space-y-2 flex-1 overflow-auto">
                    {items.map(item => {
                        const priceInfo = prices[item.symbol]
                        const isUSD = item.exchange === 'US' || item.exchange === 'CRYPTO'
                        return (
                            <div
                                key={item.symbol}
                                className="flex justify-between items-center p-3 hover:bg-muted/80 rounded-xl transition-all border bg-card shadow-sm group"
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className="font-black text-base leading-tight">{item.symbol}</span>
                                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <div className="font-bold text-base">
                                            {priceInfo ? (
                                                <>
                                                    {isUSD ? '$' : ''}
                                                    {priceInfo.currentPrice.toLocaleString(undefined, {
                                                        minimumFractionDigits: item.exchange === 'CRYPTO' ? 2 : 0,
                                                        maximumFractionDigits: item.exchange === 'CRYPTO' ? 2 : 0
                                                    })}
                                                    {!isUSD ? '원' : ''}
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">불러오는 중...</span>
                                            )}
                                        </div>
                                        {priceInfo && (
                                            <div className={`text-xs font-bold flex items-center justify-end gap-0.5 ${priceInfo.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {priceInfo.change >= 0
                                                    ? <TrendingUp className="h-3 w-3" />
                                                    : <TrendingDown className="h-3 w-3" />
                                                }
                                                {priceInfo.change >= 0 ? '+' : ''}{priceInfo.changePercent.toFixed(2)}%
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.symbol)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive ml-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                    {loading && (
                        <p className="text-xs text-center text-muted-foreground animate-pulse mt-2">
                            시세 갱신 중...
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}
