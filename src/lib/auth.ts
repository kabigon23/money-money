export type Role = 'ADMIN' | 'USER'

export interface User {
    id: string
    username: string
    nickname: string
    role: Role
}
