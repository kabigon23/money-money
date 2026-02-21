import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { redis } from '@/lib/redis'

interface Params {
    params: Promise<{ userId: string }>
}

async function getRequester(token: string | undefined) {
    if (!token) return null
    const requesterId = await getSession(token)
    if (!requesterId) return null
    const json = await redis.get(`user:${requesterId}`)
    return json ? JSON.parse(json) : null
}

// PUT: update user info (nickname, role)
export async function PUT(request: Request, { params }: Params) {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value
    const requester = await getRequester(token)

    if (!requester || requester.role !== 'ADMIN') {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { userId } = await params
    const { nickname, role, adminPassword } = await request.json()

    // If promoting to admin, verify password
    if (role === 'ADMIN') {
        const adminCredJson = await redis.get(`credential:${requester.username}`)
        if (!adminCredJson) return NextResponse.json({ error: '관리자 인증 실패' }, { status: 401 })
        const adminCred = JSON.parse(adminCredJson)
        const isValid = await bcrypt.compare(adminPassword, adminCred.hashedPassword)
        if (!isValid) return NextResponse.json({ error: '관리자 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    const userJson = await redis.get(`user:${userId}`)
    if (!userJson) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })

    const user = JSON.parse(userJson)
    const updatedUser = {
        ...user,
        ...(nickname !== undefined ? { nickname } : {}),
        ...(role !== undefined ? { role } : {}),
    }

    await redis.set(`user:${userId}`, JSON.stringify(updatedUser))
    return NextResponse.json({ user: updatedUser })
}

// DELETE: delete user + wipe data
export async function DELETE(request: Request, { params }: Params) {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value
    const requester = await getRequester(token)

    if (!requester || requester.role !== 'ADMIN') {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { userId } = await params
    const { adminPassword } = await request.json()

    // Verify admin password
    const adminCredJson = await redis.get(`credential:${requester.username}`)
    if (!adminCredJson) return NextResponse.json({ error: '관리자 인증 실패' }, { status: 401 })
    const adminCred = JSON.parse(adminCredJson)
    const isValid = await bcrypt.compare(adminPassword, adminCred.hashedPassword)
    if (!isValid) return NextResponse.json({ error: '관리자 비밀번호가 올바르지 않습니다.' }, { status: 401 })

    const userJson = await redis.get(`user:${userId}`)
    if (!userJson) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    const user = JSON.parse(userJson)

    // Delete user data
    const pipeline = redis.pipeline()
    pipeline.del(`user:${userId}`)
    pipeline.del(`credential:${user.username}`)
    pipeline.srem('users:list', userId)
    pipeline.del(`assets:${userId}`)
    pipeline.del(`categories:${userId}`)
    pipeline.del(`tags:${userId}`)
    await pipeline.exec()

    return NextResponse.json({ success: true })
}
