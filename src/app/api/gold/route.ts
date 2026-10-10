import { NextRequest, NextResponse } from 'next/server'
import { fetchGoldPrices, GoldConfigError } from '@/lib/gold'

/**
 * KRX 금시장 금 시세 조회 (공공데이터포털)
 * GET /api/gold?term=5M  (5M | 1Y | 3Y | 5Y)
 *
 * 필요 환경변수: DATA_GO_KR_SERVICE_KEY (Decoding 일반인증키)
 * 발급: https://www.data.go.kr → '금융위원회_일반상품시세정보' 검색 → 활용신청
 */
export async function GET(request: NextRequest) {
    const term = request.nextUrl.searchParams.get('term') || '5M'

    try {
        return NextResponse.json(await fetchGoldPrices(term))
    } catch (error) {
        if (error instanceof GoldConfigError) {
            return NextResponse.json(
                {
                    error: error.message,
                    guide: 'https://www.data.go.kr 에서 "금융위원회_일반상품시세정보" API 활용신청 후 .env.local에 DATA_GO_KR_SERVICE_KEY=발급받은키(Decoding) 를 추가하세요.',
                },
                { status: 503 },
            )
        }
        const message = error instanceof Error ? error.message : String(error)
        console.error('[/api/gold] 공공데이터포털 API 오류:', message)
        return NextResponse.json({ error: '금 시세 조회 실패', details: message }, { status: 502 })
    }
}
