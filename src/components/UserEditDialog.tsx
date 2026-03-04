'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Settings2, ShieldAlert, Lock, Trash2, Save, Crown,
    DatabaseZap, AlertTriangle, Loader2, ChevronLeft
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { User, Role } from '@/lib/auth'

interface UserEditDialogProps {
    user: User
    trigger?: React.ReactNode
    isCurrentUser: boolean
}

type Panel = 'MAIN' | 'DELETE' | 'ROLE_PROMOTE' | 'WIPE'

export function UserEditDialog({ user: targetUser, trigger, isCurrentUser }: UserEditDialogProps) {
    const { updateUserInfo, deleteUser } = useAuth()
    const [open, setOpen] = useState(false)

    const [nickname, setNickname] = useState(targetUser.nickname || '')
    const [role, setRole] = useState<Role>(targetUser.role)

    const [panel, setPanel] = useState<Panel>('MAIN')
    const [adminPassword, setAdminPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [wipeSuccess, setWipeSuccess] = useState(false)

    // ── Actions ──────────────────────────────────────────────
    const handleSaveInfo = async () => {
        setLoading(true)
        try {
            if (role === 'ADMIN' && targetUser.role !== 'ADMIN') {
                setPanel('ROLE_PROMOTE')
                setLoading(false)
                return
            }
            await updateUserInfo(targetUser.id, { nickname, role })
            setOpen(false)
        } catch {
            setError('정보 수정 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const handleRoleUpdateWithAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setError('')
        try {
            await updateUserInfo(targetUser.id, { nickname, role: 'ADMIN' }, adminPassword)
            setOpen(false)
        } catch (err: any) {
            setError(err.message || '인증 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setError('')
        try {
            await deleteUser(targetUser.id, adminPassword)
            setOpen(false)
        } catch (err: any) {
            setError(err.message || '삭제 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const handleWipeData = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setError('')
        try {
            // Verify admin password first via verifyPassword concept, then wipe
            const res = await fetch('/api/auth/verify-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ password: adminPassword }),
            })
            const data = await res.json()
            if (!data.valid) {
                setError('관리자 비밀번호가 올바르지 않습니다.')
                setLoading(false)
                return
            }
            const wipeRes = await fetch('/api/admin/wipe-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ userId: targetUser.id }),
            })
            if (!wipeRes.ok) throw new Error('데이터 초기화 실패')
            setWipeSuccess(true)
        } catch (err: any) {
            setError(err.message || '데이터 초기화 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const resetStates = () => {
        setNickname(targetUser.nickname || '')
        setRole(targetUser.role)
        setPanel('MAIN')
        setAdminPassword(''); setError('')
        setWipeSuccess(false)
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen) resetStates()
    }

    // ── Shared styles ─────────────────────────────────────────
    const inputClass = "bg-white/6 border-white/10 text-white placeholder:text-white/20 focus:border-indigo-500/60 focus:ring-indigo-500/20 rounded-xl h-10"
    const labelClass = "text-xs font-bold text-white/50 uppercase tracking-wider"
    const backBtn = (onClick: () => void) => (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white/40 hover:text-white/70 hover:bg-white/6 transition-all duration-200"
        >
            <ChevronLeft className="w-4 h-4" /> 뒤로
        </button>
    )

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <button className="p-2 rounded-xl text-white/40 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
                        <Settings2 className="w-4 h-4" />
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#0f0f1c] border-white/10 text-white shadow-2xl shadow-black/60 p-0 overflow-hidden">

                {/* Header */}
                <div className="relative px-7 pt-7 pb-5 border-b border-white/8">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-violet-600/5 to-transparent pointer-events-none" />
                    <DialogHeader className="relative">
                        <div className="flex items-center gap-3 mb-1">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${targetUser.role === 'ADMIN' ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white' : 'bg-white/10 text-white/60'}`}>
                                {(targetUser.nickname || 'U').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black text-white">{targetUser.nickname}</DialogTitle>
                                <p className="text-xs text-white/35 font-mono">@{targetUser.username}</p>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* ── MAIN Panel ── */}
                {panel === 'MAIN' && (
                    <div className="px-7 py-6 space-y-5">
                        <div className="space-y-2">
                            <Label className={labelClass}>아이디 (변경 불가)</Label>
                            <Input value={targetUser.username} disabled className="bg-white/4 border-white/8 text-white/35 font-mono rounded-xl h-10 cursor-not-allowed" />
                        </div>
                        <div className="space-y-2">
                            <Label className={labelClass}>닉네임</Label>
                            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-2">
                            <Label className={labelClass}>권한</Label>
                            <Select value={role} onValueChange={(v) => setRole(v as Role)} disabled={isCurrentUser}>
                                <SelectTrigger className={`${inputClass} ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                                    <SelectItem value="USER" className="focus:bg-white/10">USER — 일반 사용자</SelectItem>
                                    <SelectItem value="ADMIN" className="focus:bg-indigo-500/20 focus:text-indigo-200">ADMIN — 관리자</SelectItem>
                                </SelectContent>
                            </Select>
                            {isCurrentUser && <p className="text-[10px] text-white/25">본인의 권한은 변경할 수 없습니다.</p>}
                        </div>

                        {error && <p className="text-sm text-red-400 font-semibold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}

                        <div className="flex items-center justify-between pt-2">
                            {/* Left: Danger actions */}
                            {!isCurrentUser && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setPanel('DELETE'); setAdminPassword(''); setError('') }}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400/70 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> 계정 삭제
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setPanel('WIPE'); setAdminPassword(''); setError(''); setWipeSuccess(false) }}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-orange-400/70 hover:text-orange-400 hover:bg-orange-500/10 border border-transparent hover:border-orange-500/20 transition-all duration-200"
                                    >
                                        <DatabaseZap className="w-3.5 h-3.5" /> 데이터 초기화
                                    </button>
                                </div>
                            )}
                            {isCurrentUser && <div />}

                            {/* Right: Save */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white/40 hover:text-white/70 hover:bg-white/6 transition-all duration-200"
                                >
                                    취소
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveInfo}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    저장
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── DELETE Panel ── */}
                {panel === 'DELETE' && (
                    <form onSubmit={handleDeleteUser} className="px-7 py-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="p-4 rounded-xl border border-red-500/25 bg-red-500/8 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-red-300">계정 영구 삭제</p>
                                <p className="text-xs text-red-400/70 mt-0.5">
                                    <span className="font-bold text-red-300">{targetUser.nickname}</span> 계정이 완전히 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className={labelClass}>관리자 비밀번호 확인</Label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                                <Input type="password" placeholder="관리자 비밀번호" className={`pl-10 ${inputClass}`} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} autoFocus />
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-400 font-semibold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}
                        <div className="flex justify-between">
                            {backBtn(() => resetStates())}
                            <button type="submit" disabled={!adminPassword || loading} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-500/20 text-red-300 text-sm font-bold border border-red-500/30 hover:bg-red-500/30 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                영구 삭제 확인
                            </button>
                        </div>
                    </form>
                )}

                {/* ── ROLE PROMOTE Panel ── */}
                {panel === 'ROLE_PROMOTE' && (
                    <form onSubmit={handleRoleUpdateWithAuth} className="px-7 py-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="p-4 rounded-xl border border-violet-500/25 bg-violet-500/8 flex items-start gap-3">
                            <Crown className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-violet-300">관리자 권한 부여</p>
                                <p className="text-xs text-violet-400/70 mt-0.5">
                                    <span className="font-bold text-violet-300">{targetUser.nickname}</span> 에게 시스템 전체 관리 권한을 부여합니다.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className={labelClass}>관리자 비밀번호 확인</Label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                                <Input type="password" placeholder="관리자 비밀번호" className={`pl-10 ${inputClass}`} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} autoFocus />
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-400 font-semibold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}
                        <div className="flex justify-between">
                            {backBtn(() => resetStates())}
                            <button type="submit" disabled={!adminPassword || loading} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                                권한 승격 승인
                            </button>
                        </div>
                    </form>
                )}

                {/* ── WIPE Panel ── */}
                {panel === 'WIPE' && !wipeSuccess && (
                    <form onSubmit={handleWipeData} className="px-7 py-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="p-4 rounded-xl border border-orange-500/25 bg-orange-500/8 flex items-start gap-3">
                            <DatabaseZap className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-orange-300">사용자 데이터 초기화</p>
                                <p className="text-xs text-orange-400/70 mt-0.5">
                                    <span className="font-bold text-orange-300">{targetUser.nickname}</span> 의 자산·카테고리·태그 데이터가 모두 삭제됩니다. 계정은 유지됩니다.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className={labelClass}>관리자 비밀번호 확인</Label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                                <Input type="password" placeholder="관리자 비밀번호" className={`pl-10 ${inputClass}`} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} autoFocus />
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-400 font-semibold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}
                        <div className="flex justify-between">
                            {backBtn(() => resetStates())}
                            <button type="submit" disabled={!adminPassword || loading} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-orange-500/20 text-orange-300 text-sm font-bold border border-orange-500/30 hover:bg-orange-500/30 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DatabaseZap className="w-4 h-4" />}
                                데이터 초기화 실행
                            </button>
                        </div>
                    </form>
                )}

                {panel === 'WIPE' && wipeSuccess && (
                    <div className="px-7 py-10 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                            <DatabaseZap className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div className="text-center">
                            <p className="font-black text-white">초기화 완료</p>
                            <p className="text-sm text-white/40 mt-1">{targetUser.nickname} 님의 데이터가 초기화되었습니다.</p>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="mt-2 px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200"
                        >
                            확인
                        </button>
                    </div>
                )}

            </DialogContent>
        </Dialog>
    )
}
