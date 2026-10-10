import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { requireAdmin, verifyUserPassword } from '@/lib/api-auth'
import { isSafeUserId, wipeUserData } from '@/lib/user-data'
import { parseBody, updateUserBodySchema } from '@/lib/schemas'
import { z } from 'zod'

interface Params {
    params: Promise<{ userId: string }>
}

// PUT: update user info (nickname, role)
export async function PUT(request: Request, { params }: Params) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const requester = auth.user

    const { userId } = await params
    const parsed = await parseBody(request, updateUserBodySchema)
    if ('error' in parsed) return parsed.error
    const { nickname, role, adminPassword } = parsed.data

    // If promoting to admin, verify password
    if (role === 'ADMIN' && !(await verifyUserPassword(requester.username, adminPassword))) {
        return NextResponse.json({ error: '관리자 비밀번호가 올바르지 않습니다.' }, { status: 401 })
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
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const requester = auth.user

    const { userId } = await params
    const parsed = await parseBody(request, z.object({ adminPassword: z.string() }))
    if ('error' in parsed) return parsed.error

    if (!(await verifyUserPassword(requester.username, parsed.data.adminPassword))) {
        return NextResponse.json({ error: '관리자 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    const userJson = await redis.get(`user:${userId}`)
    if (!userJson) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    const user = JSON.parse(userJson)

    // 데이터를 먼저 지운다: 중간에 실패해도 계정이 남아 있어 다시 삭제를 시도할 수 있다
    if (!isSafeUserId(userId)) return NextResponse.json({ error: '잘못된 사용자 id 입니다.' }, { status: 400 })
    await wipeUserData(userId)

    const pipeline = redis.pipeline()
    pipeline.del(`user:${userId}`)
    pipeline.del(`credential:${user.username}`)
    pipeline.srem('users:list', userId)
    await pipeline.exec()

    return NextResponse.json({ success: true })
}
