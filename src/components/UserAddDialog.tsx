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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, Save, Lock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Role } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

export function UserAddDialog({ trigger }: { trigger?: React.ReactNode }) {
    const { createUser } = useAuth()
    const [open, setOpen] = useState(false)

    // Form States
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
            const newUser = {
                id: uuidv4(),
                username,
                nickname,
                role
            }
            await createUser(newUser, password, adminPassword)
            setOpen(false)
        } catch (err: any) {
            setError(err.message || '계정 생성 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const resetStates = () => {
        setUsername('')
        setPassword('')
        setNickname('')
        setRole('USER')
        setAdminPassword('')
        setStep('FORM')
        setError('')
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen) {
            resetStates()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-white text-slate-900 hover:bg-slate-200 gap-2 rounded-xl font-bold">
                        <UserPlus className="w-4 h-4" /> 신규 계정 추가
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-green-600" />
                        신규 계정 추가
                    </DialogTitle>
                    <DialogDescription>
                        새로운 사용자를 시스템에 등록합니다.
                    </DialogDescription>
                </DialogHeader>

                {step === 'FORM' && (
                    <form onSubmit={handleNext} className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-username">아이디 *</Label>
                                <Input id="new-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="user id" autoFocus />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">비밀번호 *</Label>
                                <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 4 chars" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-nickname">닉네임 *</Label>
                                <Input id="new-nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Display Name" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-role">권한</Label>
                            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="권한 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">USER (일반 사용자)</SelectItem>
                                    <SelectItem value="ADMIN">ADMIN (관리자)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {error && <p className="text-sm text-destructive font-semibold">{error}</p>}

                        <DialogFooter className="mt-4">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>취소</Button>
                            <Button type="submit">다음</Button>
                        </DialogFooter>
                    </form>
                )}

                {step === 'VERIFY' && (
                    <form onSubmit={handleCreateUser} className="space-y-4 py-2 animate-in fade-in zoom-in duration-300">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                            <p className="font-bold text-sm mb-1">관리자 승인 필요</p>
                            <p className="text-xs text-muted-foreground">새로운 계정을 생성하려면 관리자 비밀번호를 입력해주세요.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="admin-pw-create">관리자 비밀번호</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="admin-pw-create"
                                    type="password"
                                    placeholder="Password"
                                    className="pl-9"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        {error && <p className="text-sm text-destructive font-semibold">{error}</p>}

                        <DialogFooter className="flex justify-between">
                            <Button type="button" variant="ghost" onClick={() => setStep('FORM')}>뒤로 가기</Button>
                            <Button type="submit" disabled={!adminPassword || loading}>
                                {loading ? '생성 중...' : '계정 생성'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
