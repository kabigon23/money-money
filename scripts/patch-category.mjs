import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const filePath = join(__dirname, '..', 'src', 'app', 'page.tsx')

let src = readFileSync(filePath, 'utf8')

const BT = String.fromCharCode(96)
let count = 0

function replace(oldStr, newStr, label) {
  if (!src.includes(oldStr)) { console.error(`❌ Not found: ${label}`); process.exit(1) }
  src = src.replace(oldStr, newStr)
  console.log(`✅ ${label}`)
  count++
}

// ─── 1. imports ──────────────────────────────────────────────────────────────
replace(
  `import { useState, useMemo, useEffect, useCallback } from 'react'`,
  `import { useState, useMemo, useEffect, useCallback, useRef } from 'react'`,
  'useRef import'
)
replace(
  `import { Trash2, TrendingUp, TrendingDown, DollarSign, Wallet, Filter, Pencil, LogOut, User as UserIcon, Key, Download } from 'lucide-react'`,
  `import { Trash2, TrendingUp, TrendingDown, DollarSign, Wallet, Filter, Pencil, LogOut, User as UserIcon, Key, Download, ChevronDown, Check } from 'lucide-react'`,
  'ChevronDown/Check import'
)
// Select import 제거
src = src.replace(
  `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'\r\n`,
  ``
)
console.log('✅ Select import removed')

// ─── 2. State 교체 ────────────────────────────────────────────────────────────
replace(
  `  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {\r\n    if (typeof window === 'undefined') return 'all'\r\n    return localStorage.getItem('moneymoney_category') || 'all'\r\n  })`,
  [
    `  // 선택된 카테고리 ID 목록. 빈 배열 = 전체`,
    `  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() => {`,
    `    if (typeof window === 'undefined') return []`,
    `    try {`,
    `      const saved = localStorage.getItem('moneymoney_categories_v2')`,
    `      return saved ? JSON.parse(saved) : []`,
    `    } catch { return [] }`,
    `  })`,
    `  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)`,
    `  const categoryDropdownRef = useRef<HTMLDivElement>(null)`,
  ].join('\r\n'),
  'state selectedCategoryIds'
)

// ─── 3. 카테고리 로드 검증 교체 ────────────────────────────────────────────────
replace(
  [
    `        // 저장된 카테고리 ID가 실제로 존재하는지 검증 (삭제됐을 경우 전체로 fallback)`,
    `        const savedCategory = localStorage.getItem('moneymoney_category')`,
    `        if (savedCategory && savedCategory !== 'all') {`,
    `          const exists = categoriesData.some((c: { id: string }) => c.id === savedCategory)`,
    `          if (!exists) {`,
    `            setSelectedCategoryId('all')`,
    `            localStorage.removeItem('moneymoney_category')`,
    `          }`,
    `        }`,
  ].join('\r\n'),
  [
    `        // 저장된 카테고리 ID들이 실제로 존재하는지 검증 (삭제된 경우 제거)`,
    `        const savedCategories = (() => {`,
    `          try {`,
    `            const raw = localStorage.getItem('moneymoney_categories_v2')`,
    `            return raw ? (JSON.parse(raw) as string[]) : []`,
    `          } catch { return [] }`,
    `        })()`,
    `        if (savedCategories.length > 0) {`,
    `          const validIds = savedCategories.filter((id: string) =>`,
    `            categoriesData.some((c: { id: string }) => c.id === id)`,
    `          )`,
    `          setSelectedCategoryIds(validIds)`,
    `          localStorage.setItem('moneymoney_categories_v2', JSON.stringify(validIds))`,
    `        }`,
  ].join('\r\n'),
  'category validation on load'
)

