import { NextResponse } from 'next/server'
import { z } from 'zod'

// 기존 저장 데이터가 거절되면 사용자가 저장 자체를 못 하게 되므로,
// 필수 필드만 엄격히 검사하고 나머지는 허용한다 (looseObject).

const shortString = z.string().max(200)
const finiteNumber = z.number().finite()

export const exchangeSchema = z.enum(['US', 'KR', 'CRYPTO', 'CASH_KRW', 'CASH_USD', 'GOLD_KRX'])
export const roleSchema = z.enum(['ADMIN', 'USER'])

export const assetSchema = z.looseObject({
    id: shortString.min(1),
    symbol: shortString.min(1),
    quantity: finiteNumber.nonnegative(),
    exchange: exchangeSchema,
    categoryId: shortString,
    tagId: shortString.nullish(),
    avgPrice: finiteNumber.nullish(),
    memo: z.string().max(1000).nullish(),
    history: z.array(z.looseObject({})).max(5000).optional(),
})

export const categorySchema = z.looseObject({
    id: shortString.min(1),
    name: shortString.min(1),
})

export const tagSchema = z.looseObject({
    id: shortString.min(1),
    name: shortString.min(1),
    color: shortString,
})

export const watchlistItemSchema = z.looseObject({
    symbol: shortString.min(1),
    name: shortString,
    exchange: z.enum(['US', 'KR', 'CRYPTO']),
})

export const assetsBodySchema = z.array(assetSchema).max(2000)
export const categoriesBodySchema = z.array(categorySchema).max(500)
export const tagsBodySchema = z.array(tagSchema).max(500)
export const watchlistBodySchema = z.array(watchlistItemSchema).max(500)
export const tagCombosBodySchema = z.array(z.unknown()).max(500)

// 비밀번호 정책은 UI(4자 이상)와 동일하게 맞춘다
export const passwordSchema = z.string().min(4).max(200)

export const createUserBodySchema = z.object({
    userData: z.object({
        id: shortString.min(1),
        username: shortString.min(1),
        nickname: shortString,
        role: roleSchema,
    }),
    password: passwordSchema,
    adminPassword: z.string(),
})

export const updateUserBodySchema = z.object({
    nickname: shortString.optional(),
    role: roleSchema.optional(),
    adminPassword: z.string().optional(),
})

export const adminPasswordChangeBodySchema = z.object({
    userId: shortString.min(1),
    newPassword: passwordSchema,
    adminPassword: z.string(),
})

export const ownPasswordChangeBodySchema = z.object({
    currentPassword: z.string(),
    newPassword: passwordSchema,
})

type ParseResult<T> = { data: T } | { error: NextResponse }

/** 요청 body(JSON)를 스키마로 검증한다. 실패 시 400 응답을 error로 반환. */
export async function parseBody<S extends z.ZodType>(request: Request, schema: S): Promise<ParseResult<z.infer<S>>> {
    let json: unknown
    try {
        json = await request.json()
    } catch {
        return { error: NextResponse.json({ error: '잘못된 JSON 형식입니다.' }, { status: 400 }) }
    }
    const parsed = schema.safeParse(json)
    if (!parsed.success) {
        const issue = parsed.error.issues[0]
        const path = issue.path.join('.') || 'body'
        return { error: NextResponse.json({ error: `입력값이 올바르지 않습니다: ${path} (${issue.message})` }, { status: 400 }) }
    }
    return { data: parsed.data }
}
