import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { getSession } from './session'
import { redis } from './redis'
import type { User } from './auth'

type AuthResult = { user: User } | { error: NextResponse }

/** 세션 쿠키로 현재 로그인한 유저를 조회한다. 인증 실패 시 401 응답을 error로 반환. */
export async function requireUser(): Promise<AuthResult> {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value
    if (!token) return { error: NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 }) }

    const userId = await getSession(token)
    if (!userId) return { error: NextResponse.json({ error: '세션이 만료되었습니다.' }, { status: 401 }) }

    const userJson = await redis.get(`user:${userId}`)
    if (!userJson) return { error: NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 401 }) }

    return { user: JSON.parse(userJson) as User }
}

/** requireUser + 관리자 권한 검사. 권한 없으면 403. */
export async function requireAdmin(): Promise<AuthResult> {
    const result = await requireUser()
    if ('error' in result) return result
    if (result.user.role !== 'ADMIN') {
        return { error: NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 }) }
    }
    return result
}

/** 로그인한 유저 본인의 비밀번호가 맞는지 확인한다 (관리자 재확인용). */
export async function verifyUserPassword(username: string, password: unknown): Promise<boolean> {
    if (typeof password !== 'string' || !password) return false
    const credJson = await redis.get(`credential:${username}`)
    if (!credJson) return false
    const cred = JSON.parse(credJson)
    return bcrypt.compare(password, cred.hashedPassword)
}
