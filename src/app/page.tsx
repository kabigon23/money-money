'use client'

import { useState, useMemo, useEffect } from 'react'
import { Trash2, TrendingUp, TrendingDown, DollarSign, Wallet, Filter, Pencil } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AssetDialog } from '@/components/AssetDialog'
import { CategoryManager } from '@/components/CategoryManager'
import { TagManager } from '@/components/TagManager'
import { AssetAllocationChart } from '@/components/AssetAllocationChart'
import { useAssetPrices } from '@/hooks/useAssetPrices'
import { Asset, Category, Tag } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { LogOut, User as UserIcon } from 'lucide-react'

const INITIAL_CATEGORIES: Category[] = [
  { id: 'default', name: '기본' },
  { id: 'active', name: '액티브' },
  { id: 'pension', name: '연금저축' },
]

const INITIAL_TAGS: Tag[] = [
  { id: 'tag-1x', name: '1배', color: '#2563EB' },
  { id: 'tag-2x', name: '2배', color: '#DC2626' },
  { id: 'tag-iren', name: 'IREN', color: '#10B981' },
  { id: 'tag-oklo', name: 'OKLO', color: '#F59E0B' },
  { id: 'tag-ionq', name: 'IONQ', color: '#8B5CF6' },
  { id: 'tag-rklb', name: 'RKLB', color: '#EC4899' },
]

