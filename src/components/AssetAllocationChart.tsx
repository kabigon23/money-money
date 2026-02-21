'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Asset, Category, Tag } from '@/types'

interface AssetAllocationChartProps {
    assets: Asset[]
    tags: Tag[]
    prices: Record<string, any>
    baseCurrency: 'KRW' | 'USD'
    exchangeRate: number
}

const renderCustomLegend = (props: any) => {
    const { payload } = props
    return (
        <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2 px-2">
            {payload.map((entry: any, index: number) => (
                <li key={`legend-${index}`} className="flex items-center gap-1.5 text-xs">
                    <span
                        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-slate-700 font-medium">{entry.value}</span>
                    <span className="text-slate-400">
                        {((entry.payload?.percent || 0) * 100).toFixed(1)}%
                    </span>
                </li>
            ))}
        </ul>
    )
}

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.05) return null // 5% 이하는 라벨 숨김

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fontWeight="bold"
        >
            {`${(percent * 100).toFixed(1)}%`}
        </text>
    )
}

export function AssetAllocationChart({ assets, tags, prices, baseCurrency, exchangeRate }: AssetAllocationChartProps) {
    const getPriceInBase = (price: number, assetExchange: 'US' | 'KR' | 'CRYPTO') => {
        if (baseCurrency === 'KRW') {
            return (assetExchange === 'US' || assetExchange === 'CRYPTO') ? price * exchangeRate : price
        } else {
            return assetExchange === 'KR' ? price / exchangeRate : price
        }
    }

    const tagData = tags.map(tag => {
        const totalValueForTag = assets
            .filter(asset => asset.tagId === tag.id)
            .reduce((sum, asset) => {
                const price = prices[asset.symbol]?.currentPrice || 0
                return sum + (asset.quantity * getPriceInBase(price, asset.exchange))
            }, 0)

        return {
            name: tag.name,
            value: totalValueForTag,
            color: tag.color
        }
    }).filter(item => item.value > 0)

    const noTagValue = assets
        .filter(asset => !asset.tagId)
        .reduce((sum, asset) => {
            const price = prices[asset.symbol]?.currentPrice || 0
            return sum + (asset.quantity * getPriceInBase(price, asset.exchange))
        }, 0)

    if (noTagValue > 0) {
        tagData.push({ name: '기타 (태그 없음)', value: noTagValue, color: '#94A3B8' })
    }

    if (tagData.length === 0) {
        return (
            <div className="h-40 flex items-center justify-center text-muted-foreground italic text-sm border-2 border-dashed rounded-xl">
                태그가 달린 자산을 등록하면 차트가 표시됩니다.
            </div>
        )
    }

    const total = tagData.reduce((sum, d) => sum + d.value, 0)
    const dataWithPercent = tagData.map(d => ({ ...d, percent: d.value / total }))

    return (
        <div className="w-full">
            <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={dataWithPercent}
                            cx="50%"
                            cy="50%"
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
                                <Cell key={`cell-${index}`} fill={entry.color} />
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
                        <Legend content={renderCustomLegend} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
