'use client'

import type { Ingredient, RemodelRule, SubstituteCategory } from '@/lib/nutrition'

export function IngredientSubstituteRow({
  matchedItem, rule, selectedOptionId, onSelect,
}: {
  matchedItem: Ingredient
  rule: RemodelRule
  selectedOptionId: string | null
  onSelect: (optionId: string | null) => void
}) {
  const selectedOption = rule.options.find(o => o.id === selectedOptionId) ?? null
  const selectedCategory: SubstituteCategory | 'NONE' = selectedOption?.category ?? 'NONE'
  const optionsIn = (category: SubstituteCategory) => rule.options.filter(o => o.category === category)

  const pickCategory = (category: SubstituteCategory) => {
    const firstOption = optionsIn(category)[0]
    onSelect(firstOption ? firstOption.id : null)
  }

  return (
    <div className="rounded-xl bg-background px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 truncate">
          {matchedItem.name} <span className="text-xs text-muted-foreground">{matchedItem.grams}g · {rule.category}</span>
        </p>
        <div className="flex shrink-0 overflow-hidden rounded-full border border-input text-xs">
          <button
            onClick={() => onSelect(null)}
            className={`px-2.5 py-1 transition ${selectedCategory === 'NONE' ? 'bg-muted font-medium' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            유지
          </button>
          <button
            onClick={() => pickCategory('AFFORDABLE')}
            className={`border-l border-input px-2.5 py-1 transition ${selectedCategory === 'AFFORDABLE' ? 'bg-secondary font-medium text-secondary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            일반 가성비
          </button>
          <button
            onClick={() => pickCategory('LOCAL_FARM')}
            className={`border-l border-input px-2.5 py-1 transition ${selectedCategory === 'LOCAL_FARM' ? 'bg-primary font-medium text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            국산 상생
          </button>
        </div>
      </div>

      {selectedOption && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {optionsIn(selectedOption.category).length > 1 ? (
            <select
              value={selectedOption.id}
              onChange={e => onSelect(e.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
            >
              {optionsIn(selectedOption.category).map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          ) : (
            <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium">{selectedOption.label}</span>
          )}
          <span className="text-xs text-muted-foreground">{selectedOption.reason}</span>
        </div>
      )}
    </div>
  )
}