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
import { Settings, ShieldAlert, Lock, Trash2, Save, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { User, Role } from '@/lib/auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UserEditDialogProps {
    user: User
    trigger?: React.ReactNode
    isCurrentUser: boolean
}

export function UserEditDialog({ user: targetUser, trigger, isCurrentUser }: UserEditDialogProps) {
    const { updateUserInfo, deleteUser } = useAuth()
    const [open, setOpen] = useState(false)

    // Form States
    const [nickname, setNickname] = useState(targetUser.nickname || '')
    const [role, setRole] = useState<Role>(targetUser.role)

    // Security States
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showRoleConfirm, setShowRoleConfirm] = useState(false)
    const [adminPassword, setAdminPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSaveInfo = async () => {
        setLoading(true)
        try {
            // If promoting to ADMIN, require check? 
            // Simplified: allow role change if it's just info update. Detailed check for security sensitive actions.
            // Requirement says "Promoting to Admin SHOULD require Admin Password".
            if (role === 'ADMIN' && targetUser.role !== 'ADMIN') {
                setShowRoleConfirm(true)
                setLoading(false)
                return
            }

            await updateUserInfo(targetUser.id, { nickname, role })
            setOpen(false)
        } catch (err) {
            setError('정보 수정 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const handleRoleUpdateWithAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
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
        setLoading(true)
        setError('')
        try {
            await deleteUser(targetUser.id, adminPassword)
            setOpen(false)
        } catch (err: any) {
            setError(err.message || '삭제 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const resetStates = () => {
        setNickname(targetUser.nickname || '')
        setRole(targetUser.role)
        setShowDeleteConfirm(false)
        setShowRoleConfirm(false)
        setAdminPassword('')
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
                    <Button variant="ghost" size="icon">
                        <Settings className="w-4 h-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-slate-500" />
                        사용자 정보 관리
                    </DialogTitle>
                    <DialogDescription>
                        '{targetUser.nickname}' 계정의 정보를 수정하거나 삭제합니다.
                    </DialogDescription>
                </DialogHeader>

                {!showDeleteConfirm && !showRoleConfirm && (
                    <div className="space-y-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="username">아이디 (변경 불가)</Label>
                            <Input id="username" value={targetUser.username} disabled className="bg-slate-100 font-mono" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="nickname">닉네임</Label>
                            <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">권한</Label>
                            <Select value={role} onValueChange={(v) => setRole(v as Role)} disabled={isCurrentUser}>
                                <SelectTrigger>
                                    <SelectValue placeholder="권한 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">USER (일반 사용자)</SelectItem>
                                    <SelectItem value="ADMIN">ADMIN (관리자)</SelectItem>
                                </SelectContent>
                            </Select>
                            {isCurrentUser && <p className="text-[10px] text-muted-foreground">본인의 권한은 변경할 수 없습니다.</p>}
                        </div>

                        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 mt-4">
                            {!isCurrentUser && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    <Trash2 className="w-4 h-4" /> 계정 삭제
                                </Button>
                            )}
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>취소</Button>
                                <Button type="button" onClick={handleSaveInfo} className="gap-2" disabled={loading}>
                                    <Save className="w-4 h-4" /> 저장
                                </Button>
                            </div>
                        </DialogFooter>
                    </div>
                )}

                {showDeleteConfirm && (
                    <form onSubmit={handleDeleteUser} className="space-y-4 py-2 animate-in fade-in zoom-in duration-300">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-bold text-sm">계정 영구 삭제 경고</p>
                                <p className="text-xs">이 작업은 되돌릴 수 없습니다. 계속하시려면 관리자 비밀번호를 입력하세요.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="admin-pw-del">관리자 비밀번호</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="admin-pw-del"
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
                            <Button type="button" variant="ghost" onClick={resetStates}>뒤로 가기</Button>
                            <Button type="submit" variant="destructive" disabled={!adminPassword || loading}>
                                {loading ? '삭제 중...' : '영구 삭제 확인'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}

                {showRoleConfirm && (
                    <form onSubmit={handleRoleUpdateWithAuth} className="space-y-4 py-2 animate-in fade-in zoom-in duration-300">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-bold text-sm">관리자 권한 부여</p>
                                <p className="text-xs">이 사용자에게 시스템 전체 관리 권한을 부여합니다. 관리자 비밀번호로 승인해주세요.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="admin-pw-role">관리자 비밀번호</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="admin-pw-role"
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
                            <Button type="button" variant="ghost" onClick={resetStates}>뒤로 가기</Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={!adminPassword || loading}>
                                {loading ? '처리 중...' : '권한 승격 승인'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
