'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Asset, Category, Tag } from '@/types'

interface AssetAllocationChartProps {
    assets: Asset[]
    tags: Tag[]
    prices: Record<string, any>
}

const COLORS = ['#0F172A', '#334155', '#475569', '#64748B', '#94A3B8', '#CBD5E1']

export function AssetAllocationChart({ assets, tags, prices }: AssetAllocationChartProps) {
    // 태그별 자산 가치 계산
    const tagData = tags.map(tag => {
        const totalValueForTag = assets
            .filter(asset => asset.tagId === tag.id)
            .reduce((sum, asset) => {
                const price = prices[asset.symbol]?.currentPrice || 0
                return sum + (asset.quantity * price)
            }, 0)

        return {
            name: tag.name,
            value: totalValueForTag,
            color: tag.color
        }
    }).filter(item => item.value > 0)

    // 태그가 없는 자산들을 "기타"로 분류
    const noTagValue = assets
        .filter(asset => !asset.tagId)
        .reduce((sum, asset) => {
            const price = prices[asset.symbol]?.currentPrice || 0
            return sum + (asset.quantity * price)
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

    return (
        <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={tagData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1000}
                    >
                        {tagData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => typeof value === 'number' ? value.toLocaleString() + '원' : value}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
