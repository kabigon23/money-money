'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, SubmitHandler } from 'react-hook-form'
import * as z from 'zod'

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
import { Asset, Category, Tag } from '@/types'

const formSchema = z.object({
    symbol: z.string().min(1, '종목 코드를 입력하세요.'),
    name: z.string().min(1, '종목명을 입력하세요.'),
    quantity: z.coerce.number().min(0, '수량은 0 이상이어야 합니다.'),
    exchange: z.enum(['US', 'KR']),
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
}

export function AssetDialog({ onSave, categories, tags, initialAsset, trigger }: AssetDialogProps) {
    const [open, setOpen] = useState(false)
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
        } : {
            symbol: '',
            name: '',
            quantity: 0,
            exchange: 'US',
            categoryId: 'default',
            tagId: null,
        },
    })

    const onSubmit: SubmitHandler<FormValues> = (values) => {
        if (isEdit && initialAsset) {
            onSave({ ...initialAsset, ...values, updatedAt: Date.now() })
        } else {
            onSave(values)
        }
        setOpen(false)
        if (!isEdit) form.reset()
    }

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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? '종목 수정' : '종목 추가'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? '종목 정보를 수정해 주세요.' : '보유하신 자산의 정보를 입력해 주세요.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="exchange"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>시장</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="시장 선택" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="US">미국 (US)</SelectItem>
                                                <SelectItem value="KR">한국 (KR)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                        </div>
                        <FormField
                            control={form.control}
                            name="symbol"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>종목 코드 (티커)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="예: AAPL, 005930" {...field} />
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
                                        <Input placeholder="예: 애플, 삼성전자" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>보유 수량</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="any" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="space-y-2">
                            <FormLabel className="text-sm font-semibold">태그 선택 (하나만 선택 가능)</FormLabel>
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
                                {tags.length === 0 && (
                                    <p className="text-xs text-muted-foreground italic bg-muted/30 w-full p-3 rounded-lg border border-dashed text-center">
                                        등록된 태그가 없습니다. 상단 '태그 관리'에서 태그를 추가해 주세요.
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">{isEdit ? '수정하기' : '추가하기'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
