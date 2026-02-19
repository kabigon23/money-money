'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, MOCK_USERS } from '@/lib/auth'

interface AuthContextType {
    user: User | null
    users: User[]
    login: (username: string, password: string) => Promise<boolean>
    logout: () => void
    updatePassword: (userId: string, newPassword: string) => Promise<boolean>
    deleteUser: (userId: string) => Promise<boolean>
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const savedUser = localStorage.getItem('auth_user')
        const savedUsersList = localStorage.getItem('auth_users_list')
        const savedCreds = localStorage.getItem('auth_credentials')

        if (savedUsersList) {
            let loadedUsers = JSON.parse(savedUsersList)
            // Migration: Add missing fields if they don't exist
            let migrated = false
            loadedUsers = loadedUsers.map((u: any) => {
                const mockMatch = MOCK_USERS.find(m => m.id === u.id)
                if (!u.nickname || !u.username) {
                    migrated = true
                    return { ...u, nickname: u.nickname || mockMatch?.nickname || u.name, username: u.username || mockMatch?.username || u.name.toLowerCase() }
                }
                return u
            })
            setUsers(loadedUsers)
            if (migrated) {
                localStorage.setItem('auth_users_list', JSON.stringify(loadedUsers))
            }
        } else {
            const initialUsers = MOCK_USERS.map(({ password, ...u }) => ({ ...u }))
            setUsers(initialUsers)
            localStorage.setItem('auth_users_list', JSON.stringify(initialUsers))

            if (!savedCreds) {
                const initialCreds = MOCK_USERS.map(({ id, username, password }) => ({ id, username, password }))
                localStorage.setItem('auth_credentials', JSON.stringify(initialCreds))
            }
        }

        if (savedUser) {
            setUser(JSON.parse(savedUser))
        }
        setIsLoading(false)
    }, [])

    const login = async (username: string, password: string): Promise<boolean> => {
        const savedCreds = JSON.parse(localStorage.getItem('auth_credentials') || '[]')
        const foundCred = savedCreds.find((u: any) => u.username === username && u.password === password)

        if (foundCred) {
            const allUsers = JSON.parse(localStorage.getItem('auth_users_list') || '[]')
            const foundUser = allUsers.find((u: User) => u.id === foundCred.id)

            if (foundUser) {
                setUser(foundUser)
                localStorage.setItem('auth_user', JSON.stringify(foundUser))
                return true
            }
        }
        return false
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('auth_user')
    }

    const updatePassword = async (userId: string, newPassword: string): Promise<boolean> => {
        const savedCreds = JSON.parse(localStorage.getItem('auth_credentials') || '[]')
        const updatedCreds = savedCreds.map((u: any) =>
            u.id === userId ? { ...u, password: newPassword } : u
        )
        localStorage.setItem('auth_credentials', JSON.stringify(updatedCreds))
        return true
    }

    const deleteUser = async (userId: string): Promise<boolean> => {
        const updatedUsersList = users.filter(u => u.id !== userId)
        setUsers(updatedUsersList)
        localStorage.setItem('auth_users_list', JSON.stringify(updatedUsersList))

        const savedCreds = JSON.parse(localStorage.getItem('auth_credentials') || '[]')
        const updatedCreds = savedCreds.filter((u: any) => u.id !== userId)
        localStorage.setItem('auth_credentials', JSON.stringify(updatedCreds))

        if (user?.id === userId) {
            logout()
        }
        return true
    }

    return (
        <AuthContext.Provider value={{ user, users, login, logout, updatePassword, deleteUser, isLoading }}>
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
