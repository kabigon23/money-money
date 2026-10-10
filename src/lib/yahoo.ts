/** yahoo-finance2 quote 응답 중 이 앱이 사용하는 필드 */
export interface YfQuote {
    symbol: string
    quoteType?: string
    marketState?: string
    regularMarketPrice: number
    regularMarketChange?: number
    regularMarketChangePercent?: number
    preMarketPrice?: number
    preMarketChange?: number
    preMarketChangePercent?: number
    postMarketPrice?: number
    postMarketChange?: number
    postMarketChangePercent?: number
}
