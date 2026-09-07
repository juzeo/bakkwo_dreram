'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { MOCK_FOODS } from '@/lib/mockData'
import type { FoodItem } from '@/lib/nutrition'

export function IngredientSearchModal({
  open, onClose, onPick, excludeFoodIds,
}: {
  open: boolean
  onClose: () => void
  onPick: (food: FoodItem) => void
  excludeFoodIds: number[]
}) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 200)
  const [results, setResults] = useState<FoodItem[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!open) return
    const q = debouncedQuery.trim()
    if (!q) { setResults([]); return }
    let cancelled = false
    setIsSearching(true)
    fetch(`/api/v1/foods/search?q=${encodeURIComponent(q)}`)
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        if (!cancelled && data?.success) setResults(data.data ?? [])
      })
      .catch(() => {
        // TiDB 검색 실패 시 목업 데이터로 폴백
        if (!cancelled) setResults(MOCK_FOODS.filter(f => f.name.includes(q)))
      })
      .finally(() => { if (!cancelled) setIsSearching(false) })
    return () => { cancelled = true }
  }, [debouncedQuery, open])

  if (!open) return null
  const filtered = results.filter(item => !excludeFoodIds.includes(item.food_id))

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center bg-black/40 p-4 pt-24" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-popover p-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">식재료 검색 (DB 10.4)</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"><X className="size-4" /></button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="예: 간장, 돼지고기"
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="mt-3 max-h-72 overflow-y-auto">
          {isSearching && <p className="px-2 py-2 text-sm text-muted-foreground">검색 중…</p>}
          {!isSearching && query.trim() && !filtered.length && <p className="px-2 py-2 text-sm text-muted-foreground">검색 결과가 없습니다.</p>}
          {filtered.map(item => (
            <button
              key={item.food_id}
              onClick={() => { onPick(item); onClose() }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-secondary"
            >
              <span>
                <span className="font-medium">{item.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{item.food_group}</span>
              </span>
              <Plus className="size-4 text-primary" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
