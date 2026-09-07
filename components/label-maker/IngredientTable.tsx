'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { COOKING_METHODS, type CookingMethodCode, type Ingredient } from '@/lib/nutrition'
import { useDebouncedValue } from '@/lib/useDebouncedValue'

function IngredientRow({
  item, onWeightChange, onMethodChange, onRemove,
}: {
  item: Ingredient
  onWeightChange: (grams: number) => void
  onMethodChange: (method: CookingMethodCode) => void
  onRemove: () => void
}) {
  // 입력창은 즉시 반응하되(로컬 state), 실제 재계산 반영은 200ms 디바운스로 지연시켜
  // 타이핑 중 잦은 재연산을 방지합니다. (명세서 IngredientTable.tsx 요구사항)
  const [draftGrams, setDraftGrams] = useState(item.grams)
  const debouncedGrams = useDebouncedValue(draftGrams, 200)

  useEffect(() => { setDraftGrams(item.grams) }, [item.food_id])
  useEffect(() => {
    if (debouncedGrams !== item.grams) onWeightChange(debouncedGrams)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedGrams])

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-secondary/70 p-3">
      <div className="min-w-[140px] flex-1">
        <p className="font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground">100g당 {item.kcal} kcal</p>
      </div>
      <select
        value={item.cookingMethod}
        onChange={e => onMethodChange(e.target.value as CookingMethodCode)}
        className="h-9 rounded-lg border border-input bg-background px-2 text-xs outline-none"
      >
        {COOKING_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
      <input
        aria-label={`${item.name} 중량`}
        value={draftGrams}
        onChange={e => setDraftGrams(Number(e.target.value) || 0)}
        className="h-9 w-20 rounded-lg border border-input bg-background px-2 text-right text-sm"
      />
      <span className="text-xs text-muted-foreground">g</span>
      <button aria-label={`${item.name} 삭제`} onClick={onRemove} className="rounded-lg p-2 text-muted-foreground hover:bg-background hover:text-destructive">
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}

export function IngredientTable({
  items, onWeightChange, onMethodChange, onRemove, onOpenSearch, rawWeight,
}: {
  items: Ingredient[]
  onWeightChange: (index: number, grams: number) => void
  onMethodChange: (index: number, method: CookingMethodCode) => void
  onRemove: (index: number) => void
  onOpenSearch: () => void
  rawWeight: number
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">식재료 입력</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{items.length}개 재료 · 원재료 총 {rawWeight}g</span>
          <button onClick={onOpenSearch} className="rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-secondary">+ 재료 검색</button>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-2">
        {items.map((item, index) => (
          <IngredientRow
            key={`${item.food_id}-${index}`}
            item={item}
            onWeightChange={grams => onWeightChange(index, grams)}
            onMethodChange={method => onMethodChange(index, method)}
            onRemove={() => onRemove(index)}
          />
        ))}
        {!items.length && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">'+ 재료 검색'으로 식재료를 추가해주세요.</p>}
      </div>
    </section>
  )
}
