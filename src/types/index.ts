export type Exchange = 'US' | 'KR'

export interface Category {
    id: string
    name: string
    description?: string
}

export interface Tag {
    id: string
    name: string
    color: string
}

export interface Asset {
    id: string
    symbol: string
    name: string
    quantity: number
    exchange: Exchange
    categoryId: string
    tagId: string | null
    createdAt: number
    updatedAt: number
}

export interface PriceInfo {
    symbol: string
    currentPrice: number
    change: number
    changePercent: number
    lastUpdated: number
}

export interface AssetWithPrice extends Asset {
    priceInfo?: PriceInfo
}

export interface PortfolioSummary {
    totalValue: number
    totalProfit: number
    totalProfitPercent: number
    assetsByCategory: Record<string, number>
    assetsByTag: Record<string, number>
}
