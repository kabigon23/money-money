'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, Role } from '@/lib/auth'

interface AuthContextType {
    user: User | null
    users: User[]
    login: (username: string, password: string) => Promise<boolean>
    logout: () => void
    updatePassword: (userId: string, newPassword: string, adminPassword: string) => Promise<boolean>
    verifyPassword: (password: string) => Promise<boolean>
    updateUserInfo: (userId: string, data: { nickname?: string, role?: Role }, adminPassword?: string) => Promise<boolean>
    createUser: (userData: User, password: string, adminPassword: string) => Promise<boolean>
    deleteUser: (userId: string, adminPassword: string) => Promise<boolean>
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Auto-seed and load session on mount
    useEffect(() => {
        async function init() {
            // Seed initial users if not yet done
            try {
                await fetch('/api/auth/seed', { method: 'POST' })
            } catch (e) {
                console.warn('Seed failed:', e)
            }

            // Restore session from cookie
            try {
                const res = await fetch('/api/auth/me', { credentials: 'include' })
                if (res.ok) {
                    const data = await res.json()
                    setUser(data.user)

                    // If admin, also load user list
                    if (data.user?.role === 'ADMIN') {
                        loadUsers()
                    }
                }
            } catch (e) {
                console.warn('Session check failed:', e)
            } finally {
                setIsLoading(false)
            }
        }
        init()
    }, [])

    const loadUsers = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/users', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setUsers(data.users || [])
            }
        } catch (e) {
            console.warn('Failed to load users:', e)
        }
    }, [])

    // Load users list whenever user becomes admin
    useEffect(() => {
        if (user?.role === 'ADMIN') {
            loadUsers()
        }
    }, [user, loadUsers])

    const login = async (username: string, password: string): Promise<boolean> => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
        })

        if (res.ok) {
            const data = await res.json()
            setUser(data.user)
            return true
        }
        return false
    }

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        setUser(null)
        setUsers([])
    }

    const verifyPassword = async (password: string): Promise<boolean> => {
        const res = await fetch('/api/auth/verify-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ password }),
        })
        if (!res.ok) return false
        const data = await res.json()
        return data.valid === true
    }

    const updatePassword = async (userId: string, newPassword: string, adminPassword: string): Promise<boolean> => {
        const res = await fetch('/api/auth/users/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ userId, newPassword, adminPassword }),
        })
        if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || '비밀번호 변경 실패')
        }
        return true
    }

    const updateUserInfo = async (userId: string, data: { nickname?: string, role?: Role }, adminPassword?: string): Promise<boolean> => {
        const res = await fetch(`/api/auth/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ ...data, adminPassword }),
        })
        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || '사용자 정보 수정 실패')
        }
        const updated = await res.json()
        setUsers(prev => prev.map(u => u.id === userId ? updated.user : u))
        if (user?.id === userId) setUser(updated.user)
        return true
    }

    const createUser = async (userData: User, password: string, adminPassword: string): Promise<boolean> => {
        const res = await fetch('/api/auth/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ userData, password, adminPassword }),
        })
        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || '사용자 생성 실패')
        }
        const created = await res.json()
        setUsers(prev => [...prev, created.user])
        return true
    }

    const deleteUser = async (userId: string, adminPassword: string): Promise<boolean> => {
        const res = await fetch(`/api/auth/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ adminPassword }),
        })
        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || '사용자 삭제 실패')
        }
        setUsers(prev => prev.filter(u => u.id !== userId))
        if (user?.id === userId) logout()
        return true
    }

    return (
        <AuthContext.Provider value={{ user, users, login, logout, updatePassword, verifyPassword, updateUserInfo, createUser, deleteUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
