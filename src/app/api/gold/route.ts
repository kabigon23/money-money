import { NextRequest, NextResponse } from 'next/server'

/**
 * 공공데이터포털 - 금융위원회 일반상품시세정보 API
 * https://www.data.go.kr → '금융위원회_일반상품시세정보' 검색 → 활용신청
 *
 * 환경변수: DATA_GO_KR_SERVICE_KEY  (Decoding 일반인증키)
 *
 * 엔드포인트:
 *   https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo
 *
 * 주요 종목 (itmsNm 기준):
 *   '금 99.99_1kg'     - KRX 금시장 1kg 단위 현물 (clpr = 원/g)
 *   '미니금 99.99_100g' - KRX 미니금 100g 단위   (clpr = 원/g)
 */
const BASE_URL =
    'https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo'

// 조회할 KRX 금 종목명
const TARGET_ISU_NM = '금 99.99_1kg'

export interface GoldPriceRecord {
    date: number        // timestamp (ms) - 거래일 기준 (KST 00:00)
    // KRX 금시장 현물가 (원/g)
    clpr: number        // 종가 (원/g)
    vs: number          // 전일대비 (원)
    fltRt: number       // 등락률 (%)
    mkp: number         // 시가 (원/g)
    hipr: number        // 고가 (원/g)
    lopr: number        // 저가 (원/g)
    trqu: number        // 거래량 (g)
    trPrc: number       // 거래대금 (원)
}

export interface GoldPriceResponse {
    latest: GoldPriceRecord | null
    change: number          // 전일 대비 변동액 (원/g)
    changePercent: number   // 전일 대비 변동률 (%)
    history: GoldPriceRecord[]
    source: string
    updatedAt: number
}

/** YYYYMMDD 형식 날짜 문자열 생성 */
function toYYYYMMDD(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0'
    )
    return `${y}${m}${d}`
}

/** N일 전 날짜 반환 */
function daysAgo(n: number): Date {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d
}

/** raw API 아이템 → GoldPriceRecord 변환 */
function mapItem(item: any): GoldPriceRecord {
    const yyyymmdd = String(item.basDt) // 'YYYYMMDD'
    const dateTs = new Date(
        `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T00:00:00+09:00`
    ).getTime()

    return {
        date:  dateTs,
        clpr:  Number(item.clpr)   || 0,   // 원/g
        vs:    Number(item.vs)     || 0,
        fltRt: parseFloat(item.fltRt) || 0,
        mkp:   Number(item.mkp)   || 0,
        hipr:  Number(item.hipr)  || 0,
        lopr:  Number(item.lopr)  || 0,
        trqu:  Number(item.trqu)  || 0,
        trPrc: Number(item.trPrc) || 0,
    }
}

/**
 * 공공데이터 API 호출 (기간 범위)
 * beginBasDt ~ endBasDt 범위의 모든 데이터 반환
 */
async function fetchRange(
    serviceKey: string,
    beginBasDt: string,
    endBasDt: string,
    numOfRows = 500,
): Promise<any[]> {
    const params = new URLSearchParams({
        serviceKey,
        resultType: 'json',
        numOfRows:  String(numOfRows),
        pageNo:     '1',
        itmsNm:     TARGET_ISU_NM,
        beginBasDt,
        endBasDt,
    })

    const res = await fetch(`${BASE_URL}?${params}`, {
        next: { revalidate: 1800 },  // 30분 서버 캐시
    })
    if (!res.ok) throw new Error(`공공데이터포털 API 오류: ${res.status}`)

    const json = await res.json()
    const code = json?.response?.header?.resultCode
    if (code && code !== '00') {
        throw new Error(`API 에러 코드: ${code} - ${json?.response?.header?.resultMsg}`)
    }

    const items = json?.response?.body?.items?.item
    if (!items) return []
    return Array.isArray(items) ? items : [items]
}

