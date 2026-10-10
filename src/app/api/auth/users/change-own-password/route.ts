import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { redis } from '@/lib/redis'
import { requireUser, verifyUserPassword } from '@/lib/api-auth'
import { ownPasswordChangeBodySchema, parseBody } from '@/lib/schemas'

// PUT: 로그인된 유저가 자신의 비밀번호를 변경 (현재 비밀번호 확인 필요)
export async function PUT(request: Request) {
    const auth = await requireUser()
    if ('error' in auth) return auth.error
    const { user } = auth

    const parsed = await parseBody(request, ownPasswordChangeBodySchema)
    if ('error' in parsed) return parsed.error
    const { currentPassword, newPassword } = parsed.data

    const credJson = await redis.get(`credential:${user.username}`)
    if (!credJson) return NextResponse.json({ error: '자격증명을 찾을 수 없습니다.' }, { status: 404 })
    const cred = JSON.parse(credJson)

    if (!(await verifyUserPassword(user.username, currentPassword))) {
        return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await redis.set(`credential:${user.username}`, JSON.stringify({ ...cred, hashedPassword }))

    return NextResponse.json({ success: true })
}
