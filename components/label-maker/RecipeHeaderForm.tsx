'use client'

import { COOKING_METHODS, type CookingMethodCode } from '@/lib/nutrition'
import { TemplateSelector } from './TemplateSelector'
import type { MenuTemplate } from '@/lib/mockData'

export function RecipeHeaderForm({
  menu, onMenuChange,
  servings, onServingsChange,
  defaultMethod, onDefaultMethodChange,
  onLoadTemplate,
}: {
  menu: string
  onMenuChange: (v: string) => void
  servings: number
  onServingsChange: (v: number) => void
  defaultMethod: CookingMethodCode
  onDefaultMethodChange: (v: CookingMethodCode) => void
  onLoadTemplate: (t: MenuTemplate) => void
}) {
  return (
    <div className="mb-6 grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-[1fr_140px_180px_220px]">
      <label className="flex flex-col gap-2 text-sm font-medium">
        메뉴명
        <input value={menu} onChange={e => onMenuChange(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        인분수
        <input type="number" min={1} value={servings} onChange={e => onServingsChange(Math.max(1, Number(e.target.value) || 1))} className="h-10 rounded-lg border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        기본 조리법
        <select value={defaultMethod} onChange={e => onDefaultMethodChange(e.target.value as CookingMethodCode)} className="h-10 rounded-lg border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring">
          {COOKING_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </label>
      <TemplateSelector onSelect={onLoadTemplate} />
    </div>
  )
}
