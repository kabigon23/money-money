import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { redis } from '@/lib/redis'

// POST: verify the logged-in user's password (used for admin confirmation dialogs)
export async function POST(request: Request) {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value

    if (!token) return NextResponse.json({ valid: false }, { status: 401 })

    const userId = await getSession(token)
    if (!userId) return NextResponse.json({ valid: false }, { status: 401 })

    const userJson = await redis.get(`user:${userId}`)
    if (!userJson) return NextResponse.json({ valid: false }, { status: 401 })
    const user = JSON.parse(userJson)

    const { password } = await request.json()
    const credJson = await redis.get(`credential:${user.username}`)
    if (!credJson) return NextResponse.json({ valid: false }, { status: 401 })

    const cred = JSON.parse(credJson)
    const isValid = await bcrypt.compare(password, cred.hashedPassword)

    return NextResponse.json({ valid: isValid })
}
