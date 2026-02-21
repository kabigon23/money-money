import { Asset, Category, Tag } from '@/types'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { AssetDialog } from './AssetDialog'

interface MobileAssetCardProps {
    asset: Asset
    currentPrice: number
    priceChange?: { change: number; changePercent: number }
    valuation: number
    categoryName: string
    tag?: Tag
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
    valuation,
    categoryName,
    tag,
    onSave,
    onDelete,
    categories,
    tags,
    isUSDNative,
    formatCurrency
}: MobileAssetCardProps) {
    return (
        <Card className="mb-4 overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-primary">{asset.symbol}</span>
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                {asset.exchange}
                            </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground font-medium">{asset.name}</span>
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

                <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-dashed border-muted my-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">보유 수량</span>
                        <span className="font-mono font-medium">{asset.quantity.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">현재가</span>
                        <span className="font-mono font-medium">
                            {isUSDNative ? '$' : ''}
                            {currentPrice.toLocaleString(undefined, {
                                minimumFractionDigits: asset.exchange === 'CRYPTO' ? 2 : 0,
                                maximumFractionDigits: asset.exchange === 'CRYPTO' ? 2 : 0
                            })}
                            {asset.exchange === 'KR' ? '원' : ''}
                        </span>
                        {priceChange && (
                            <span className={`text-xs font-bold flex items-center justify-end gap-0.5 mt-0.5 ${priceChange.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {priceChange.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {priceChange.change >= 0 ? '+' : ''}{priceChange.changePercent.toFixed(2)}%
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center mt-3">
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
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(asset.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