const INITIAL_ASSETS: Asset[] = [
  {
    id: 'asset-qld',
    symbol: 'QLD',
    name: 'QLD',
    quantity: 769,
    exchange: 'US',
    categoryId: 'default',
    tagId: 'tag-2x',
    history: [{ id: 'h-1', type: 'INITIAL', amount: 769, totalAfter: 769, timestamp: Date.now() }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'asset-qqq',
    symbol: 'QQQ',
    name: 'QQQ',
    quantity: 55,
    exchange: 'US',
    categoryId: 'default',
    tagId: 'tag-1x',
    history: [{ id: 'h-2', type: 'INITIAL', amount: 55, totalAfter: 55, timestamp: Date.now() }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'asset-qqqm',
    symbol: 'QQQM',
    name: 'QQQM',
    quantity: 87,
    exchange: 'US',
    categoryId: 'default',
    tagId: 'tag-1x',
    history: [{ id: 'h-3', type: 'INITIAL', amount: 87, totalAfter: 87, timestamp: Date.now() }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'asset-kodex-nasdaq',
    symbol: 'KODEX 미국나스닥100',
    name: 'KODEX 미국나스닥100',
    quantity: 1174,
    exchange: 'KR',
    categoryId: 'default',
    tagId: 'tag-1x',
    history: [{ id: 'h-4', type: 'INITIAL', amount: 1174, totalAfter: 1174, timestamp: Date.now() }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'asset-spy',
    symbol: 'SPY',
    name: 'SPY',
    quantity: 1,
    exchange: 'US',
    categoryId: 'default',
    tagId: 'tag-1x',
    history: [{ id: 'h-5', type: 'INITIAL', amount: 1, totalAfter: 1, timestamp: Date.now() }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'asset-iren',
    symbol: 'IREN',
    name: 'IREN',
    quantity: 75,
    exchange: 'US',
    categoryId: 'default',
    tagId: 'tag-iren',
    history: [{ id: 'h-6', type: 'INITIAL', amount: 75, totalAfter: 75, timestamp: Date.now() }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'asset-oklo',
    symbol: 'OKLO',
    name: 'OKLO',
    quantity: 42,
    exchange: 'US',
    categoryId: 'default',
    tagId: 'tag-oklo',
    history: [{ id: 'h-7', type: 'INITIAL', amount: 42, totalAfter: 42, timestamp: Date.now() }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'asset-ionq',
    symbol: 'IONQ',
    name: 'IONQ',
    quantity: 82,
    exchange: 'US',
    categoryId: 'default',
    tagId: 'tag-ionq',
    history: [{ id: 'h-8', type: 'INITIAL', amount: 82, totalAfter: 82, timestamp: Date.now() }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'asset-rklb',
    symbol: 'RKLB',
    name: 'RKLB',
    quantity: 40,
    exchange: 'US',
    categoryId: 'default',
    tagId: 'tag-rklb',
    history: [{ id: 'h-9', type: 'INITIAL', amount: 40, totalAfter: 40, timestamp: Date.now() }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
]

export default function Home() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS)
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES)
  const [tags, setTags] = useState<Tag[]>(INITIAL_TAGS)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [baseCurrency, setBaseCurrency] = useState<'KRW' | 'USD'>('KRW')
  const { prices, exchangeRate, loading } = useAssetPrices(assets)

  // Route Guard
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'USER')) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // 통화 변환 헬퍼
  const getPriceInBase = (price: number, assetExchange: 'US' | 'KR' | 'CRYPTO') => {
    if (baseCurrency === 'KRW') {
      return (assetExchange === 'US' || assetExchange === 'CRYPTO') ? price * exchangeRate : price
    } else {
      return assetExchange === 'KR' ? price / exchangeRate : price
    }
  }

  const formatCurrency = (value: number) => {
    if (baseCurrency === 'KRW') {
      return `${Math.round(value).toLocaleString()}원`
    } else {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }

  // 포트폴리오 요약 계산
  const summary = useMemo(() => {
    let currentTotalValue = 0

    assets.forEach(asset => {
      const priceInfo = prices[asset.symbol]
      if (priceInfo) {
        const priceInBase = getPriceInBase(priceInfo.currentPrice, asset.exchange)
        currentTotalValue += asset.quantity * priceInBase
      }
    })

    return {
      currentTotalValue,
    }
  }, [assets, prices, baseCurrency, exchangeRate])

  const filteredAssets = useMemo(() => {
    if (selectedCategoryId === 'all') return assets
    return assets.filter(a => a.categoryId === selectedCategoryId)
  }, [assets, selectedCategoryId])

  if (isLoading || !user || user.role !== 'USER') return null

  const saveAsset = (data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'> | Asset) => {
    if ('id' in data) {
      // Update
      setAssets(assets.map(a => a.id === data.id ? { ...data, updatedAt: Date.now() } : a))
    } else {
      // Add
      const asset: Asset = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        history: [
          {
            id: Math.random().toString(36).substr(2, 9),
            type: 'INITIAL',
            amount: data.quantity,
            totalAfter: data.quantity,
            timestamp: Date.now()
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setAssets([...assets, asset])
    }
  }

  const deleteAsset = (id: string) => {
    setAssets(assets.filter(a => a.id !== id))
  }

  const addCategory = (name: string) => {
    const newCategory: Category = {
      id: Math.random().toString(36).substr(2, 9),
      name,
    }
    setCategories([...categories, newCategory])
  }

  const deleteCategory = (id: string) => {
    if (id === 'default') return
    setCategories(categories.filter(c => c.id !== id))
    setAssets(assets.map(a => a.categoryId === id ? { ...a, categoryId: 'default' } : a))
    if (selectedCategoryId === id) setSelectedCategoryId('all')
  }

  const addTag = (name: string, color: string) => {
    const newTag: Tag = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      color,
    }
    setTags([...tags, newTag])
  }

  const deleteTag = (id: string) => {
    setTags(tags.filter(t => t.id !== id))
    setAssets(assets.map(a => ({
      ...a,
      tagId: a.tagId === id ? null : a.tagId
    })))
  }

  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || '기본'
  }

  const getTag = (id: string) => {
    return tags.find(t => t.id === id)
  }

  return (
    <div className="flex flex-col gap-8 min-h-screen p-8 pb-20 max-w-7xl mx-auto font-[family-name:var(--font-geist-sans)]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold tracking-tight text-primary">Asset-Master</h1>
          <p className="text-muted-foreground text-lg italic">
            Focus on Current Value Tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end mr-2">
            <div className="flex bg-muted p-1 rounded-lg">
              <Button
                variant={baseCurrency === 'KRW' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setBaseCurrency('KRW')}
              >
                KRW
              </Button>
              <Button
                variant={baseCurrency === 'USD' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setBaseCurrency('USD')}
              >
                USD
              </Button>
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 font-medium">
              적용 환율: 1 USD = {exchangeRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}원
            </span>
          </div>
          <CategoryManager
            categories={categories}
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
          />
          <TagManager
            tags={tags}
            onAddTag={addTag}
            onDeleteTag={deleteTag}
          />
          <AssetDialog onSave={saveAsset} categories={categories} tags={tags} />

          <div className="h-8 w-px bg-slate-200 mx-2" />

          <div className="flex items-center gap-3 pl-2">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-primary flex items-center gap-1">
                <UserIcon className="w-3 h-3" /> {user.nickname}
              </span>
              <span className="text-[10px] text-muted-foreground tracking-tighter uppercase">Standard User</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="rounded-full hover:bg-destructive/10 hover:text-destructive h-9 w-9"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-8">
        <div className="grid gap-6 md:grid-cols-1">
          <Card className="hover:shadow-lg transition-all border-l-4 border-l-primary bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Wallet className="h-4 w-4" /> 현재 총 자산 가치
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-extrabold tracking-tighter text-primary">
                {formatCurrency(summary.currentTotalValue)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>자산 비중 (태그별)</CardTitle>
                <CardDescription>
                  {selectedCategoryId === 'all' ? '전체 카테고리' : `${getCategoryName(selectedCategoryId)} 카테고리`} 내의 태그 분포
                </CardDescription>
              </div>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <AssetAllocationChart
                assets={filteredAssets}
                tags={tags}
                prices={prices}
                baseCurrency={baseCurrency}
                exchangeRate={exchangeRate}
              />
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow flex flex-col">
            <CardHeader>
              <CardTitle>실시간 시세 현황</CardTitle>
              <CardDescription>보유 종목의 현재 시장 가격</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <div className="space-y-4">
                {assets.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-10 border border-dashed rounded-xl">
                    보유 종목이 없습니다.
                  </p>
                ) : (
                  Array.from(new Set(assets.map(a => a.symbol))).map(symbol => {
                    const priceInfo = prices[symbol]
                    const assetNames = Array.from(new Set(assets.filter(a => a.symbol === symbol).map(a => a.name))).join(', ')
                    const firstAsset = assets.find(a => a.symbol === symbol)
                    const isUSDNative = firstAsset?.exchange === 'US' || firstAsset?.exchange === 'CRYPTO'
                    return (
                      <div key={symbol} className="flex justify-between items-center p-4 hover:bg-muted/80 rounded-xl transition-all border bg-card shadow-sm">
                        <div className="flex flex-col">
                          <span className="font-black text-lg">{symbol}</span>
                          <span className="text-xs text-muted-foreground">{assetNames}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xl">
                            {priceInfo ? priceInfo.currentPrice.toLocaleString(undefined, {
                              minimumFractionDigits: firstAsset?.exchange === 'CRYPTO' ? 2 : 0,
                              maximumFractionDigits: firstAsset?.exchange === 'CRYPTO' ? 2 : 0
                            }) : '---'}
                            <span className="text-sm ml-1 text-muted-foreground">{isUSDNative ? '$' : '원'}</span>
                          </div>
                          {priceInfo && (
                            <div className={`text-sm font-bold flex items-center justify-end gap-1 ${priceInfo.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {priceInfo.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {Math.abs(priceInfo.changePercent).toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                {loading && <p className="text-xs text-center text-muted-foreground animate-pulse mt-4">시세 갱신 중...</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle>보유 자산 상세</CardTitle>
            <CardDescription>현재 티커와 수량 기반 자동 시세 반영 중</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {assets.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground border-2 border-dashed m-6 rounded-xl bg-muted/5">
                아직 등록된 자산이 없습니다. '종목 추가' 버튼을 눌러 자산을 등록해 보세요.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold px-6">지역 / 카테고리</TableHead>
                    <TableHead className="font-semibold">종목 정보</TableHead>
                    <TableHead className="font-semibold">수량</TableHead>
                    <TableHead className="font-semibold">현재가</TableHead>
                    <TableHead className="font-semibold">현재 평가가치</TableHead>
                    <TableHead className="font-semibold">태그</TableHead>
                    <TableHead className="text-right px-6">삭제</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => {
                    const priceInfo = prices[asset.symbol]
                    const currentPrice = priceInfo?.currentPrice || 0
                    const valuationInBase = asset.quantity * getPriceInBase(currentPrice, asset.exchange)

                    return (
                      <TableRow key={asset.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="px-6">
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={asset.exchange === 'US' ? 'default' : asset.exchange === 'CRYPTO' ? 'outline' : 'secondary'}
                              className={`w-fit ${asset.exchange === 'CRYPTO' ? 'bg-orange-500/10 text-orange-600 border-orange-200' : ''}`}
                            >
                              {asset.exchange}
                            </Badge>
                            <span className="text-xs font-semibold text-muted-foreground">
                              {getCategoryName(asset.categoryId)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-primary">{asset.name}</span>
                            <span className="text-xs text-muted-foreground tracking-widest">{asset.symbol}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{asset.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}</TableCell>
                        <TableCell className="font-mono">
                          {currentPrice > 0 ? (
                            <span className="flex items-center gap-1">
                              {(asset.exchange === 'US' || asset.exchange === 'CRYPTO') ? '$' : ''}
                              {currentPrice.toLocaleString(undefined, {
                                minimumFractionDigits: asset.exchange === 'CRYPTO' ? 2 : 0,
                                maximumFractionDigits: asset.exchange === 'CRYPTO' ? 2 : 0
                              })}
                              {asset.exchange === 'KR' ? '원' : ''}
                            </span>
                          ) : '---'}
                        </TableCell>
                        <TableCell>
                          <span className="text-lg font-bold">
                            {valuationInBase > 0 ? formatCurrency(valuationInBase) : '---'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {!asset.tagId ? (
                              <span className="text-xs text-muted-foreground italic">-</span>
                            ) : (
                              (() => {
                                const tag = getTag(asset.tagId)
                                return tag ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] h-5 text-white border-none shadow-sm"
                                    style={{ backgroundColor: tag.color }}
                                  >
                                    {tag.name}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">-</span>
                                )
                              })()
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex justify-end gap-1">
                            <AssetDialog
                              onSave={saveAsset}
                              categories={categories}
                              tags={tags}
                              initialAsset={asset}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full h-8 w-8"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteAsset(asset.id)}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
