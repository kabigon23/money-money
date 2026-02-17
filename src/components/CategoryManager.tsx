'use client'

import { useState } from 'react'
import { Plus, Settings2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Category } from '@/types'

interface CategoryManagerProps {
    categories: Category[]
    onAddCategory: (name: string) => void
    onDeleteCategory: (id: string) => void
}

export function CategoryManager({
    categories,
    onAddCategory,
    onDeleteCategory
}: CategoryManagerProps) {
    const [newCategoryName, setNewCategoryName] = useState('')

    const handleAdd = () => {
        if (newCategoryName.trim()) {
            onAddCategory(newCategoryName.trim())
            setNewCategoryName('')
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Settings2 className="h-4 w-4" /> 카테고리 관리
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>카테고리 관리</DialogTitle>
                    <DialogDescription>
                        자산을 분류할 카테고리를 관리합니다. (예: 액티브, 연금저축)
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="새 카테고리 이름"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <Button onClick={handleAdd}>추가</Button>
                    </div>
                    <div className="flex flex-col border rounded-md divide-y">
                        {categories.map((category) => (
                            <div key={category.id} className="flex items-center justify-between p-3">
                                <span className="text-sm font-medium">{category.name}</span>
                                {category.id !== 'default' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => onDeleteCategory(category.id)}
                                    >
                                        삭제
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
