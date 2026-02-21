import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { redis } from '@/lib/redis'
import { MOCK_USERS } from '@/lib/auth'

// POST: Seed initial users to Redis (safe to call multiple times - checks first)
export async function POST() {
    try {
        const existingList = await redis.smembers('users:list')
        if (existingList.length > 0) {
            return NextResponse.json({ message: '이미 초기화되어 있습니다.', count: existingList.length })
        }

        for (const mockUser of MOCK_USERS) {
            const { password, ...userInfo } = mockUser
            const hashedPassword = await bcrypt.hash(password, 10)

            const cred = { id: mockUser.id, username: mockUser.username, hashedPassword }
            await redis.set(`credential:${mockUser.username}`, JSON.stringify(cred))
            await redis.set(`user:${mockUser.id}`, JSON.stringify(userInfo))
            await redis.sadd('users:list', mockUser.id)
        }

        return NextResponse.json({ message: '초기 사용자 데이터가 설정되었습니다.', count: MOCK_USERS.length })
    } catch (error) {
        console.error('Seed error:', error)
        return NextResponse.json({ error: '초기화 중 오류가 발생했습니다.' }, { status: 500 })
    }
}