// ─── 4. cashAssets / filteredAssets + 헬퍼 삽입 ──────────────────────────────
replace(
  [
    `  const cashAssets = useMemo(() => {`,
    `    const allCash = assets.filter(a => isCashAsset(a.exchange))`,
    `    if (selectedCategoryId === 'all') return allCash`,
    `    return allCash.filter(a => a.categoryId === selectedCategoryId)`,
    `  }, [assets, selectedCategoryId])`,
    ``,
    `  const filteredAssets = useMemo(() => {`,
    `    const nonCash = assets.filter(a => !isCashAsset(a.exchange))`,
    `    if (selectedCategoryId === 'all') return nonCash`,
    `    return nonCash.filter(a => a.categoryId === selectedCategoryId)`,
    `  }, [assets, selectedCategoryId])`,
  ].join('\r\n'),
  [
    `  const isAllSelected = selectedCategoryIds.length === 0`,
    ``,
    `  // 카테고리 필터 레이블 (UI 표시용)`,
    `  const categoryFilterLabel = useMemo(() => {`,
    `    if (isAllSelected) return '전체'`,
    `    if (selectedCategoryIds.length === 1) return getCategoryName(selectedCategoryIds[0])`,
    `    return ` + BT + `\${selectedCategoryIds.length}개 카테고리` + BT,
    `  }, [selectedCategoryIds, categories])`,
    ``,
    `  // 카테고리 토글 헬퍼`,
    `  const toggleCategory = (id: string) => {`,
    `    setSelectedCategoryIds(prev => {`,
    `      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]`,
    `      localStorage.setItem('moneymoney_categories_v2', JSON.stringify(next))`,
    `      return next`,
    `    })`,
    `  }`,
    `  const selectAllCategories = () => {`,
    `    setSelectedCategoryIds([])`,
    `    localStorage.setItem('moneymoney_categories_v2', JSON.stringify([]))`,
    `  }`,
    ``,
    `  // 드롭다운 외부 클릭 시 닫기`,
    `  useEffect(() => {`,
    `    const handler = (e: MouseEvent) => {`,
    `      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {`,
    `        setCategoryDropdownOpen(false)`,
    `      }`,
    `    }`,
    `    document.addEventListener('mousedown', handler)`,
    `    return () => document.removeEventListener('mousedown', handler)`,
    `  }, [])`,
    ``,
    `  const cashAssets = useMemo(() => {`,
    `    const allCash = assets.filter(a => isCashAsset(a.exchange))`,
    `    if (isAllSelected) return allCash`,
    `    return allCash.filter(a => selectedCategoryIds.includes(a.categoryId))`,
    `  }, [assets, selectedCategoryIds, isAllSelected])`,
    ``,
    `  const filteredAssets = useMemo(() => {`,
    `    const nonCash = assets.filter(a => !isCashAsset(a.exchange))`,
    `    if (isAllSelected) return nonCash`,
    `    return nonCash.filter(a => selectedCategoryIds.includes(a.categoryId))`,
    `  }, [assets, selectedCategoryIds, isAllSelected])`,
  ].join('\r\n'),
  'cashAssets + filteredAssets + helpers'
)

// ─── 5. deleteCategory ───────────────────────────────────────────────────────
replace(
  `    if (selectedCategoryId === id) setSelectedCategoryId('all')`,
  [
    `    // 삭제된 카테고리가 선택 상태에 있으면 제거`,
    `    setSelectedCategoryIds(prev => {`,
    `      const next = prev.filter(x => x !== id)`,
    `      localStorage.setItem('moneymoney_categories_v2', JSON.stringify(next))`,
    `      return next`,
    `    })`,
  ].join('\r\n'),
  'deleteCategory'
)

// ─── 6. 총 자산 카드 타이틀 ──────────────────────────────────────────────────
replace(
  `{selectedCategoryId === 'all' ? '현재 총 자산 가치' : ` + BT + `\${getCategoryName(selectedCategoryId)} 자산 가치` + BT + `}`,
  `{isAllSelected ? '현재 총 자산 가치' : ` + BT + `\${categoryFilterLabel} 자산 가치` + BT + `}`,
  'total value card title'
)

// ─── 7. Select → 체크박스 드롭다운 ──────────────────────────────────────────
replace(
  [
    `              <Select value={selectedCategoryId} onValueChange={(v) => { setSelectedCategoryId(v); if (v === 'all') localStorage.removeItem('moneymoney_category'); else localStorage.setItem('moneymoney_category', v) }}>`,
    `                <SelectTrigger className="w-[130px] h-8 text-xs shrink-0">`,
    `                  <SelectValue placeholder="카테고리 선택" />`,
    `                </SelectTrigger>`,
    `                <SelectContent>`,
    `                  <SelectItem value="all">전체</SelectItem>`,
    `                  {categories.map(c => (`,
    `                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>`,
    `                  ))}`,
    `                </SelectContent>`,
    `              </Select>`,
  ].join('\r\n'),
  [
    `              {/* 멀티 선택 카테고리 드롭다운 */}`,
    `              <div ref={categoryDropdownRef} className="relative">`,
    `                <button`,
    `                  onClick={() => setCategoryDropdownOpen(v => !v)}`,
    `                  className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md border bg-background hover:bg-muted transition-colors shrink-0 min-w-[130px] justify-between"`,
    `                >`,
    `                  <span className="truncate">{categoryFilterLabel}</span>`,
    `                  <ChevronDown className={` + BT + `h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform \${categoryDropdownOpen ? 'rotate-180' : ''}` + BT + `} />`,
    `                </button>`,
    ``,
    `                {categoryDropdownOpen && (`,
    `                  <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border bg-popover shadow-xl overflow-hidden">`,
    `                    <button`,
    `                      onClick={selectAllCategories}`,
    `                      className={` + BT + `flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-left hover:bg-muted transition-colors \${`,
    `                        isAllSelected ? 'text-primary bg-primary/5' : 'text-muted-foreground'`,
    `                      }` + BT + `}`,
    `                    >`,
    `                      <span className={` + BT + `flex items-center justify-center w-4 h-4 rounded border-2 shrink-0 transition-colors \${`,
    `                        isAllSelected ? 'bg-primary border-primary' : 'border-input'`,
    `                      }` + BT + `}>`,
    `                        {isAllSelected && <Check className="w-2.5 h-2.5 text-white" />}`,
    `                      </span>`,
    `                      전체`,
    `                    </button>`,
    `                    <div className="h-px bg-border mx-2" />`,
    `                    {categories.map(c => {`,
    `                      const checked = selectedCategoryIds.includes(c.id)`,
    `                      return (`,
    `                        <button`,
    `                          key={c.id}`,
    `                          onClick={() => toggleCategory(c.id)}`,
    `                          className={` + BT + `flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-left hover:bg-muted transition-colors \${`,
    `                            checked ? 'text-primary bg-primary/5' : 'text-foreground'`,
    `                          }` + BT + `}`,
    `                        >`,
    `                          <span className={` + BT + `flex items-center justify-center w-4 h-4 rounded border-2 shrink-0 transition-colors \${`,
    `                            checked ? 'bg-primary border-primary' : 'border-input'`,
    `                          }` + BT + `}>`,
    `                            {checked && <Check className="w-2.5 h-2.5 text-white" />}`,
    `                          </span>`,
    `                          {c.name}`,
    `                        </button>`,
    `                      )`,
    `                    })}`,
    `                  </div>`,
    `                )}`,
    `              </div>`,
  ].join('\r\n'),
  'Select → checkbox dropdown'
)

