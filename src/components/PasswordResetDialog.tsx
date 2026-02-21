'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Key, ShieldAlert, Lock, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface PasswordResetDialogProps {
    userId: string
    userName: string
    trigger?: React.ReactNode
}

export function PasswordResetDialog({ userId, userName, trigger }: PasswordResetDialogProps) {
    const { verifyPassword, updatePassword } = useAuth()
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<'VERIFY' | 'RESET' | 'SUCCESS'>('VERIFY')
    const [adminPassword, setAdminPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleVerifyAdmin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const isValid = await verifyPassword(adminPassword)
            if (isValid) {
                setStep('RESET')
            } else {
                setError('관리자 비밀번호가 일치하지 않습니다.')
            }
        } catch (err) {
            setError('인증 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword.length < 4) {
            setError('비밀번호는 최소 4자 이상이어야 합니다.')
            return
        }
        setLoading(true)
        setError('')
        try {
            await updatePassword(userId, newPassword, adminPassword)
            setStep('SUCCESS')
        } catch (err) {
            setError('비밀번호 변경 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            // Reset state when closed
            setTimeout(() => {
                setStep('VERIFY')
                setAdminPassword('')
                setNewPassword('')
                setError('')
            }, 300)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon">
                        <Key className="w-4 h-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {step === 'VERIFY' && <ShieldAlert className="w-5 h-5 text-orange-500" />}
                        {step === 'RESET' && <Key className="w-5 h-5 text-blue-500" />}
                        {step === 'SUCCESS' && <CheckCircle2 className="w-5 h-5 text-green-500" />}

                        {step === 'VERIFY' && '보안 인증'}
                        {step === 'RESET' && '새 비밀번호 설정'}
                        {step === 'SUCCESS' && '변경 완료'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'VERIFY' && '보안을 위해 관리자 비밀번호를 먼저 입력해주세요.'}
                        {step === 'RESET' && `'${userName}' 님의 새로운 비밀번호를 입력해주세요.`}
                        {step === 'SUCCESS' && '비밀번호가 성공적으로 변경되었습니다.'}
                    </DialogDescription>
                </DialogHeader>

                {step === 'VERIFY' && (
                    <form onSubmit={handleVerifyAdmin} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="admin-pw" className="text-muted-foreground">관리자 비밀번호</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="admin-pw"
                                    type="password"
                                    placeholder="Enter your password"
                                    className="pl-9"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        {error && <p className="text-sm text-destructive font-semibold shake-animation">{error}</p>}
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>취소</Button>
                            <Button type="submit" disabled={!adminPassword || loading}>
                                {loading ? '인증 중...' : '인증하기'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}

                {step === 'RESET' && (
                    <form onSubmit={handleResetPassword} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-pw" className="text-muted-foreground">새로운 비밀번호</Label>
                            <div className="relative">
                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="new-pw"
                                    type="password"
                                    placeholder="New password"
                                    className="pl-9"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        {error && <p className="text-sm text-destructive font-semibold">{error}</p>}
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>취소</Button>
                            <Button type="submit" className="gap-2" disabled={!newPassword || loading}>
                                {loading ? '변경 중...' : '변경 내용 저장'} <ArrowRight className="w-4 h-4" />
                            </Button>
                        </DialogFooter>
                    </form>
                )}

                {step === 'SUCCESS' && (
                    <div className="py-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-center text-muted-foreground">
                            이제 <strong>{userName}</strong> 님은 새로운 비밀번호로<br />로그인할 수 있습니다.
                        </p>
                        <DialogFooter className="w-full sm:justify-center">
                            <Button onClick={() => setOpen(false)} className="w-full sm:w-auto min-w-[120px]">
                                확인
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
