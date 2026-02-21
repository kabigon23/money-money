import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { deleteSession } from '@/lib/session'

export async function POST() {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value

    if (token) {
        await deleteSession(token)
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set('session_token', '', { maxAge: 0, path: '/' })
    return response
}
