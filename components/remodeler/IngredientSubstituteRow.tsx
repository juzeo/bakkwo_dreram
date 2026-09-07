'use client'

import type { RemodelOption } from '@/lib/nutrition'

export function IngredientSubstituteRow({
  matchedItemName, option, active, onChange,
}: {
  matchedItemName: string
  option: RemodelOption
  active: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-background px-4 py-3 text-sm">
      <div className="min-w-0">
        <p>{matchedItemName} · {option.label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{option.reason}</p>
      </div>
      <button
        role="switch"
        aria-checked={active}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${active ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`absolute top-1 size-4 rounded-full bg-primary-foreground transition ${active ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )
}
