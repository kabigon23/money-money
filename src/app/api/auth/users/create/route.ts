import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { redis } from '@/lib/redis'
import { requireAdmin, verifyUserPassword } from '@/lib/api-auth'
import { createUserBodySchema, parseBody } from '@/lib/schemas'
import type { User } from '@/lib/auth'

export async function POST(request: Request) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error

    const parsed = await parseBody(request, createUserBodySchema)
    if ('error' in parsed) return parsed.error
    const { userData, password, adminPassword } = parsed.data

    if (!(await verifyUserPassword(auth.user.username, adminPassword))) {
        return NextResponse.json({ error: '관리자 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    if (await redis.get(`credential:${userData.username}`)) {
        return NextResponse.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 409 })
    }

    // id는 클라이언트 값을 신뢰하지 않고 서버에서 생성한다 (기존 유저 레코드 덮어쓰기 방지)
    const newUser: User = { id: uuidv4(), username: userData.username, nickname: userData.nickname, role: userData.role }
    const hashedPassword = await bcrypt.hash(password, 10)

    await redis.set(`credential:${newUser.username}`, JSON.stringify({ id: newUser.id, username: newUser.username, hashedPassword }))
    await redis.set(`user:${newUser.id}`, JSON.stringify(newUser))
    await redis.sadd('users:list', newUser.id)

    return NextResponse.json({ user: newUser })
}
