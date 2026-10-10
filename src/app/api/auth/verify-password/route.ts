import { NextResponse } from 'next/server'
import { requireUser, verifyUserPassword } from '@/lib/api-auth'

// POST: verify the logged-in user's password (used for admin confirmation dialogs)
export async function POST(request: Request) {
    const auth = await requireUser()
    if ('error' in auth) return NextResponse.json({ valid: false }, { status: 401 })

    const { password } = await request.json().catch(() => ({ password: undefined }))
    return NextResponse.json({ valid: await verifyUserPassword(auth.user.username, password) })
}
