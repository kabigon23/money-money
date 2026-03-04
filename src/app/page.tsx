'use client'

import { useState, useMemo, useEffect } from 'react'
import { Trash2, TrendingUp, TrendingDown, DollarSign, Wallet, Filter, Pencil, LogOut, User as UserIcon, Key } from 'lucide-react'
import { UserPasswordChangeDialog } from '@/components/UserPasswordChangeDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AssetDialog } from '@/components/AssetDialog'
import { MobileAssetCard } from '@/components/MobileAssetCard'
import { CategoryManager } from '@/components/CategoryManager'
import { TagManager } from '@/components/TagManager'
import { AssetAllocationChart } from '@/components/AssetAllocationChart'
import { Watchlist } from '@/components/Watchlist'
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
  const { user, logout, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [assets, setAssets] = useState<Asset[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'all'
    return localStorage.getItem('moneymoney_category') || 'all'
  })
  const [baseCurrency, setBaseCurrency] = useState<'KRW' | 'USD'>(() => {
    if (typeof window === 'undefined') return 'KRW'
    return (localStorage.getItem('moneymoney_currency') as 'KRW' | 'USD') || 'KRW'
  })
  const [dataLoading, setDataLoading] = useState(true)

  const { prices, exchangeRate, loading: pricesLoading } = useAssetPrices(assets)

  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      setDataLoading(true)
      try {
        const [assetsRes, categoriesRes, tagsRes] = await Promise.all([
          fetch(`/api/assets?userId=${user.id}`),
          fetch(`/api/categories?userId=${user.id}`),
          fetch(`/api/tags?userId=${user.id}`)
        ])

        const assetsData = await assetsRes.json()
        const categoriesData = await categoriesRes.json()
        const tagsData = await tagsRes.json()

        setAssets(assetsData)
        setCategories(categoriesData)
        setTags(tagsData)

        // 저장된 카테고리 ID가 실제로 존재하는지 검증 (삭제됐을 경우 전체로 fallback)
        const savedCategory = localStorage.getItem('moneymoney_category')
        if (savedCategory && savedCategory !== 'all') {
          const exists = categoriesData.some((c: { id: string }) => c.id === savedCategory)
          if (!exists) {
            setSelectedCategoryId('all')
            localStorage.removeItem('moneymoney_category')
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setDataLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  // Route Guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'USER')) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Persistence helpers
  const persistAssets = async (newAssets: Asset[]) => {
    try {
      if (!user) return
      await fetch(`/api/assets?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssets)
      })
    } catch (error) {
      console.error('Failed to persist assets:', error)
    }
  }

  const persistCategories = async (newCategories: Category[]) => {
    try {
      if (!user) return
      await fetch(`/api/categories?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategories)
      })
    } catch (error) {
      console.error('Failed to persist categories:', error)
    }
  }

  const persistTags = async (newTags: Tag[]) => {
    try {
      if (!user) return
      await fetch(`/api/tags?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTags)
      })
    } catch (error) {
      console.error('Failed to persist tags:', error)
    }
  }

  // 현금 자산 헬퍼
  const isCashAsset = (exchange: string) => exchange === 'CASH_KRW' || exchange === 'CASH_USD'

  // 통화 변환 헬퍼
  const getPriceInBase = (price: number, assetExchange: string) => {
    if (baseCurrency === 'KRW') {
      return (assetExchange === 'US' || assetExchange === 'CRYPTO' || assetExchange === 'CASH_USD')
        ? price * exchangeRate
        : price
    } else {
      return (assetExchange === 'KR' || assetExchange === 'CASH_KRW')
        ? price / exchangeRate
        : price
    }
  }

  const formatCurrency = (value: number) => {
    if (baseCurrency === 'KRW') {
      return `${Math.round(value).toLocaleString()}원`
    } else {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }

  const filteredAssets = useMemo(() => {
    if (selectedCategoryId === 'all') return assets
    return assets.filter(a => a.categoryId === selectedCategoryId)
  }, [assets, selectedCategoryId])

  // 포트폴리오 요약 계산 (선택된 카테고리 기준)
  const summary = useMemo(() => {
    let currentTotalValue = 0

    filteredAssets.forEach(asset => {
      // 현금 자산: 수량 자체가 해당 통화 금액 (currentPrice = 1)
      const currentPrice = isCashAsset(asset.exchange) ? 1 : (prices[asset.symbol]?.currentPrice || 0)
      const priceInBase = getPriceInBase(currentPrice, asset.exchange)
      currentTotalValue += asset.quantity * priceInBase
    })

    return { currentTotalValue }
  }, [filteredAssets, prices, baseCurrency, exchangeRate])

  if (authLoading || !user || user.role !== 'USER' || dataLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-xl font-bold italic" style={{ background: 'linear-gradient(90deg, #F59E0B, #FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Loading MoneyMoney...</div>
    </div>
  )

  const saveAsset = async (data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'> | Asset) => {
    let newAssets: Asset[]
    if ('id' in data) {
      // Update
      newAssets = assets.map(a => a.id === data.id ? { ...data, updatedAt: Date.now() } : a)
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
      newAssets = [...assets, asset]
    }
    setAssets(newAssets)
    await persistAssets(newAssets)
  }

  const deleteAsset = async (id: string) => {
    const newAssets = assets.filter(a => a.id !== id)
    setAssets(newAssets)
    await persistAssets(newAssets)
  }

  const addCategory = async (name: string) => {
    const newCategory: Category = {
      id: Math.random().toString(36).substr(2, 9),
      name,
    }
    const newCategories = [...categories, newCategory]
    setCategories(newCategories)
    await persistCategories(newCategories)
  }

  const deleteCategory = async (id: string) => {
    if (id === 'default') return
    const newCategories = categories.filter(c => c.id !== id)
    setCategories(newCategories)
    await persistCategories(newCategories)

    const newAssets = assets.map(a => a.categoryId === id ? { ...a, categoryId: 'default' } : a)
    setAssets(newAssets)
    await persistAssets(newAssets)

    if (selectedCategoryId === id) setSelectedCategoryId('all')
  }

  const addTag = async (name: string, color: string) => {
    const newTag: Tag = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      color,
    }
    const newTags = [...tags, newTag]
    setTags(newTags)
    await persistTags(newTags)
  }

  const deleteTag = async (id: string) => {
    const newTags = tags.filter(t => t.id !== id)
    setTags(newTags)
    await persistTags(newTags)

    const newAssets = assets.map(a => ({
      ...a,
      tagId: a.tagId === id ? null : a.tagId
    }))
    setAssets(newAssets)
    await persistAssets(newAssets)
  }

  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || '기본'
  }

  const getTag = (id: string) => {
    return tags.find(t => t.id === id)
  }

  return (
    <div className="flex flex-col gap-8 min-h-screen p-8 pb-20 max-w-7xl mx-auto font-[family-name:var(--font-geist-sans)]">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10 py-4 -mx-8 px-8 border-b">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
            <span className="text-xl md:text-2xl">💰</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-300 animate-ping opacity-75"></div>
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #F59E0B 0%, #B45309 60%, #92400E 100%)' }}>
              MoneyMoney
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm italic font-medium tracking-wide">
              Focus on Current Value Tracking.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <div className="flex flex-col items-end mr-2">
            <div className="flex bg-muted p-1 rounded-lg">
              <Button
                variant={baseCurrency === 'KRW' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs"
                onClick={() => { setBaseCurrency('KRW'); localStorage.setItem('moneymoney_currency', 'KRW') }}
              >
                KRW
              </Button>
              <Button
                variant={baseCurrency === 'USD' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs"
                onClick={() => { setBaseCurrency('USD'); localStorage.setItem('moneymoney_currency', 'USD') }}
              >
                USD
              </Button>
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 font-mono">
              1 USD = {exchangeRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}원
            </span>
          </div>

          <div className="hidden md:flex gap-2">
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
          </div>

          <AssetDialog onSave={saveAsset} categories={categories} tags={tags} />

          <div className="h-8 w-px bg-border mx-1 md:mx-2" />

          <div className="flex items-center gap-2 md:gap-3 pl-1 md:pl-2">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-primary flex items-center gap-1">
                <UserIcon className="w-3 h-3" /> {user.nickname}
              </span>
              <span className="text-[10px] text-muted-foreground tracking-tighter uppercase hidden md:block">Standard User</span>
            </div>
            <UserPasswordChangeDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  title="비밀번호 변경"
                  className="rounded-full h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                >
                  <Key className="w-4 h-4" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="rounded-full hover:bg-destructive/10 hover:text-destructive h-8 w-8 md:h-9 md:w-9"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Management Buttons */}
        <div className="flex md:hidden gap-2 w-full">
          <div className="flex-1">
            <CategoryManager
              categories={categories}
              onAddCategory={addCategory}
              onDeleteCategory={deleteCategory}
            />
          </div>
          <div className="flex-1">
            <TagManager
              tags={tags}
              onAddTag={addTag}
              onDeleteTag={deleteTag}
            />
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-8">
        <div className="grid gap-6 md:grid-cols-1">
          <Card className="hover:shadow-lg transition-all border-l-4 border-l-primary bg-primary/5">
            <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  {selectedCategoryId === 'all' ? '현재 총 자산 가치' : `${getCategoryName(selectedCategoryId)} 자산 가치`}
                </CardTitle>
              </div>
              <Select value={selectedCategoryId} onValueChange={(v) => { setSelectedCategoryId(v); if (v === 'all') localStorage.removeItem('moneymoney_category'); else localStorage.setItem('moneymoney_category', v) }}>
                <SelectTrigger className="w-[130px] h-8 text-xs shrink-0">
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
              <CardTitle>관심 종목 시세</CardTitle>
              <CardDescription>원하는 종목을 추가하고 실시간 시세를 확인하세요</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <Watchlist userId={user.id} />
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle>보유 자산 상세</CardTitle>
            <CardDescription>현재 티커와 수량 기반 자동 시세 반영 중</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredAssets.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground border-2 border-dashed m-6 rounded-xl bg-muted/5">
                {assets.length === 0 ? "아직 등록된 자산이 없습니다. '종목 추가' 버튼을 눌러 자산을 등록해 보세요." : "선택한 카테고리에 자산이 없습니다."}
              </div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="block md:hidden space-y-4 p-4 bg-muted/20">
                  {filteredAssets.map((asset) => {
                    const priceInfo = prices[asset.symbol]
                    const currentPrice = isCashAsset(asset.exchange) ? 1 : (priceInfo?.currentPrice || 0)
                    const valuationInBase = asset.quantity * getPriceInBase(currentPrice, asset.exchange)
                    const isUSDNative = asset.exchange === 'US' || asset.exchange === 'CRYPTO' || asset.exchange === 'CASH_USD'

                    return (
                      <MobileAssetCard
                        key={asset.id}
                        asset={asset}
                        currentPrice={currentPrice}
                        priceChange={priceInfo ? { change: priceInfo.change, changePercent: priceInfo.changePercent } : undefined}
                        priceInfo={priceInfo}
                        valuation={valuationInBase}
                        categoryName={getCategoryName(asset.categoryId)}
                        tag={asset.tagId ? getTag(asset.tagId) : undefined}
                        onSave={saveAsset}
                        onDelete={deleteAsset}
                        categories={categories}
                        tags={tags}
                        isUSDNative={isUSDNative}
                        formatCurrency={formatCurrency}
                      />
                    )
                  })}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block">
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
                      {filteredAssets.map((asset) => {
                        const priceInfo = prices[asset.symbol]
                        const currentPrice = isCashAsset(asset.exchange) ? 1 : (priceInfo?.currentPrice || 0)
                        const valuationInBase = asset.quantity * getPriceInBase(currentPrice, asset.exchange)

                        return (
                          <TableRow key={asset.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="px-6">
                              <div className="flex flex-col gap-1">
                                <Badge
                                  variant={asset.exchange === 'US' ? 'default' : (asset.exchange === 'CRYPTO' || isCashAsset(asset.exchange)) ? 'outline' : 'secondary'}
                                  className={`w-fit ${asset.exchange === 'CRYPTO' ? 'bg-orange-500/10 text-orange-600 border-orange-200' :
                                    isCashAsset(asset.exchange) ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : ''
                                    }`}
                                >
                                  {asset.exchange === 'CASH_KRW' ? '현금 KRW' : asset.exchange === 'CASH_USD' ? '현금 USD' : asset.exchange}
                                </Badge>
                                <span className="text-xs font-semibold text-muted-foreground">
                                  {getCategoryName(asset.categoryId)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-primary">
                                  {asset.exchange === 'KR' ? asset.name : asset.symbol}
                                </span>
                                <span className="text-xs text-muted-foreground tracking-widest">
                                  {asset.exchange === 'KR' ? asset.symbol : asset.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono">{asset.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}</TableCell>
                            <TableCell className="font-mono">
                              {isCashAsset(asset.exchange) ? (
                                <span className="text-xs text-muted-foreground italic">
                                  {asset.exchange === 'CASH_KRW' ? '원화 현금' : '달러 현금'}
                                </span>
                              ) : currentPrice > 0 ? (
                                <div className="flex flex-col gap-0.5">
                                  {/* 세션 배지 (US만) */}
                                  {asset.exchange === 'US' && priceInfo?.marketSession && priceInfo.marketSession !== 'REGULAR' && (
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded w-fit ${priceInfo.marketSession === 'PRE'
                                        ? 'bg-violet-500/15 text-violet-500'
                                        : priceInfo.marketSession === 'POST'
                                          ? 'bg-orange-500/15 text-orange-500'
                                          : priceInfo.marketSession === 'NIGHT'
                                            ? 'bg-cyan-500/15 text-cyan-500'
                                            : 'bg-muted text-muted-foreground'
                                      }`}>
                                      {priceInfo.marketSession === 'PRE' ? '프리장'
                                        : priceInfo.marketSession === 'POST' ? '에프터장'
                                          : priceInfo.marketSession === 'NIGHT' ? '나이트'
                                            : '장마감'}
                                    </span>
                                  )}
                                  {/* 실효 가격 */}
                                  <span className="flex items-center gap-1">
                                    {(asset.exchange === 'US' || asset.exchange === 'CRYPTO') ? '$' : ''}
                                    {currentPrice.toLocaleString(undefined, {
                                      minimumFractionDigits: asset.exchange === 'CRYPTO' ? 2 : 2,
                                      maximumFractionDigits: asset.exchange === 'CRYPTO' ? 2 : 2
                                    })}
                                    {asset.exchange === 'KR' ? '원' : ''}
                                  </span>
                                  {/* 등락 */}
                                  {priceInfo && (
                                    <span className={`text-xs font-bold flex items-center gap-0.5 ${priceInfo.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                      {priceInfo.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                      {priceInfo.change >= 0 ? '+' : ''}{priceInfo.changePercent.toFixed(2)}%
                                    </span>
                                  )}
                                  {/* 장외일 때 정규장 종가도 함께 표시 */}
                                  {asset.exchange === 'US' && priceInfo?.marketSession && priceInfo.marketSession !== 'REGULAR' && priceInfo.regularPrice && (
                                    <span className="text-[10px] text-muted-foreground">
                                      종가 ${priceInfo.regularPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  )}
                                </div>
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
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div >
  )
}
