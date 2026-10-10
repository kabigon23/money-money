import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'

export async function GET() {
    const auth = await requireUser()
    if ('error' in auth) return NextResponse.json({ user: null }, { status: 401 })

    return NextResponse.json({ user: auth.user })
}
