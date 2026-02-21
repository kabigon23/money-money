import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { redis } from '@/lib/redis'

// PUT: change password
export async function PUT(request: Request) {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value

    if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const requesterId = await getSession(token)
    if (!requesterId) return NextResponse.json({ error: '세션이 만료되었습니다.' }, { status: 401 })

    const requesterJson = await redis.get(`user:${requesterId}`)
    if (!requesterJson) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    const requester = JSON.parse(requesterJson)

    if (requester.role !== 'ADMIN') return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const { userId, newPassword, adminPassword } = await request.json()

    // Verify admin password
    const adminCredJson = await redis.get(`credential:${requester.username}`)
    if (!adminCredJson) return NextResponse.json({ error: '관리자 인증 실패' }, { status: 401 })
    const adminCred = JSON.parse(adminCredJson)
    const isValid = await bcrypt.compare(adminPassword, adminCred.hashedPassword)
    if (!isValid) return NextResponse.json({ error: '관리자 비밀번호가 올바르지 않습니다.' }, { status: 401 })

    // Update password
    const targetUserJson = await redis.get(`user:${userId}`)
    if (!targetUserJson) return NextResponse.json({ error: '대상 사용자를 찾을 수 없습니다.' }, { status: 404 })
    const targetUser = JSON.parse(targetUserJson)

    const targetCredJson = await redis.get(`credential:${targetUser.username}`)
    if (!targetCredJson) return NextResponse.json({ error: '자격증명을 찾을 수 없습니다.' }, { status: 404 })
    const targetCred = JSON.parse(targetCredJson)

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await redis.set(`credential:${targetUser.username}`, JSON.stringify({ ...targetCred, hashedPassword }))

    return NextResponse.json({ success: true })
}