// ─── 8. 자산 비중 차트 설명 ──────────────────────────────────────────────────
replace(
  `{selectedCategoryId === 'all' ? '전체 카테고리' : ` + BT + `\${getCategoryName(selectedCategoryId)} 카테고리` + BT + `} 내의 태그 분포`,
  `{isAllSelected ? '전체 카테고리' : ` + BT + `\${categoryFilterLabel} 카테고리` + BT + `} 내의 태그 분포`,
  'asset chart description'
)

// ─── 9. 현금 카드 타이틀 ─────────────────────────────────────────────────────
replace(
  [
    `                  {selectedCategoryId !== 'all' && (`,
    `                    <span className="text-xs font-normal text-muted-foreground ml-1">`,
    `                      · {getCategoryName(selectedCategoryId)}`,
    `                    </span>`,
    `                  )}`,
  ].join('\r\n'),
  [
    `                  {!isAllSelected && (`,
    `                    <span className="text-xs font-normal text-muted-foreground ml-1">`,
    `                      · {categoryFilterLabel}`,
    `                    </span>`,
    `                  )}`,
  ].join('\r\n'),
  'cash card title label'
)

// ─── 10. 현금 없을 때 메시지 ─────────────────────────────────────────────────
// 파일에 U+2018(\u2018, ')와 U+2019(\u2019, ')가 사용됨!
const emptyMsgOld = "selectedCategoryId === 'all'\r\n                    ? '" + "\uC544\uB798 \uBC84\uD2BC\uC73C\uB85C \uD604\uAE08\uC744 \uCD94\uAC00\uD574 \uBCF4\uC138\uC694" + "'\r\n                    : " + BT + "\u2018${getCategoryName(selectedCategoryId)}\u2019 \uCE74\uD14C\uACE0\uB9AC\uC5D0 \uB4F1\uB85D\uB41C \uD604\uAE08\uC774 \uC5C6\uC2B5\uB2C8\uB2E4" + BT + "\r\n                  }"
const emptyMsgNew = "isAllSelected\r\n                    ? '" + "\uC544\uB798 \uBC84\uD2BC\uC73C\uB85C \uD604\uAE08\uC744 \uCD94\uAC00\uD574 \uBCF4\uC138\uC694" + "'\r\n                    : " + BT + "\u2018\${categoryFilterLabel}\u2019 \uCE74\uD14C\uACE0\uB9AC\uC5D0 \uB4F1\uB85D\uB41C \uD604\uAE08\uC774 \uC5C6\uC2B5\uB2C8\uB2E4" + BT + "\r\n                  }"
if (!src.includes(emptyMsgOld)) { console.error('❌ Not found: cash empty message'); process.exit(1) }
src = src.replace(emptyMsgOld, emptyMsgNew)
console.log('✅ cash empty message')

// ─── 11. 현금 추가 버튼 defaultCategoryId (2군데) ────────────────────────────
const oldDefaultCat = `defaultCategoryId={selectedCategoryId === 'all' ? 'default' : selectedCategoryId}`
const newDefaultCat = `defaultCategoryId={isAllSelected || selectedCategoryIds.length !== 1 ? 'default' : selectedCategoryIds[0]}`
const before = src.split(oldDefaultCat).length - 1
src = src.split(oldDefaultCat).join(newDefaultCat)
console.log(`✅ defaultCategoryId (${before} occurrences replaced)`)

writeFileSync(filePath, src, 'utf8')
console.log(`\n✅ All ${count} patches applied successfully`)
