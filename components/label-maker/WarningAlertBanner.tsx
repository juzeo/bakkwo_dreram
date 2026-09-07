'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { calcNutrition } from '@/lib/nutrition'

type Warnings = ReturnType<typeof calcNutrition>['warnings']

export function WarningAlertBanner({ warnings, onGoRemodel }: { warnings: Warnings; onGoRemodel: () => void }) {
  if (!warnings.length) return null
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-warning-foreground">나트륨(또는 당류)이 기준치를 초과했습니다! 건강 레시피로 전환해 보세요.</p>
        {warnings.map(w => (
          <p key={w.nutrient} className="mt-1 text-sm text-muted-foreground">
            {w.nutrient === 'sodium' ? '나트륨' : '당류'} {w.nutrient === 'sodium' ? w.value.toFixed(0) + 'mg' : w.value.toFixed(1) + 'g'} · 1일 기준치 {w.dailyPct.toFixed(0)}%
            {w.mainCause ? ` · 주요 원인: ${w.mainCause}` : ''}
          </p>
        ))}
      </div>
      <Button render={<Link href="/remodeler" />} variant="outline" size="sm" onClick={onGoRemodel}>
        클린 레시피 리모델링으로 이어하기 <ArrowRight data-icon="inline-end" />
      </Button>
    </div>
  )
}
