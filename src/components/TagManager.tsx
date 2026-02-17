'use client'

import { useState } from 'react'
import { Plus, X, Tag as TagIcon } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Tag } from '@/types'

interface TagManagerProps {
    tags: Tag[]
    onAddTag: (name: string, color: string) => void
    onDeleteTag: (id: string) => void
}

const COLOR_PRESETS = [
    '#0F172A', // Slate 900
    '#2563EB', // Blue 600
    '#16A34A', // Green 600
    '#DC2626', // Red 600
    '#D97706', // Amber 600
    '#7C3AED', // Violet 600
    '#DB2777', // Pink 600
    '#0891B2', // Cyan 600
]

export function TagManager({ tags, onAddTag, onDeleteTag }: TagManagerProps) {
    const [newTagName, setNewTagName] = useState('')
    const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0])

    const handleAdd = () => {
        if (newTagName.trim()) {
            onAddTag(newTagName.trim(), selectedColor)
            setNewTagName('')
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <TagIcon className="h-4 w-4" /> 태그 관리
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>태그 관리</DialogTitle>
                    <DialogDescription>
                        자산에 부여할 태그를 추가하거나 삭제할 수 있습니다.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="새 태그 이름"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <Button onClick={handleAdd}>추가</Button>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">태그 색상 선택</p>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_PRESETS.map((color) => (
                                <button
                                    key={color}
                                    className={`h-6 w-6 rounded-full border-2 transition-all ${selectedColor === color ? 'border-primary ring-2 ring-primary ring-offset-2 scale-110' : 'border-transparent hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setSelectedColor(color)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                    {tags.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic w-full text-center py-4 border border-dashed rounded-lg">
                            등록된 태그가 없습니다.
                        </p>
                    ) : (
                        tags.map((tag) => (
                            <Badge
                                key={tag.id}
                                variant="secondary"
                                className="gap-1 px-3 py-1 text-white shadow-sm border-none"
                                style={{ backgroundColor: tag.color }}
                            >
                                {tag.name}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0 hover:bg-white/20 text-white/80 hover:text-white"
                                    onClick={() => onDeleteTag(tag.id)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Badge>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
