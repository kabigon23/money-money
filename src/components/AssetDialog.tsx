import { useState, useEffect } from 'react'
import { Plus, Minus, History, Clock, ArrowRight } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, SubmitHandler } from 'react-hook-form'
import * as z from 'zod'
import { TickerSearch, TickerResult } from '@/components/TickerSearch'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Asset, Category, Tag, Transaction } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const CASH_EXCHANGES = ['CASH_KRW', 'CASH_USD'] as const
type CashExchange = typeof CASH_EXCHANGES[number]

const isCash = (exchange: string): exchange is CashExchange =>
    CASH_EXCHANGES.includes(exchange as CashExchange)

const CASH_META: Record<CashExchange, { symbol: string; name: string; unit: string; label: string }> = {
    CASH_KRW: { symbol: 'CASH_KRW', name: '원화 현금', unit: '원', label: '원화 (KRW)' },
    CASH_USD: { symbol: 'CASH_USD', name: '달러 현금', unit: 'USD', label: '달러 (USD)' },
}

const formSchema = z.object({
    symbol: z.string().min(1, '종목 코드를 입력하세요.'),
    name: z.string().min(1, '종목명을 입력하세요.'),
    quantity: z.coerce.number().min(0, '수량은 0 이상이어야 합니다.'),
    exchange: z.enum(['US', 'KR', 'CRYPTO', 'CASH_KRW', 'CASH_USD']),
    categoryId: z.string().min(1, '카테고리를 선택하세요.'),
    tagId: z.string().nullable().default(null),
})

type FormValues = z.infer<typeof formSchema>

interface AssetDialogProps {
    onSave: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'> | Asset) => void
    categories: Category[]
    tags: Tag[]
    initialAsset?: Asset
    trigger?: React.ReactNode
    isCashOnly?: boolean
    defaultCashExchange?: 'CASH_KRW' | 'CASH_USD'
}

