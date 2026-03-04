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
import { Key, Lock, ArrowRight, CheckCircle2, ShieldCheck, Loader2, RefreshCw, Eye, EyeOff, Copy } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface PasswordResetDialogProps {
    userId: string
    userName: string
    isAdminSelf?: boolean   // admin 자신의 비밀번호를 변경하는 경우
    trigger?: React.ReactNode
}

export function PasswordResetDialog({ userId, userName, isAdminSelf = false, trigger }: PasswordResetDialogProps) {
    const { verifyPassword, updatePassword } = useAuth()
    const [open, setOpen] = useState(false)

    // Admin-self mode states
    const [adminCurrentPw, setAdminCurrentPw] = useState('')
    const [adminNewPw, setAdminNewPw] = useState('')
    const [adminConfirmPw, setAdminConfirmPw] = useState('')
    const [showNewPw, setShowNewPw] = useState(false)
    const [showConfirmPw, setShowConfirmPw] = useState(false)

    // User-reset mode states
    const [adminPassword, setAdminPassword] = useState('')
    const [generatedPin, setGeneratedPin] = useState('')
    const [copied, setCopied] = useState(false)

    // Shared states
    const [step, setStep] = useState<'VERIFY' | 'ACTION' | 'SUCCESS'>('VERIFY')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // ── Actions ──────────────────────────────────────────────────────────────

    // [Admin-self] step1: verify current password
    const handleAdminVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setError('')
        try {
            const isValid = await verifyPassword(adminCurrentPw)
            if (isValid) setStep('ACTION')
            else setError('현재 비밀번호가 일치하지 않습니다.')
        } catch { setError('인증 중 오류가 발생했습니다.') }
        finally { setLoading(false) }
    }

    // [Admin-self] step2: change to new password
    const handleAdminChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (adminNewPw.length < 4) { setError('비밀번호는 4자 이상이어야 합니다.'); return }
        if (adminNewPw !== adminConfirmPw) { setError('새 비밀번호가 일치하지 않습니다.'); return }
        setLoading(true); setError('')
        try {
            await updatePassword(userId, adminNewPw, adminCurrentPw)
            setStep('SUCCESS')
        } catch { setError('비밀번호 변경 중 오류가 발생했습니다.') }
        finally { setLoading(false) }
    }

    // [User-reset] step1: verify admin password
    const handleVerifyAdminForReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setError('')
        try {
            const isValid = await verifyPassword(adminPassword)
            if (isValid) {
                // Generate random 6-digit PIN
                const pin = String(Math.floor(100000 + Math.random() * 900000))
                setGeneratedPin(pin)
                setStep('ACTION')
            } else {
                setError('관리자 비밀번호가 일치하지 않습니다.')
            }
        } catch { setError('인증 중 오류가 발생했습니다.') }
        finally { setLoading(false) }
    }

    // [User-reset] step2: apply the generated PIN
    const handleApplyPin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setError('')
        try {
            await updatePassword(userId, generatedPin, adminPassword)
            setStep('SUCCESS')
        } catch { setError('초기화 중 오류가 발생했습니다.') }
        finally { setLoading(false) }
    }

    const handleCopyPin = () => {
        navigator.clipboard.writeText(generatedPin)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            setTimeout(() => {
                setStep('VERIFY')
                setAdminCurrentPw(''); setAdminNewPw(''); setAdminConfirmPw('')
                setAdminPassword(''); setGeneratedPin(''); setCopied(false)
                setError(''); setShowNewPw(false); setShowConfirmPw(false)
            }, 300)
        }
    }

    // ── Styles ───────────────────────────────────────────────────────────────
    const inputClass = "bg-white/6 border-white/10 text-white placeholder:text-white/20 focus:border-indigo-500/60 focus:ring-indigo-500/20 rounded-xl h-10"
    const labelClass = "text-xs font-bold text-white/50 uppercase tracking-wider"
    const gradientBtn = (disabled: boolean, children: React.ReactNode, type: 'submit' | 'button' = 'submit') => (
        <button
            type={type}
            disabled={disabled}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-40 disabled:pointer-events-none hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
            {children}
        </button>
    )
    const ghostBtn = (onClick: () => void, label: string) => (
        <button type="button" onClick={onClick} className="px-4 py-2 rounded-xl text-sm font-semibold text-white/40 hover:text-white/70 hover:bg-white/6 transition-all duration-200">
            {label}
        </button>
    )

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <button className="p-2 rounded-xl text-white/40 hover:text-amber-400 hover:bg-amber-500/10 transition-all">
                        <Key className="w-4 h-4" />
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#0f0f1c] border-white/10 text-white shadow-2xl shadow-black/60 p-0 overflow-hidden">

                {/* Header */}
                <div className="relative px-7 pt-7 pb-5 border-b border-white/8">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-violet-600/5 to-transparent pointer-events-none" />
                    <DialogHeader className="relative">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                                <Key className="w-4 h-4 text-amber-400" />
                            </div>
                            <DialogTitle className="text-lg font-black text-white">
                                {isAdminSelf ? '내 비밀번호 변경' : `${userName} 비밀번호 초기화`}
                            </DialogTitle>
                        </div>
                        <p className="text-sm text-white/40 ml-12">
                            {isAdminSelf
                                ? '현재 비밀번호를 확인한 후 새 비밀번호를 설정합니다.'
                                : '랜덤 6자리 PIN으로 초기화됩니다. 사용자에게 직접 전달해 주세요.'}
                        </p>
                    </DialogHeader>

                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mt-4">
                        {(['VERIFY', 'ACTION'] as const).map((s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                {i > 0 && <div className={`w-8 h-px transition-colors duration-300 ${step === 'ACTION' || step === 'SUCCESS' ? 'bg-indigo-500/50' : 'bg-white/10'}`} />}
                                <div className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all duration-300 ${step === s ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : (step === 'SUCCESS' || (s === 'VERIFY' && step === 'ACTION')) ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-white/5 text-white/25 border-white/10'}`}>
                                    {s === 'VERIFY' ? (isAdminSelf ? '① 현재 비밀번호' : '① 관리자 인증') : (isAdminSelf ? '② 새 비밀번호' : '② 초기 PIN 확인')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════ */}
                {/* ADMIN SELF MODE */}
                {/* ══════════════════════════════════════════════════════════ */}

                {isAdminSelf && step === 'VERIFY' && (
                    <form onSubmit={handleAdminVerify} className="px-7 py-6 space-y-5">
                        <div className="space-y-2">
                            <Label className={labelClass}>현재 비밀번호</Label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                                <Input type="password" placeholder="현재 비밀번호 입력" className={`pl-10 ${inputClass}`}
                                    value={adminCurrentPw} onChange={(e) => setAdminCurrentPw(e.target.value)} autoFocus />
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-400 font-semibold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}
                        <div className="flex justify-end gap-3">
                            {ghostBtn(() => setOpen(false), '취소')}
                            {gradientBtn(!adminCurrentPw || loading, loading ? <><Loader2 className="w-4 h-4 animate-spin" /> 확인 중...</> : <>확인 <ArrowRight className="w-4 h-4" /></>)}
                        </div>
                    </form>
                )}

                {isAdminSelf && step === 'ACTION' && (
                    <form onSubmit={handleAdminChangePassword} className="px-7 py-6 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                            <Label className={labelClass}>새 비밀번호</Label>
                            <div className="relative">
                                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                                <Input type={showNewPw ? 'text' : 'password'} placeholder="새 비밀번호 (4자 이상)" className={`pl-10 pr-10 ${inputClass}`}
                                    value={adminNewPw} onChange={(e) => setAdminNewPw(e.target.value)} autoFocus />
                                <button type="button" onClick={() => setShowNewPw(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className={labelClass}>새 비밀번호 확인</Label>
                            <div className="relative">
                                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                                <Input type={showConfirmPw ? 'text' : 'password'} placeholder="새 비밀번호 다시 입력" className={`pl-10 pr-10 ${inputClass} ${adminConfirmPw && adminNewPw !== adminConfirmPw ? 'border-red-500/50' : adminConfirmPw && adminNewPw === adminConfirmPw ? 'border-emerald-500/50' : ''}`}
                                    value={adminConfirmPw} onChange={(e) => setAdminConfirmPw(e.target.value)} />
                                <button type="button" onClick={() => setShowConfirmPw(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {adminConfirmPw && (
                                <p className={`text-xs font-medium ${adminNewPw === adminConfirmPw ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {adminNewPw === adminConfirmPw ? '✓ 비밀번호가 일치합니다' : '✗ 비밀번호가 일치하지 않습니다'}
                                </p>
                            )}
                        </div>
                        {error && <p className="text-sm text-red-400 font-semibold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}
                        <div className="flex justify-between pt-1">
                            {ghostBtn(() => setStep('VERIFY'), '← 뒤로')}
                            {gradientBtn(!adminNewPw || !adminConfirmPw || loading, loading ? <><Loader2 className="w-4 h-4 animate-spin" /> 변경 중...</> : <>비밀번호 변경</>)}
                        </div>
                    </form>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* USER-RESET MODE */}
                {/* ══════════════════════════════════════════════════════════ */}

                {!isAdminSelf && step === 'VERIFY' && (
                    <form onSubmit={handleVerifyAdminForReset} className="px-7 py-6 space-y-5">
                        <div className="space-y-2">
                            <Label className={labelClass}>관리자 비밀번호</Label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                                <Input type="password" placeholder="관리자 비밀번호 입력" className={`pl-10 ${inputClass}`}
                                    value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} autoFocus />
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-400 font-semibold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}
                        <div className="flex justify-end gap-3">
                            {ghostBtn(() => setOpen(false), '취소')}
                            {gradientBtn(!adminPassword || loading, loading ? <><Loader2 className="w-4 h-4 animate-spin" /> 인증 중...</> : <>인증 후 PIN 생성 <ArrowRight className="w-4 h-4" /></>)}
                        </div>
                    </form>
                )}

                {!isAdminSelf && step === 'ACTION' && (
                    <form onSubmit={handleApplyPin} className="px-7 py-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="p-4 rounded-2xl border border-amber-500/25 bg-amber-500/8 space-y-3">
                            <p className="text-xs font-bold text-amber-300/70 uppercase tracking-widest">생성된 임시 PIN</p>
                            <div className="flex items-center justify-between">
                                <span className="text-4xl font-black tracking-[0.3em] text-white font-mono">{generatedPin}</span>
                                <button
                                    type="button"
                                    onClick={handleCopyPin}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${copied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/8 text-white/50 hover:text-white border border-white/10 hover:border-white/20'}`}
                                >
                                    {copied ? <><CheckCircle2 className="w-3.5 h-3.5" /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 복사</>}
                                </button>
                            </div>
                            <p className="text-xs text-amber-400/60">이 PIN은 지금만 표시됩니다. <span className="font-bold text-amber-300">{userName}</span> 님께 직접 전달해주세요.</p>
                        </div>
                        {error && <p className="text-sm text-red-400 font-semibold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}
                        <div className="flex justify-between">
                            {ghostBtn(() => setOpen(false), '취소')}
                            {gradientBtn(loading, loading ? <><Loader2 className="w-4 h-4 animate-spin" /> 적용 중...</> : <><RefreshCw className="w-4 h-4" /> 이 PIN으로 초기화</>)}
                        </div>
                    </form>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* SUCCESS (both modes) */}
                {/* ══════════════════════════════════════════════════════════ */}

                {step === 'SUCCESS' && (
                    <div className="px-7 py-10 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            </div>
                            <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 blur-xl -z-10" />
                        </div>
                        <div className="text-center">
                            <p className="font-black text-white text-lg">
                                {isAdminSelf ? '비밀번호가 변경되었습니다!' : '초기화 완료!'}
                            </p>
                            <p className="text-sm text-white/40 mt-1.5">
                                {isAdminSelf
                                    ? '새로운 비밀번호로 로그인이 가능합니다.'
                                    : <><span className="text-white/60 font-semibold">{userName}</span> 님의 비밀번호가 PIN으로 초기화되었습니다.</>}
                            </p>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="mt-2 px-8 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all duration-200"
                        >
                            확인
                        </button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