/**
 * 공공데이터 API 호출 (특정 날짜 단건)
 * 주말/공휴일 폴백용
 */
async function fetchByDate(serviceKey: string, basDt: string): Promise<any[]> {
    const params = new URLSearchParams({
        serviceKey,
        resultType: 'json',
        numOfRows:  '10',
        pageNo:     '1',
        itmsNm:     TARGET_ISU_NM,
        basDt,
    })

    const res = await fetch(`${BASE_URL}?${params}`, {
        next: { revalidate: 1800 },
    })
    if (!res.ok) throw new Error(`공공데이터포털 API 오류: ${res.status}`)

    const json = await res.json()
    const items = json?.response?.body?.items?.item
    if (!items) return []
    return Array.isArray(items) ? items : [items]
}

/**
 * KRX 금시장 금 시세 조회 (공공데이터포털)
 * GET /api/gold?term=5M  (5M | 1Y | 3Y | 5Y)
 *
 * 필요 환경변수: DATA_GO_KR_SERVICE_KEY (Decoding 일반인증키)
 * 발급: https://www.data.go.kr → '금융위원회_일반상품시세정보' 검색 → 활용신청
 */
export async function GET(request: NextRequest) {
    const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY
    if (!serviceKey) {
        return NextResponse.json(
            {
                error:  'DATA_GO_KR_SERVICE_KEY 환경변수가 설정되지 않았습니다.',
                guide:  'https://www.data.go.kr 에서 "금융위원회_일반상품시세정보" API 활용신청 후 .env.local에 DATA_GO_KR_SERVICE_KEY=발급받은키(Decoding) 를 추가하세요.',
            },
            { status: 503 },
        )
    }

    const term = request.nextUrl.searchParams.get('term') || '5M'

    // 기간 계산
    const endDate   = new Date()
    const startDate = new Date()
    switch (term) {
        case '1Y': startDate.setFullYear(startDate.getFullYear() - 1); break
        case '3Y': startDate.setFullYear(startDate.getFullYear() - 3); break
        case '5Y': startDate.setFullYear(startDate.getFullYear() - 5); break
        default:   startDate.setMonth(startDate.getMonth() - 5);        break  // 5M
    }

    const beginBasDt = toYYYYMMDD(startDate)
    const endBasDt   = toYYYYMMDD(endDate)

    try {
        // ① 기간 범위 데이터 조회
        let items = await fetchRange(serviceKey, beginBasDt, endBasDt)

        // ② 데이터가 없으면 최근 7거래일 폴백 (주말·공휴일 대응)
        if (items.length === 0) {
            for (let offset = 1; offset <= 7; offset++) {
                const basDt  = toYYYYMMDD(daysAgo(offset))
                const result = await fetchByDate(serviceKey, basDt)
                if (result.length > 0) {
                    items = result
                    break
                }
            }
        }

        if (items.length === 0) {
            return NextResponse.json({
                latest:        null,
                change:        0,
                changePercent: 0,
                history:       [],
                source:        'data.go.kr (금융위원회_일반상품시세정보)',
                updatedAt:     Date.now(),
            } satisfies GoldPriceResponse)
        }

        // ③ 날짜 내림차순 정렬
        const sorted = [...items].sort((a, b) =>
            String(b.basDt).localeCompare(String(a.basDt))
        )

        const mapped: GoldPriceRecord[] = sorted.map(mapItem)
        const latest = mapped[0]

        return NextResponse.json({
            latest,
            change:        latest.vs,
            changePercent: latest.fltRt,
            history:       mapped,
            source:        'data.go.kr (금융위원회_일반상품시세정보)',
            updatedAt:     Date.now(),
        } satisfies GoldPriceResponse)

    } catch (error: any) {
        console.error('[/api/gold] 공공데이터포털 API 오류:', error.message)
        return NextResponse.json(
            { error: '금 시세 조회 실패', details: error.message },
            { status: 502 },
        )
    }
}
