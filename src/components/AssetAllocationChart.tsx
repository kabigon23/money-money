'use client'

import { useState, useEffect, useRef } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Asset, Tag } from '@/types'
import { Plus, X } from 'lucide-react'

interface AssetAllocationChartProps {
    assets: Asset[]
    tags: Tag[]
    prices: Record<string, any>
    baseCurrency: 'KRW' | 'USD'
    exchangeRate: number
}

interface Combo {
    id: string
    tagNames: string[]
}

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    if (percent < 0.05) return null
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
            {`${(percent * 100).toFixed(1)}%`}
        </text>
    )
}

export function AssetAllocationChart({ assets, tags, prices, baseCurrency, exchangeRate }: AssetAllocationChartProps) {
    const [combos, setCombos] = useState<Combo[]>([])
    const [activeId, setActiveId] = useState<string | null>(null)
    const isFirstLoad = useRef(true)
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Redis에서 불러오기
    useEffect(() => {
        fetch('/api/tag-combos')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setCombos(data)
            })
            .catch(() => { })
    }, [])

    // 변경 시 Redis에 자동 저장 (디바운스 0.8초 — 초기 로드는 제외)
    useEffect(() => {
        if (isFirstLoad.current) {
            isFirstLoad.current = false
            return
        }
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => {
            fetch('/api/tag-combos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(combos),
            }).catch(() => { })
        }, 800)
        return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
    }, [combos])

    const isCashExchange = (ex: string) => ex === 'CASH_KRW' || ex === 'CASH_USD'

    const getPriceInBase = (price: number, assetExchange: string) => {
        if (baseCurrency === 'KRW') {
            return (assetExchange === 'US' || assetExchange === 'CRYPTO' || assetExchange === 'CASH_USD') ? price * exchangeRate : price
        } else {
            return (assetExchange === 'KR' || assetExchange === 'CASH_KRW') ? price / exchangeRate : price
        }
    }

    const tagData = tags.map(tag => {
        const value = assets
            .filter(a => a.tagId === tag.id)
            .reduce((sum, a) => {
                const price = isCashExchange(a.exchange) ? 1 : (prices[a.symbol]?.currentPrice || 0)
                return sum + a.quantity * getPriceInBase(price, a.exchange)
            }, 0)
        return { name: tag.name, value, color: tag.color }
    }).filter(d => d.value > 0)

    const noTagValue = assets
        .filter(a => !a.tagId)
        .reduce((sum, a) => {
            const price = isCashExchange(a.exchange) ? 1 : (prices[a.symbol]?.currentPrice || 0)
            return sum + a.quantity * getPriceInBase(price, a.exchange)
        }, 0)

    if (noTagValue > 0) tagData.push({ name: '기타 (태그 없음)', value: noTagValue, color: '#94A3B8' })

    if (tagData.length === 0) {
        return (
            <div className="h-40 flex items-center justify-center text-muted-foreground italic text-sm border-2 border-dashed rounded-xl">
                태그가 달린 자산을 등록하면 차트가 표시됩니다.
            </div>
        )
    }

    const total = tagData.reduce((sum, d) => sum + d.value, 0)
    const dataWithPercent = tagData.map(d => ({ ...d, percent: d.value / total }))

    const toggleTagInActive = (name: string) => {
        if (!activeId) return
        setCombos(prev => prev.map(c => {
            if (c.id !== activeId) return c
            const has = c.tagNames.includes(name)
            return { ...c, tagNames: has ? c.tagNames.filter(n => n !== name) : [...c.tagNames, name] }
        }))
    }

    const addCombo = () => {
        const id = Date.now().toString()
        setCombos(prev => [...prev, { id, tagNames: [] }])
        setActiveId(id)
    }

    const removeCombo = (id: string) => {
        setCombos(prev => prev.filter(c => c.id !== id))
        if (activeId === id) setActiveId(null)
    }

    const activeTagNames = new Set(combos.find(c => c.id === activeId)?.tagNames ?? [])
    const highlightedNames = new Set(combos.flatMap(c => c.tagNames))

    const renderLegend = () => (
        <ul className="flex flex-wrap justify-center gap-x-2 gap-y-1 mt-2 px-2">
            {dataWithPercent.map((entry, index) => {
                const isInActive = activeTagNames.has(entry.name)
                const isInAny = highlightedNames.has(entry.name)
                return (
                    <li
                        key={`legend-${index}`}
                        onClick={() => activeId && toggleTagInActive(entry.name)}
                        className={`flex items-center gap-1.5 text-xs rounded-md px-1.5 py-0.5 transition-all select-none
                            ${activeId ? 'cursor-pointer' : 'cursor-default'}
                            ${isInActive ? 'ring-2 bg-slate-100 font-semibold' : (activeId && isInAny) ? 'opacity-60' : 'hover:bg-slate-50'}`}
                        title={activeId ? '클릭하여 선택/해제' : ''}
                    >
                        <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-slate-700">{entry.name}</span>
                        <span className="text-slate-400">{(entry.percent * 100).toFixed(1)}%</span>
                        {isInActive && <Plus className="w-2.5 h-2.5 text-slate-500" />}
                    </li>
                )
            })}
        </ul>
    )

    return (
        <div className="w-full">
            <div className="h-[240px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={dataWithPercent}
                            cx="50%"
                            cy="52%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            labelLine={false}
                            label={renderCustomLabel}
                            animationBegin={0}
                            animationDuration={1000}
                        >
                            {dataWithPercent.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    opacity={activeId ? (activeTagNames.has(entry.name) ? 1 : 0.3) : 1}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '13px' }}
                            formatter={(value: any, name: any, props: any) => {
                                if (typeof value !== 'number') return value
                                const pct = `${((props.payload.percent || 0) * 100).toFixed(1)}%`
                                const formatted = baseCurrency === 'KRW'
                                    ? `${Math.round(value).toLocaleString()}원`
                                    : `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                return [`${formatted} (${pct})`, name]
                            }}
                        />
                        <Legend content={renderLegend} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* 합산 그룹 목록 */}
            <div className="mt-3 space-y-2">
                {combos.map(combo => {
                    const isActive = combo.id === activeId
                    const items = dataWithPercent.filter(d => combo.tagNames.includes(d.name))
                    const combined = items.reduce((sum, d) => sum + d.percent, 0)

                    // 현재 카테고리에 해당하는 태그가 없으면 렌더링 스킵 (데이터는 유지됨)
                    if (combo.tagNames.length > 0 && items.length === 0) return null

                    return (
                        <div
                            key={combo.id}
                            onClick={() => setActiveId(isActive ? null : combo.id)}
                            className={`flex items-center justify-between rounded-xl border px-3 py-2 cursor-pointer transition-all
                                ${isActive ? 'border-primary bg-primary/5 shadow-sm' : 'bg-slate-50 hover:bg-slate-100'}`}
                        >
                            <div className="flex items-center gap-1.5 flex-wrap min-h-[20px]">
                                {combo.tagNames.length === 0 ? (
                                    <span className="text-xs text-muted-foreground italic">
                                        {isActive ? '위 레전드에서 태그를 클릭하여 추가하세요' : '태그 없음'}
                                    </span>
                                ) : (
                                    items.map((item, i) => (
                                        <span key={item.name} className="flex items-center gap-1">
                                            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-xs font-medium text-slate-700">{item.name}</span>
                                            {i < items.length - 1 && <span className="text-slate-400 text-xs font-bold">+</span>}
                                        </span>
                                    ))
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                {combo.tagNames.length >= 2 && (
                                    <span className="text-sm font-black text-primary">
                                        {(combined * 100).toFixed(1)}%
                                    </span>
                                )}
                                {combo.tagNames.length === 1 && (
                                    <span className="text-xs text-muted-foreground">태그 더 추가</span>
                                )}
                                <button
                                    onClick={e => { e.stopPropagation(); removeCombo(combo.id) }}
                                    className="text-slate-400 hover:text-red-400 transition-colors"
                                    title="그룹 삭제"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )
                })}

                <button
                    onClick={addCombo}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    새 합산 추가
                </button>
            </div>
        </div>
    )
}
