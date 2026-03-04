'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from "@/components/ui/badge"
import { PasswordResetDialog } from '@/components/PasswordResetDialog'
import { UserEditDialog } from '@/components/UserEditDialog'
import { UserAddDialog } from '@/components/UserAddDialog'
import {
    Users,
    ShieldCheck,
    Activity,
    LogOut,
    Key,
    Settings2,
    Crown,
    UserCircle2,
} from 'lucide-react'

export default function AdminPage() {
    const { user, users, logout, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'ADMIN')) {
            router.push('/login')
        }
    }, [user, isLoading, router])

    if (isLoading || !user || user.role !== 'ADMIN') return null

    const adminCount = users.filter(u => u.role === 'ADMIN').length
    const userCount = users.length
    const regularCount = userCount - adminCount

    return (
        <div className="min-h-screen bg-[#070710] font-[family-name:var(--font-geist-sans)] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-950/20 rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-8">

                {/* ── Header ── */}
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#070710] animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                                System Admin
                            </h1>
                            <p className="text-sm text-white/40 font-medium mt-0.5">
                                {user.nickname} 님 — 계정 관리 및 시스템 설정
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={logout}
                        className="gap-2 rounded-xl border border-white/10 text-white/50 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all duration-200"
                    >
                        <LogOut className="w-4 h-4" />
                        로그아웃
                    </Button>
                </header>

                {/* ── Stats Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Users */}
                    <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-xl p-6 flex items-center gap-5 relative overflow-hidden group hover:border-indigo-500/30 hover:bg-white/6 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
                            <Users className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">총 사용자</p>
                            <p className="text-4xl font-black text-white mt-0.5">{userCount}</p>
                        </div>
                    </div>

                    {/* Admin Count */}
                    <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-xl p-6 flex items-center gap-5 relative overflow-hidden group hover:border-violet-500/30 hover:bg-white/6 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                            <Crown className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">관리계정</p>
                            <p className="text-4xl font-black text-violet-400 mt-0.5">{adminCount}</p>
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="rounded-2xl border border-emerald-500/20 bg-white/4 backdrop-blur-xl p-6 flex items-center gap-5 relative overflow-hidden group hover:border-emerald-500/40 hover:bg-white/6 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <Activity className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">서버 상태</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-2xl font-black text-emerald-400">ACTIVE</p>
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── User Table Card ── */}
                <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-xl overflow-hidden">
                    {/* Table Header */}
                    <div className="flex items-center justify-between px-8 py-6 border-b border-white/8 bg-gradient-to-r from-indigo-600/10 via-violet-600/5 to-transparent">
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">User Management</h2>
                            <p className="text-sm text-white/40 mt-0.5">전체 계정 리스트 및 권한 관리</p>
                        </div>
                        <UserAddDialog />
                    </div>

                    {/* Column Headers */}
                    <div className="grid grid-cols-[2fr_1.2fr_0.8fr_auto] px-8 py-3 border-b border-white/5">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/30">사용자</span>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/30">닉네임</span>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/30">권한</span>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/30 text-right">작업</span>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-white/5">
                        {users.map((u) => {
                            const isAdmin = u.role === 'ADMIN'
                            const initials = (u.nickname || 'U').substring(0, 2).toUpperCase()
                            return (
                                <div
                                    key={u.id}
                                    className="grid grid-cols-[2fr_1.2fr_0.8fr_auto] items-center px-8 py-4 hover:bg-white/4 transition-colors duration-200 group"
                                >
                                    {/* Username + Avatar */}
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${isAdmin
                                            ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20'
                                            : 'bg-white/8 text-white/60'
                                            }`}>
                                            {initials}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{u.username}</p>
                                            {u.id === user?.id && (
                                                <p className="text-[10px] text-indigo-400 font-semibold">나의 계정</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Nickname */}
                                    <p className="text-sm text-white/50 font-medium">{u.nickname}</p>

                                    {/* Role Badge */}
                                    <div>
                                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full ${isAdmin
                                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                            : 'bg-white/8 text-white/40 border border-white/10'
                                            }`}>
                                            {isAdmin && <Crown className="w-2.5 h-2.5" />}
                                            {u.role}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 justify-end">
                                        <PasswordResetDialog
                                            userId={u.id}
                                            userName={u.nickname}
                                            isAdminSelf={u.id === user?.id}
                                            trigger={
                                                <button
                                                    title="비밀번호 변경"
                                                    className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-amber-400 hover:border-amber-500/30 hover:bg-amber-500/10 transition-all duration-200"
                                                >
                                                    <Key className="w-4 h-4" />
                                                </button>
                                            }
                                        />
                                        <UserEditDialog
                                            user={u}
                                            isCurrentUser={user?.id === u.id}
                                            trigger={
                                                <button
                                                    title="사용자 설정"
                                                    className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-all duration-200"
                                                >
                                                    <Settings2 className="w-4 h-4" />
                                                </button>
                                            }
                                        />
                                    </div>
                                </div>
                            )
                        })}

                        {users.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <UserCircle2 className="w-12 h-12 text-white/15" />
                                <p className="text-white/30 text-sm font-medium">등록된 사용자가 없습니다</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 border-t border-white/5 flex items-center justify-between">
                        <p className="text-[11px] text-white/25 font-medium">
                            총 {userCount}명 · 관리자 {adminCount}명 · 일반 {regularCount}명
                        </p>
                        <p className="text-[11px] text-white/20 font-medium font-mono">
                            SYSTEM ADMIN CONSOLE
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}
