import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { redis } from '@/lib/redis'

// PUT: 로그인된 유저가 자신의 비밀번호를 변경 (현재 비밀번호 확인 필요)
export async function PUT(request: Request) {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value

    if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const userId = await getSession(token)
    if (!userId) return NextResponse.json({ error: '세션이 만료되었습니다.' }, { status: 401 })

    const userJson = await redis.get(`user:${userId}`)
    if (!userJson) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    const user = JSON.parse(userJson)

    const { currentPassword, newPassword } = await request.json()

    // Verify current password
    const credJson = await redis.get(`credential:${user.username}`)
    if (!credJson) return NextResponse.json({ error: '자격증명을 찾을 수 없습니다.' }, { status: 404 })
    const cred = JSON.parse(credJson)

    const isValid = await bcrypt.compare(currentPassword, cred.hashedPassword)
    if (!isValid) return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 401 })

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await redis.set(`credential:${user.username}`, JSON.stringify({ ...cred, hashedPassword }))

    return NextResponse.json({ success: true })
}
