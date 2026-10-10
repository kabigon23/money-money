import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { redis } from '@/lib/redis'
import type { User } from '@/lib/auth'

const MIN_PASSWORD_LENGTH = 8

// POST: 유저가 하나도 없을 때만 최초 관리자 1명을 생성한다.
// SEED_ADMIN_PASSWORD 환경변수가 없으면 아무것도 만들지 않는다.
// (SEED_ADMIN_USERNAME 으로 아이디 지정 가능, 기본값 'admin')
export async function POST() {
    try {
        const password = process.env.SEED_ADMIN_PASSWORD
        if (!password || password.length < MIN_PASSWORD_LENGTH) {
            return NextResponse.json({ error: '초기 관리자 설정이 되어 있지 않습니다.' }, { status: 503 })
        }

        if ((await redis.scard('users:list')) > 0) {
            return NextResponse.json({ message: '이미 초기화되어 있습니다.' })
        }

        // 동시 호출로 중복 생성되는 것을 방지
        const locked = await redis.set('seed:lock', '1', 'EX', 30, 'NX')
        if (!locked) {
            return NextResponse.json({ message: '초기화가 진행 중입니다.' }, { status: 409 })
        }

        const username = process.env.SEED_ADMIN_USERNAME || 'admin'
        const user: User = { id: 'admin-1', username, nickname: '최고관리자', role: 'ADMIN' }
        const hashedPassword = await bcrypt.hash(password, 10)

        await redis.set(`credential:${username}`, JSON.stringify({ id: user.id, username, hashedPassword }))
        await redis.set(`user:${user.id}`, JSON.stringify(user))
        await redis.sadd('users:list', user.id)

        return NextResponse.json({ message: '초기 관리자가 설정되었습니다.' })
    } catch (error) {
        console.error('Seed error:', error)
        return NextResponse.json({ error: '초기화 중 오류가 발생했습니다.' }, { status: 500 })
    }
}
