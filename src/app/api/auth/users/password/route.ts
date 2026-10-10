import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { redis } from '@/lib/redis'
import { requireAdmin, verifyUserPassword } from '@/lib/api-auth'
import { adminPasswordChangeBodySchema, parseBody } from '@/lib/schemas'

// PUT: 관리자가 다른 유저의 비밀번호를 변경
export async function PUT(request: Request) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error

    const parsed = await parseBody(request, adminPasswordChangeBodySchema)
    if ('error' in parsed) return parsed.error
    const { userId, newPassword, adminPassword } = parsed.data

    if (!(await verifyUserPassword(auth.user.username, adminPassword))) {
        return NextResponse.json({ error: '관리자 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

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
