import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { redis } from '@/lib/redis'
import { createSession } from '@/lib/session'

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json()

        if (!username || !password) {
            return NextResponse.json({ error: '아이디와 비밀번호를 입력하세요.' }, { status: 400 })
        }

        // Look up credential by username
        const credJson = await redis.get(`credential:${username}`)
        if (!credJson) {
            return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
        }

        const cred = JSON.parse(credJson)
        const isValid = await bcrypt.compare(password, cred.hashedPassword)
        if (!isValid) {
            return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
        }

        // Fetch user info
        const userJson = await redis.get(`user:${cred.id}`)
        if (!userJson) {
            return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 })
        }
        const user = JSON.parse(userJson)

        // Create session
        const token = await createSession(cred.id)

        const response = NextResponse.json({ user })
        response.cookies.set('session_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        })
        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
    }
}
