import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { redis } from '@/lib/redis'

export async function POST(request: Request) {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value

    if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const requesterId = await getSession(token)
    if (!requesterId) return NextResponse.json({ error: '세션이 만료되었습니다.' }, { status: 401 })

    const requesterJson = await redis.get(`user:${requesterId}`)
    if (!requesterJson) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })

    const requester = JSON.parse(requesterJson)
    if (requester.role !== 'ADMIN') return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const { userData, password, adminPassword } = await request.json()

    // Verify admin password
    const adminCredJson = await redis.get(`credential:${requester.username}`)
    if (!adminCredJson) return NextResponse.json({ error: '관리자 인증 실패' }, { status: 401 })
    const adminCred = JSON.parse(adminCredJson)
    const isValid = await bcrypt.compare(adminPassword, adminCred.hashedPassword)
    if (!isValid) return NextResponse.json({ error: '관리자 비밀번호가 올바르지 않습니다.' }, { status: 401 })

    // Check if username exists
    const existingCred = await redis.get(`credential:${userData.username}`)
    if (existingCred) return NextResponse.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 409 })

    // Hash password and store
    const hashedPassword = await bcrypt.hash(password, 10)
    const newCred = { id: userData.id, username: userData.username, hashedPassword }
    const newUser = { id: userData.id, username: userData.username, nickname: userData.nickname, role: userData.role }

    await redis.set(`credential:${userData.username}`, JSON.stringify(newCred))
    await redis.set(`user:${userData.id}`, JSON.stringify(newUser))
    await redis.sadd('users:list', userData.id)

    return NextResponse.json({ user: newUser })
}
