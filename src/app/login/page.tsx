'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Wallet, ShieldCheck, User as UserIcon, Lock } from 'lucide-react'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const { login, user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (user) {
            if (user.role === 'ADMIN') {
                router.push('/admin')
            } else {
                router.push('/')
            }
        }
    }, [user, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        const success = await login(username, password)
        if (!success) {
            setError('아이디 또는 비밀번호가 올바르지 않습니다.')
        }
    }

    if (isLoading) return null

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-[family-name:var(--font-geist-sans)]">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="flex justify-center">
                        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
                            <span className="text-3xl">💰</span>
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-yellow-300 animate-ping opacity-75"></div>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #F59E0B 0%, #B45309 60%, #92400E 100%)' }}>MoneyMoney</h1>
                    <p className="text-muted-foreground italic">Portfolio Tracking & Analysis</p>
                </div>

                <Card className="border-none shadow-2xl overflow-hidden rounded-3xl">
                    <CardHeader className="bg-primary text-primary-foreground p-8 pb-10">
                        <CardTitle className="text-2xl font-bold tracking-tight">로그인</CardTitle>
                        <CardDescription className="text-primary-foreground/70">
                            계정 정보를 입력하여 관리 시스템에 접속하세요.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 -mt-6 bg-white rounded-t-3xl relative">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">아이디</Label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="username"
                                            placeholder="Username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="pl-10 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-primary shadow-inner"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">비밀번호</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-primary shadow-inner"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-destructive/10 text-destructive text-sm font-medium rounded-xl border border-destructive/20 animate-in fade-in zoom-in duration-300">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                접속하기
                            </Button>
                        </form>

                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
