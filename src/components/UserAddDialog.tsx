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
import { UserPlus, Lock, Shield, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Role } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

export function UserAddDialog({ trigger }: { trigger?: React.ReactNode }) {
    const { createUser } = useAuth()
    const [open, setOpen] = useState(false)

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [nickname, setNickname] = useState('')
    const [role, setRole] = useState<Role>('USER')

    const [adminPassword, setAdminPassword] = useState('')
    const [step, setStep] = useState<'FORM' | 'VERIFY'>('FORM')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault()
        if (!username || !password || !nickname) {
            setError('필수 정보를 모두 입력해주세요.')
            return
        }
        if (password.length < 4) {
            setError('비밀번호는 4자 이상이어야 합니다.')
            return
        }
        setError('')
        setStep('VERIFY')
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const newUser = { id: uuidv4(), username, nickname, role }
            await createUser(newUser, password, adminPassword)
            setOpen(false)
        } catch (err: any) {
            setError(err.message || '계정 생성 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const resetStates = () => {
        setUsername(''); setPassword(''); setNickname('')
        setRole('USER'); setAdminPassword(''); setStep('FORM'); setError('')
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen) resetStates()
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                        <UserPlus className="w-4 h-4" />
                        신규 계정 추가
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#0f0f1c] border-white/10 text-white shadow-2xl shadow-black/60 p-0 overflow-hidden">
                {/* Dialog Header */}
                <div className="relative px-7 pt-7 pb-5 border-b border-white/8">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-violet-600/5 to-transparent pointer-events-none" />
                    <DialogHeader className="relative">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <UserPlus className="w-4 h-4 text-white" />
                            </div>
                            <DialogTitle className="text-lg font-black text-white">신규 계정 추가</DialogTitle>
                        </div>
                        <p className="text-sm text-white/40 ml-12">새로운 사용자를 시스템에 등록합니다</p>
                    </DialogHeader>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-2 mt-5 ml-0">
                        <div className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all duration-300 ${step === 'FORM' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                            {step === 'FORM' ? '① 정보 입력' : <><CheckCircle2 className="w-3 h-3" /> 입력 완료</>}
                        </div>
                        <ChevronRight className="w-3 h-3 text-white/20" />
                        <div className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all duration-300 ${step === 'VERIFY' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/5 text-white/25 border border-white/10'}`}>
                            ② 관리자 인증
                        </div>
                    </div>
                </div>

                {/* FORM Step */}
                {step === 'FORM' && (
                    <form onSubmit={handleNext} className="px-7 py-6 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-white/50 uppercase tracking-wider">아이디 *</Label>
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="username"
                                    autoFocus
                                    className="bg-white/6 border-white/10 text-white placeholder:text-white/20 focus:border-indigo-500/60 focus:ring-indigo-500/20 rounded-xl h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-white/50 uppercase tracking-wider">비밀번호 *</Label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="min 4 chars"
                                    className="bg-white/6 border-white/10 text-white placeholder:text-white/20 focus:border-indigo-500/60 focus:ring-indigo-500/20 rounded-xl h-10"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-white/50 uppercase tracking-wider">닉네임 *</Label>
                                <Input
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="Display Name"
                                    className="bg-white/6 border-white/10 text-white placeholder:text-white/20 focus:border-indigo-500/60 focus:ring-indigo-500/20 rounded-xl h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-white/50 uppercase tracking-wider">권한</Label>
                                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                                    <SelectTrigger className="bg-white/6 border-white/10 text-white rounded-xl h-10 focus:ring-indigo-500/20 focus:border-indigo-500/60">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                                        <SelectItem value="USER" className="focus:bg-indigo-500/20 focus:text-indigo-200">USER — 일반 사용자</SelectItem>
                                        <SelectItem value="ADMIN" className="focus:bg-violet-500/20 focus:text-violet-200">ADMIN — 관리자</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-400 font-semibold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                                {error}
                            </p>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-white/40 hover:text-white/70 hover:bg-white/6 transition-all duration-200"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                            >
                                다음 <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                )}

                {/* VERIFY Step */}
                {step === 'VERIFY' && (
                    <form onSubmit={handleCreateUser} className="px-7 py-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/8 flex items-start gap-3">
                            <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-indigo-300">관리자 승인 필요</p>
                                <p className="text-xs text-indigo-400/70 mt-0.5">
                                    <span className="font-bold text-indigo-300">{nickname}</span> 계정 생성을 승인하려면 관리자 비밀번호를 입력해주세요.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-white/50 uppercase tracking-wider">관리자 비밀번호</Label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                                <Input
                                    type="password"
                                    placeholder="관리자 비밀번호"
                                    className="pl-10 bg-white/6 border-white/10 text-white placeholder:text-white/20 focus:border-indigo-500/60 focus:ring-indigo-500/20 rounded-xl h-10"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-400 font-semibold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                                {error}
                            </p>
                        )}

                        <div className="flex justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => setStep('FORM')}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-white/40 hover:text-white/70 hover:bg-white/6 transition-all duration-200"
                            >
                                ← 뒤로
                            </button>
                            <button
                                type="submit"
                                disabled={!adminPassword || loading}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
                            >
                                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> 생성 중...</> : '계정 생성'}
                            </button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
