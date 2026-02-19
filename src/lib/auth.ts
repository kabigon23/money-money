export type Role = 'ADMIN' | 'USER'

export interface User {
    id: string
    username: string
    name: string
    nickname: string
    role: Role
}

export const MOCK_USERS = [
    { id: 'admin-1', username: 'admin', password: '1234', name: '관리자', nickname: '최고관리자', role: 'ADMIN' as Role },
    { id: 'user-1', username: 'ezidol', password: '5678', name: 'ezidol', nickname: '이지돌', role: 'USER' as Role },
]
