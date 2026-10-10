import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, verifyUserPassword } from '@/lib/api-auth'
import { isSafeUserId, wipeUserData } from '@/lib/user-data'

export async function POST(request: NextRequest) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error

    try {
        const { userId, adminPassword } = await request.json()

        if (typeof userId !== 'string' || !isSafeUserId(userId)) {
            return NextResponse.json({ error: 'Valid userId is required' }, { status: 400 })
        }

        if (!(await verifyUserPassword(auth.user.username, adminPassword))) {
            return NextResponse.json({ error: '관리자 비밀번호가 올바르지 않습니다.' }, { status: 401 })
        }

        await wipeUserData(userId)

        return NextResponse.json({ success: true, message: `Data for user ${userId} wiped` })
    } catch (error) {
        console.error('[wipe-user] error:', error)
        return NextResponse.json({ error: 'Failed to wipe user data' }, { status: 500 })
    }
}