export function AssetDialog({ onSave, categories, tags, initialAsset, trigger, isCashOnly = false, defaultCashExchange = 'CASH_KRW' }: AssetDialogProps) {
    const [open, setOpen] = useState(false)
    const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0)
    const [history, setHistory] = useState<Transaction[]>(initialAsset?.history || [])
    const isEdit = !!initialAsset

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialAsset ? {
            symbol: initialAsset.symbol,
            name: initialAsset.name,
            quantity: initialAsset.quantity,
            exchange: initialAsset.exchange,
            categoryId: initialAsset.categoryId,
            tagId: initialAsset.tagId,
        } : isCashOnly ? {
            symbol: '',
            name: '',
            quantity: 0,
            exchange: defaultCashExchange,
            categoryId: '__CASH__',
            tagId: null,
        } : {
            symbol: '',
            name: '',
            quantity: 0,
            exchange: 'US',
            categoryId: 'default',
            tagId: null,
        },
    })

    const watchedExchange = form.watch('exchange')

    // Dialog가 열릴 때 신규 추가 모드에서 form을 올바른 defaultCashExchange로 초기화
    useEffect(() => {
        if (open && !isEdit) {
            if (isCashOnly) {
                const meta = CASH_META[defaultCashExchange]
                form.reset({
                    symbol: meta.symbol,
                    name: meta.name,
                    quantity: 0,
                    exchange: defaultCashExchange,
                    categoryId: '__CASH__',
                    tagId: null,
                })
            } else {
                form.reset({
                    symbol: '',
                    name: '',
                    quantity: 0,
                    exchange: 'US',
                    categoryId: 'default',
                    tagId: null,
                })
            }
        }
    }, [open])

    // 현금 자산 선택 시 symbol/name 자동 설정
    useEffect(() => {
        if (!isEdit && isCash(watchedExchange)) {
            const meta = CASH_META[watchedExchange as CashExchange]
            form.setValue('symbol', meta.symbol)
            form.setValue('name', meta.name)
        }
    }, [watchedExchange, isEdit, form])

    const recordTransaction = (type: 'BUY' | 'SELL' | 'EDIT', amount: number, totalAfter: number) => {
        const newTransaction: Transaction = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            amount,
            totalAfter,
            timestamp: Date.now()
        }
        setHistory(prev => [newTransaction, ...prev])
    }

    const onSubmit: SubmitHandler<FormValues> = (values) => {
        // isCashOnly 모드일 때 categoryId, tagId 강제
        const finalValues = isCashOnly
            ? { ...values, categoryId: '__CASH__', tagId: null }
            : values

        let finalHistory = history
        if (isEdit && initialAsset) {
            const sessionTransactions = history.slice(0, history.length - (initialAsset.history?.length || 0))
            const netAmountFromTransactions = sessionTransactions.reduce((acc, t) => {
                if (t.type === 'BUY') return acc + t.amount
                if (t.type === 'SELL') return acc - t.amount
                return acc
            }, 0)
            const expectedQuantity = initialAsset.quantity + netAmountFromTransactions
            if (finalValues.quantity !== expectedQuantity) {
                const diff = finalValues.quantity - expectedQuantity
                const newTransaction: Transaction = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'EDIT',
                    amount: Math.abs(diff),
                    totalAfter: finalValues.quantity,
                    timestamp: Date.now()
                }
                finalHistory = [newTransaction, ...history]
            }
            onSave({ ...initialAsset, ...finalValues, history: finalHistory, updatedAt: Date.now() })
        } else {
            onSave(finalValues as any)
        }
        setOpen(false)
        if (!isEdit) {
            form.reset()
            setHistory([])
        }
    }

    const isCashAsset = isCash(watchedExchange)
    const cashMeta = isCashAsset ? CASH_META[watchedExchange as CashExchange] : null
    const quantityUnit = cashMeta?.unit ?? '주/개'

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        size="lg"
                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 px-6"
                    >
                        <Plus className="h-5 w-5" /> 종목 추가
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isCashOnly ? (isEdit ? '현금 수정' : '현금 추가') : (isEdit ? '종목 정보 상세' : '종목 추가')}
                    </DialogTitle>
                    <DialogDescription>
                        {isCashOnly ? (isEdit ? '현금 보유액을 수정합니다.' : '보유하실 현금 영역과 금액을 입력하세요.') : (isEdit ? '종목 수정 및 거래 내역을 확인할 수 있습니다.' : '보유하신 자산의 정보를 입력해 주세요.')}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="info">수정 및 관리</TabsTrigger>
                        <TabsTrigger value="history" disabled={!isEdit} className="gap-2">
                            <History className="w-4 h-4" /> 거래 내역
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="info">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                                <div className={`grid gap-4 ${isCashOnly ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                    <FormField
                                        control={form.control}
                                        name="exchange"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{isCashOnly ? '통화' : '시장 / 유형'}</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="시장 선택" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {isCashOnly ? (
                                                            <>
                                                                <SelectItem value="CASH_KRW">💵 원화 (KRW)</SelectItem>
                                                                <SelectItem value="CASH_USD">💵 달러 (USD)</SelectItem>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <SelectItem value="US">🇺🇸 미국 (US)</SelectItem>
                                                                <SelectItem value="KR">🇺🇷 한국 (KR)</SelectItem>
                                                                <SelectItem value="CRYPTO">₿ 가상자산</SelectItem>
                                                                <SelectItem value="CASH_KRW">💵 현금 · 원화 (KRW)</SelectItem>
                                                                <SelectItem value="CASH_USD">💵 현금 · 달러 (USD)</SelectItem>
                                                            </>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {!isCashOnly && (
                                        <FormField
                                            control={form.control}
                                            name="categoryId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>카테고리</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="카테고리 선택" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {categories.map((category) => (
                                                                <SelectItem key={category.id} value={category.id}>
                                                                    {category.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>

                                {/* 현금 자산 안내 패널 */}
                                {isCashAsset && (
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-1">
                                        <p className="text-xs font-bold text-emerald-700">
                                            💵 현금 자산 — {cashMeta!.label}
                                        </p>
                                        <p className="text-xs text-emerald-600">
                                            종목 코드·이름이 자동 설정됩니다. 보유 금액({cashMeta!.unit})을 아래에 입력하세요.
                                        </p>
                                    </div>
                                )}

                                {/* 종목 검색 (추가 모드 + 현금 아닐 때만) */}
                                {!isEdit && !isCashAsset && (
                                    <div className="rounded-xl border bg-slate-50 p-3 space-y-1">
                                        <p className="text-xs font-bold text-slate-500 mb-2">🔍 종목 검색으로 빠르게 입력</p>
                                        <TickerSearch
                                            exchange={watchedExchange as 'US' | 'KR' | 'CRYPTO'}
                                            onSelect={(result: TickerResult) => {
                                                form.setValue('symbol', result.symbol)
                                                form.setValue('name', result.name)
                                            }}
                                        />
                                    </div>
                                )}

                                {/* 종목 코드 / 이름 (현금이면 비활성화) */}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="symbol"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>종목 코드 (티커)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="AAPL"
                                                        {...field}
                                                        disabled={isCashAsset && !isEdit}
                                                        className={isCashAsset && !isEdit ? 'opacity-60 bg-slate-100' : ''}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>종목명</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="애플"
                                                        {...field}
                                                        disabled={isCashAsset && !isEdit}
                                                        className={isCashAsset && !isEdit ? 'opacity-60 bg-slate-100' : ''}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem className="bg-slate-50 p-4 rounded-2xl border">
                                            <FormLabel className="text-slate-500 font-bold mb-2 block">
                                                {isCashAsset ? `보유 금액 (${quantityUnit})` : '보유 수량 관리'}
                                            </FormLabel>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-2">
                                                    <FormControl>
                                                        <Input type="number" step="any" {...field} className="font-black text-2xl h-14 bg-white border-2" />
                                                    </FormControl>
                                                    <span className="font-bold text-slate-400">{quantityUnit}</span>
                                                </div>

                                                {isEdit && (
                                                    <div className="flex flex-col gap-2 p-3 bg-white rounded-xl border-2 border-primary/10 shadow-sm transition-all">
                                                        <div className="flex items-center justify-between px-1">
                                                            <span className="text-xs font-black text-primary">
                                                                {isCashAsset ? '금액 조정' : '거래량 입력'}
                                                            </span>
                                                            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                                <Clock className="w-3 h-3" /> Quick Action
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                placeholder="0"
                                                                id="adjustmentAmount"
                                                                className="w-24 h-10 text-right font-bold text-lg border-primary/20 focus-visible:ring-primary"
                                                                onChange={(e) => setAdjustmentAmount(Number(e.target.value) || 0)}
                                                            />
                                                            <div className="flex gap-2 flex-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    className="flex-1 h-10 font-black text-blue-600 hover:bg-blue-50 border-blue-200 hover:border-blue-300 gap-1 rounded-lg"
                                                                    onClick={() => {
                                                                        const current = Number(form.getValues('quantity')) || 0
                                                                        const next = current + adjustmentAmount
                                                                        form.setValue('quantity', next)
                                                                        recordTransaction('BUY', adjustmentAmount, next)
                                                                    }}
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                    {isCashAsset ? '입금' : '매수'}
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    className="flex-1 h-10 font-black text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300 gap-1 rounded-lg"
                                                                    onClick={() => {
                                                                        const current = Number(form.getValues('quantity')) || 0
                                                                        const next = Math.max(0, current - adjustmentAmount)
                                                                        form.setValue('quantity', next)
                                                                        recordTransaction('SELL', adjustmentAmount, next)
                                                                    }}
                                                                >
                                                                    <Minus className="w-4 h-4" />
                                                                    {isCashAsset ? '출금' : '매도'}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {!isCashOnly && (
                                    <div className="space-y-2">
                                        <FormLabel className="text-sm font-semibold">태그 선택</FormLabel>
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map((tag) => {
                                                const isSelected = form.watch('tagId') === tag.id
                                                return (
                                                    <Button
                                                        key={tag.id}
                                                        type="button"
                                                        variant={isSelected ? 'default' : 'outline'}
                                                        size="sm"
                                                        style={isSelected ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
                                                        className={`h-8 px-3 text-xs transition-all ${isSelected
                                                            ? 'text-white ring-2 ring-offset-2 shadow-md'
                                                            : 'hover:bg-muted font-medium'
                                                            }`}
                                                        onClick={() => {
                                                            const current = form.getValues('tagId')
                                                            form.setValue('tagId', current === tag.id ? null : tag.id)
                                                        }}
                                                    >
                                                        {tag.name}
                                                    </Button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                                <DialogFooter className="pt-4 border-t">
                                    <Button type="submit" className="w-full h-12 text-lg font-black shadow-lg shadow-primary/20">
                                        {isCashOnly ? (isEdit ? '현금 수정 저장' : '현금 추가') : (isEdit ? '수정 내용 저장' : '새로운 종목 추가')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </TabsContent>

                    <TabsContent value="history">
                        <div className="space-y-4 py-2">
                            {history.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground italic border-2 border-dashed rounded-2xl">
                                    기록된 거래 내역이 없습니다.
                                </div>
                            ) : (
                                <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 pb-4">
                                    {history.map((item) => (
                                        <div key={item.id} className="relative group">
                                            <div className={`absolute left-[-21px] top-1 w-3 h-3 rounded-full border-2 border-white ring-4 ring-offset-0 transition-shadow ${item.type === 'INITIAL' ? 'bg-slate-400 ring-slate-100' :
                                                item.type === 'BUY' ? 'bg-blue-500 ring-blue-50' :
                                                    item.type === 'SELL' ? 'bg-red-500 ring-red-50' :
                                                        'bg-amber-500 ring-amber-50'
                                                }`} />
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-black uppercase tracking-widest ${item.type === 'INITIAL' ? 'text-slate-500' :
                                                            item.type === 'BUY' ? 'text-blue-600' :
                                                                item.type === 'SELL' ? 'text-red-600' :
                                                                    'text-amber-600'
                                                            }`}>
                                                            {item.type === 'INITIAL' ? '초기 설정' :
                                                                item.type === 'BUY' ? (isCashAsset ? '입금 (+)' : '매수 (+)') :
                                                                    item.type === 'SELL' ? (isCashAsset ? '출금 (-)' : '매도 (-)') : '수량 직접 수정'}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">
                                                            {new Date(item.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-black text-slate-800">
                                                        {item.type === 'SELL' ? '-' : '+'}{item.amount.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                    <span>{isCashAsset ? '금액 변화' : '수량 변화'}</span>
                                                    <ArrowRight className="w-2 h-2" />
                                                    <span className="text-slate-600">
                                                        {item.totalAfter.toLocaleString()} {quantityUnit}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
