import { redis } from './redis'

// 유저 id는 'user-1' 같은 고정값이거나 uuid다. 패턴 삭제(SCAN MATCH)에 쓰이므로
// glob 문자(*, ?, [ 등)나 ':' 가 섞이면 다른 유저의 키까지 지울 수 있어 엄격히 제한한다.
const SAFE_USER_ID = /^[A-Za-z0-9_-]+$/

export function isSafeUserId(userId: string): boolean {
    return SAFE_USER_ID.test(userId)
}

async function deleteByPattern(pattern: string): Promise<void> {
    let cursor = '0'
    do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200)
        if (keys.length > 0) await redis.del(...keys)
        cursor = next
    } while (cursor !== '0')
}

/**
 * 유저가 만든 모든 데이터를 삭제한다 (계정 레코드 user:/credential:/users:list 는 유지).
 * 자산, 카테고리, 태그, 워치리스트, 태그 조합, 카테고리 스냅샷, 일일 평가금액 기록과 락.
 */
export async function wipeUserData(userId: string): Promise<void> {
    if (!isSafeUserId(userId)) throw new Error('Invalid userId')

    await redis.del(
        `assets:${userId}`,
        `categories:${userId}`,
        `tags:${userId}`,
        `watchlist:${userId}`,
        `tag_combos:${userId}`,
    )
    await Promise.all([
        deleteByPattern(`snapshot:${userId}:*`),
        deleteByPattern(`asset-daily:${userId}:*`),
        deleteByPattern(`asset-daily-lock:${userId}:*`),
    ])
}
