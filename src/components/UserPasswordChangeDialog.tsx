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
import { Key, Lock, CheckCircle2, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react'

export function UserPasswordChangeDialog({ trigger }: { trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM')

    const [currentPw, setCurrentPw] = useState('')
    const [newPw, setNewPw] = useState('')
    const [confirmPw, setConfirmPw] = useState('')
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPw.length < 4) { setError('새 비밀번호는 4자 이상이어야 합니다.'); return }
        if (newPw !== confirmPw) { setError('새 비밀번호가 일치하지 않습니다.'); return }
        if (currentPw === newPw) { setError('현재 비밀번호와 동일한 비밀번호로 변경할 수 없습니다.'); return }

        setLoading(true); setError('')
        try {
            const res = await fetch('/api/auth/users/change-own-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || '비밀번호 변경 실패')
            }
            setStep('SUCCESS')
        } catch (err: any) {
            setError(err.message || '비밀번호 변경 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            setTimeout(() => {
                setStep('FORM')
                setCurrentPw(''); setNewPw(''); setConfirmPw('')
                setError(''); setShowNew(false); setShowConfirm(false)
            }, 300)
        }
    }

    const pwMatch = confirmPw.length > 0 && newPw === confirmPw

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-all">
                        <Key className="w-3.5 h-3.5" /> 비밀번호 변경
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                {step === 'FORM' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Key className="w-5 h-5 text-amber-500" />
                                비밀번호 변경
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            {/* Current Password */}
                            <div className="space-y-2">
                                <Label htmlFor="cur-pw" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">현재 비밀번호</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="cur-pw"
                                        type="password"
                                        placeholder="현재 비밀번호"
                                        className="pl-9"
                                        value={currentPw}
                                        onChange={(e) => setCurrentPw(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="border-t border-border/50 my-1" />

                            {/* New Password */}
                            <div className="space-y-2">
                                <Label htmlFor="new-pw" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">새 비밀번호</Label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="new-pw"
                                        type={showNew ? 'text' : 'password'}
                                        placeholder="새 비밀번호 (4자 이상)"
                                        className="pl-9 pr-9"
                                        value={newPw}
                                        onChange={(e) => setNewPw(e.target.value)}
                                    />
                                    <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label htmlFor="confirm-pw" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">새 비밀번호 확인</Label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirm-pw"
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="새 비밀번호 다시 입력"
                                        className={`pl-9 pr-9 transition-colors ${confirmPw && (pwMatch ? 'border-green-500 focus-visible:ring-green-500/30' : 'border-red-500 focus-visible:ring-red-500/30')}`}
                                        value={confirmPw}
                                        onChange={(e) => setConfirmPw(e.target.value)}
                                    />
                                    <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {confirmPw && (
                                    <p className={`text-[11px] font-semibold flex items-center gap-1 ${pwMatch ? 'text-green-500' : 'text-red-500'}`}>
                                        {pwMatch ? <><CheckCircle2 className="w-3 h-3" /> 비밀번호가 일치합니다</> : '✗ 비밀번호가 일치하지 않습니다'}
                                    </p>
                                )}
                            </div>

                            {error && (
                                <p className="text-sm text-destructive font-semibold bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                                    {error}
                                </p>
                            )}

                            <div className="flex justify-end gap-2 pt-1">
                                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={!currentPw || !newPw || !confirmPw || loading}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-all"
                                >
                                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> 변경 중...</> : <>비밀번호 변경 <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {step === 'SUCCESS' && (
                    <div className="py-8 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <div className="text-center">
                            <p className="font-black text-lg">변경 완료!</p>
                            <p className="text-sm text-muted-foreground mt-1">새 비밀번호로 다음 로그인 시 사용하세요.</p>
                        </div>
                        <button onClick={() => setOpen(false)} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all">
                            확인
                        </button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
