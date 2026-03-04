'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, TrendingUp, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export interface TickerResult {
    symbol: string
    name: string
    exchange: string
    type: string
}

interface TickerSearchProps {
    onSelect: (result: TickerResult) => void
    exchange: 'US' | 'KR' | 'CRYPTO'
    includeIndex?: boolean
}

// --- 인기 프리셋 종목 ---
const PRESETS: Record<'US' | 'KR' | 'CRYPTO', TickerResult[]> = {
    US: [
        { symbol: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ', type: 'ETF' },
        { symbol: 'SPY', name: 'SPDR S&P 500 ETF', exchange: 'NYSE', type: 'ETF' },
        { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', exchange: 'NYSE', type: 'ETF' },
        { symbol: 'QQQM', name: 'Invesco NASDAQ 100 ETF', exchange: 'NASDAQ', type: 'ETF' },
        { symbol: 'QLD', name: 'ProShares Ultra QQQ', exchange: 'NYSE', type: 'ETF' },
        { symbol: 'TQQQ', name: 'ProShares UltraPro QQQ', exchange: 'NASDAQ', type: 'ETF' },
        { symbol: 'SOXL', name: 'Direxion Semiconductor 3x', exchange: 'NYSE', type: 'ETF' },
        { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', type: 'EQUITY' },
        { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', type: 'EQUITY' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
        { symbol: 'IONQ', name: 'IonQ Inc.', exchange: 'NYSE', type: 'EQUITY' },
        { symbol: 'OKLO', name: 'Oklo Inc.', exchange: 'NYSE', type: 'EQUITY' },
        { symbol: 'RKLB', name: 'Rocket Lab USA', exchange: 'NASDAQ', type: 'EQUITY' },
        { symbol: 'IREN', name: 'Iris Energy Limited', exchange: 'NASDAQ', type: 'EQUITY' },
    ],
    KR: [
        { symbol: '379800.KS', name: 'KODEX 미국S&P500TR', exchange: 'KSE', type: 'ETF' },
        { symbol: '133690.KS', name: 'TIGER 미국나스닥100', exchange: 'KSE', type: 'ETF' },
        { symbol: '368590.KS', name: 'KODEX 미국나스닥100TR', exchange: 'KSE', type: 'ETF' },
        { symbol: '304940.KS', name: 'KODEX 미국S&P500(H)', exchange: 'KSE', type: 'ETF' },
        { symbol: '278530.KS', name: 'KODEX 미국나스닥100선물(H)', exchange: 'KSE', type: 'ETF' },
        { symbol: '261240.KS', name: 'KODEX 미국나스닥100레버리지', exchange: 'KSE', type: 'ETF' },
        { symbol: '396500.KS', name: 'TIGER 미국S&P500', exchange: 'KSE', type: 'ETF' },
        { symbol: '005930.KS', name: '삼성전자', exchange: 'KSE', type: 'EQUITY' },
        { symbol: '000660.KS', name: 'SK하이닉스', exchange: 'KSE', type: 'EQUITY' },
    ],
    CRYPTO: [
        { symbol: 'BTC-USD', name: 'Bitcoin', exchange: 'CCC', type: 'CRYPTOCURRENCY' },
        { symbol: 'ETH-USD', name: 'Ethereum', exchange: 'CCC', type: 'CRYPTOCURRENCY' },
        { symbol: 'BNB-USD', name: 'BNB', exchange: 'CCC', type: 'CRYPTOCURRENCY' },
        { symbol: 'SOL-USD', name: 'Solana', exchange: 'CCC', type: 'CRYPTOCURRENCY' },
        { symbol: 'XRP-USD', name: 'XRP', exchange: 'CCC', type: 'CRYPTOCURRENCY' },
        { symbol: 'DOGE-USD', name: 'Dogecoin', exchange: 'CCC', type: 'CRYPTOCURRENCY' },
        { symbol: 'ADA-USD', name: 'Cardano', exchange: 'CCC', type: 'CRYPTOCURRENCY' },
        { symbol: 'AVAX-USD', name: 'Avalanche', exchange: 'CCC', type: 'CRYPTOCURRENCY' },
        { symbol: 'DOT-USD', name: 'Polkadot', exchange: 'CCC', type: 'CRYPTOCURRENCY' },
        { symbol: 'LINK-USD', name: 'Chainlink', exchange: 'CCC', type: 'CRYPTOCURRENCY' },
    ],
}

const TYPE_COLOR: Record<string, string> = {
    ETF: 'bg-blue-100 text-blue-700',
    EQUITY: 'bg-green-100 text-green-700',
    CRYPTOCURRENCY: 'bg-orange-100 text-orange-700',
    MUTUALFUND: 'bg-purple-100 text-purple-700',
}

const TYPE_LABEL: Record<string, string> = {
    ETF: 'ETF',
    EQUITY: '주식',
    CRYPTOCURRENCY: '코인',
    MUTUALFUND: '펀드',
}

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])
    return debounced
}

export function TickerSearch({ onSelect, exchange, includeIndex }: TickerSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<TickerResult[]>([])
    const [loading, setLoading] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const debouncedQuery = useDebounce(query, 350)
    const containerRef = useRef<HTMLDivElement>(null)

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // 야후 파이낸스 검색
    useEffect(() => {
        if (debouncedQuery.length < 1) {
            setResults([])
            setShowDropdown(false)
            return
        }
        const fetchResults = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/ticker-search?q=${encodeURIComponent(debouncedQuery)}${includeIndex ? '&includeIndex=true' : ''}`)
                const data = await res.json()
                setResults(data)
                setShowDropdown(true)
            } catch {
                setResults([])
            } finally {
                setLoading(false)
            }
        }
        fetchResults()
    }, [debouncedQuery])

    const handleSelect = (item: TickerResult) => {
        onSelect(item)
        setQuery('')
        setShowDropdown(false)
    }

    const presets = PRESETS[exchange] || []
    const filteredPresets = query
        ? presets.filter(p =>
            p.symbol.toLowerCase().includes(query.toLowerCase()) ||
            p.name.toLowerCase().includes(query.toLowerCase())
        )
        : presets

    const TYPE_COLOR_MAP: Record<string, string> = {
        ...TYPE_COLOR,
        INDEX: 'bg-slate-100 text-slate-600',
        FUTURE: 'bg-yellow-100 text-yellow-700',
    }
    const TYPE_LABEL_MAP: Record<string, string> = {
        ...TYPE_LABEL,
        INDEX: '지수',
        FUTURE: '선물',
    }

    return (
        <div className="space-y-3">
            {/* 검색창 */}
            <div ref={containerRef} className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    {loading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                    {query && !loading && (
                        <button
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            onClick={() => { setQuery(''); setResults([]); setShowDropdown(false) }}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <Input
                        placeholder={
                            exchange === 'KR'
                                ? '종목코드로 검색 (예: 005930, 000660, 379800)'
                                : '종목명 또는 티커 검색 (예: 애플, AAPL, 비트코인)'
                        }
                        className="pl-9 pr-9"
                        value={query}
                        onChange={e => { setQuery(e.target.value); if (!e.target.value) setShowDropdown(false) }}
                        onFocus={() => { if (results.length > 0) setShowDropdown(true) }}
                    />
                </div>

                {/* 야후 검색 드롭다운 */}
                {showDropdown && results.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border shadow-xl overflow-hidden">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-slate-50 border-b">
                            검색 결과
                        </div>
                        <ul className="max-h-52 overflow-y-auto">
                            {results.map((item, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b last:border-0 transition-colors"
                                    onMouseDown={() => handleSelect(item)}
                                >
                                    {exchange === 'KR' ? (
                                        /* KR: 종목명 주로, 코드 보조 */
                                        <>
                                            <span className="font-bold text-sm text-slate-800 flex-1 truncate">{item.name}</span>
                                            <span className="font-mono text-xs text-slate-400 shrink-0">{item.symbol}</span>
                                        </>
                                    ) : (
                                        /* US/CRYPTO: 티커 주로, 이름 보조 */
                                        <>
                                            <span className="font-black text-sm w-24 shrink-0 text-slate-800">{item.symbol}</span>
                                            <span className="text-sm text-slate-600 flex-1 truncate">{item.name}</span>
                                        </>
                                    )}
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${TYPE_COLOR_MAP[item.type] || 'bg-slate-100 text-slate-600'}`}>
                                        {TYPE_LABEL_MAP[item.type] || item.type}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* 인기 종목 프리셋 */}
            <div>
                <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                        {query ? '프리셋 검색결과' : '인기 종목'}
                    </span>
                </div>
                {filteredPresets.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic px-1">일치하는 프리셋이 없습니다.</p>
                ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                        {filteredPresets.map((item) => (
                            <button
                                key={item.symbol}
                                type="button"
                                onClick={() => handleSelect(item)}
                                className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left shadow-sm"
                                title={exchange === 'KR' ? item.symbol : item.name}
                            >
                                {exchange === 'KR' ? (
                                    /* KR: 종목명을 크게, 코드는 숨김 */
                                    <span className="text-xs font-bold text-slate-800">{item.name}</span>
                                ) : (
                                    /* US/CRYPTO: 티커를 크게 */
                                    <span className="text-xs font-black text-slate-800">{item.symbol}</span>
                                )}
                                <span className={`text-[10px] font-semibold px-1 py-0.5 rounded ${TYPE_COLOR[item.type] || 'bg-slate-100 text-slate-500'}`}>
                                    {TYPE_LABEL[item.type] || item.type}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
