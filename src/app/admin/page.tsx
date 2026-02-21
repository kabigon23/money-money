'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Users,
    ShieldCheck,
    Settings,
    LogOut,
    UserPlus,
    Mail,
    Key,
    ShieldAlert
} from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PasswordResetDialog } from '@/components/PasswordResetDialog'
import { UserEditDialog } from '@/components/UserEditDialog'
import { UserAddDialog } from '@/components/UserAddDialog'

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

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-[family-name:var(--font-geist-sans)]">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary p-3 rounded-2xl shadow-lg">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-primary">System Admin</h1>
                            <p className="text-muted-foreground flex items-center gap-2">
                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                계정 관리 및 시스템 설정
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={logout} className="gap-2 rounded-xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20">
                        <LogOut className="w-4 h-4" /> 로그아웃
                    </Button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-xl bg-white rounded-3xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Users className="h-4 w-4" /> 총 사용자
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black">{userCount}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-xl bg-white rounded-3xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-orange-500" /> 관리계정
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-orange-500">{adminCount}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-xl bg-primary text-primary-foreground rounded-3xl overflow-hidden relative">
                        <div className="absolute right-[-20px] top-[-20px] opacity-10">
                            <Settings className="w-32 h-32" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-primary-foreground/70 uppercase tracking-widest flex items-center gap-2">
                                <Settings className="h-4 w-4" /> 서버 상태
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black">ACTIVE</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                    <CardHeader className="bg-slate-900 text-white p-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-2xl font-black italic">User Management</CardTitle>
                                <CardDescription className="text-slate-400">전체 계정 리스트 및 권한 관리</CardDescription>
                            </div>
                            <UserAddDialog />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-bold py-4 px-8">사용자명 (ID)</TableHead>
                                    <TableHead className="font-bold">닉네임</TableHead>
                                    <TableHead className="font-bold">권한</TableHead>
                                    <TableHead className="text-right font-bold py-4 px-8">작업</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((u) => (
                                    <TableRow key={u.id} className="hover:bg-slate-50 transition-colors border-none group">
                                        <TableCell className="font-bold py-6 px-8 flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${u.role === 'ADMIN' ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-600'}`}>
                                                {(u.nickname || 'U').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span>{u.username}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-600">{u.nickname}</TableCell>
                                        <TableCell>
                                            <Badge className={`border-none font-bold ${u.role === 'ADMIN' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'}`}>
                                                {u.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right py-4 px-8">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <PasswordResetDialog
                                                    userId={u.id}
                                                    userName={u.nickname}
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="비밀번호 변경"
                                                            className="h-9 w-9 rounded-full"
                                                        >
                                                            <Key className="w-4 h-4" />
                                                        </Button>
                                                    }
                                                />
                                                <UserEditDialog
                                                    user={u}
                                                    isCurrentUser={user?.id === u.id}
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="사용자 정보 수정"
                                                            className="h-9 w-9 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                        </Button>
                                                    }
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
