import { Asset, Category, Tag, PriceInfo } from '@/types'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { AssetDialog } from './AssetDialog'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

interface MobileAssetCardProps {
    asset: Asset
    currentPrice: number
    priceChange?: { change: number; changePercent: number }
    priceInfo?: PriceInfo
    valuation: number
    categoryName: string
    tag?: Tag
    avgPrice?: number
    onSave: (data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'> | Asset) => Promise<void>
    onDelete: (id: string) => Promise<void>
    categories: Category[]
    tags: Tag[]
    isUSDNative: boolean
    formatCurrency: (value: number) => string
}

export function MobileAssetCard({
    asset,
    currentPrice,
    priceChange,
    priceInfo,
    valuation,
    categoryName,
    tag,
    avgPrice,
    onSave,
    onDelete,
    categories,
    tags,
    isUSDNative,
    formatCurrency
}: MobileAssetCardProps) {
    return (
        <Card className="mb-4 overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="px-4 py-2.5">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-primary">
                                {asset.exchange === 'KR' ? asset.name : asset.symbol}
                            </span>
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                {asset.exchange}
                            </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground font-medium">
                            {asset.exchange === 'KR' ? asset.symbol : asset.name}
                        </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant="secondary" className="text-[10px] h-5">
                            {categoryName}
                        </Badge>
                        {tag && (
                            <Badge
                                className="text-[10px] h-5 text-white border-none"
                                style={{ backgroundColor: tag.color }}
                            >
                                {tag.name}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-dashed border-muted my-1">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">보유 수량</span>
                        <span className="font-mono font-medium">{asset.quantity.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">현재가</span>
                        {/* 세션 배지 */}
                        {asset.exchange === 'US' && priceInfo?.marketSession && priceInfo.marketSession !== 'REGULAR' && (
                            <span className={`text-[10px] font-black self-end px-1.5 py-0.5 rounded mb-0.5 ${priceInfo.marketSession === 'PRE' ? 'bg-violet-500/15 text-violet-500'
                                : priceInfo.marketSession === 'POST' ? 'bg-orange-500/15 text-orange-500'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                {priceInfo.marketSession === 'PRE' ? '프리장' : priceInfo.marketSession === 'POST' ? '에프터장' : '장마감'}
                            </span>
                        )}
                        <span className="font-mono font-medium">
                            {(asset.exchange === 'CASH_KRW' || asset.exchange === 'CASH_USD') ? (
                                <span className="text-xs text-muted-foreground italic">
                                    {asset.exchange === 'CASH_KRW' ? '원화 현금' : '달러 현금'}
                                </span>
                            ) : (
                                <>
                                    {isUSDNative ? '$' : ''}
                                    {currentPrice.toLocaleString(undefined, {
                                        minimumFractionDigits: asset.exchange === 'CRYPTO' ? 2 : 2,
                                        maximumFractionDigits: asset.exchange === 'CRYPTO' ? 2 : 2
                                    })}
                                    {asset.exchange === 'KR' ? '원' : ''}
                                </>
                            )}
                        </span>
                        {priceChange && (
                            <span className={`text-xs font-bold flex items-center justify-end gap-0.5 mt-0.5 ${priceChange.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {priceChange.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {priceChange.change >= 0 ? '+' : ''}{priceChange.changePercent.toFixed(2)}%
                            </span>
                        )}
                        {/* 장외일 때 정규장 종가 */}
                        {asset.exchange === 'US' && priceInfo?.marketSession && priceInfo.marketSession !== 'REGULAR' && priceInfo.regularPrice && (
                            <span className="text-[10px] text-muted-foreground">
                                종가 ${priceInfo.regularPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        )}
                    </div>
                </div>

                {/* 평단가 일낙 (currentPrice와 avgPrice 모두 있어야 표시) */}
                {avgPrice && avgPrice > 0 && currentPrice > 0 && !['CASH_KRW', 'CASH_USD'].includes(asset.exchange) && (() => {
                    const avgStr = (asset.exchange === 'US' || asset.exchange === 'CRYPTO')
                        ? `$${avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `${Math.round(avgPrice).toLocaleString()}원`
                    const pct = ((currentPrice - avgPrice) / avgPrice) * 100
                    return (
                        <div className="flex items-center justify-between px-1 py-1.5 bg-amber-50 rounded-lg border border-amber-100 text-xs">
                            <span className="text-amber-600 font-semibold">평단가 {avgStr}</span>
                            <span className={`font-black ${pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                            </span>
                        </div>
                    )
                })()}

                <div className="flex justify-between items-center mt-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">평가 가치</span>
                        <span className="font-bold text-xl text-primary">{formatCurrency(valuation)}</span>
                    </div>

                    <div className="flex gap-1">
                        <AssetDialog
                            onSave={onSave}
                            categories={categories}
                            tags={tags}
                            initialAsset={asset}
                            trigger={
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            }
                        />
                        <DeleteConfirmDialog
                            trigger={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            }
                            title={`'${asset.exchange === 'KR' ? asset.name : asset.symbol}' 종목을 삭제할까요?`}
                            description="삭제된 종목과 거래 내역은 복구할 수 없습니다."
                            onConfirm={() => onDelete(asset.id)}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
