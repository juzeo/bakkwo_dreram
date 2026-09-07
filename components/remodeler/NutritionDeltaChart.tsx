function DeltaBar({ label, unit, before, after, reductionPct }: { label: string; unit: string; before: number; after: number; reductionPct: number }) {
  const max = Math.max(before, after, 1)
  const beforeWidth = (before / max) * 100
  const afterWidth = (after / max) * 100
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-xs font-medium text-primary">{reductionPct > 0 ? `▼ ${reductionPct}% 절감` : '변화 없음'}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="w-10 shrink-0 text-[11px] text-muted-foreground">기존</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-muted-foreground/40" style={{ width: `${beforeWidth}%` }} />
          </div>
          <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{before.toFixed(1)}{unit}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-10 shrink-0 text-[11px] text-muted-foreground">개선</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${afterWidth}%` }} />
          </div>
          <span className="w-16 shrink-0 text-right text-xs font-medium text-primary">{after.toFixed(1)}{unit}</span>
        </div>
      </div>
    </div>
  )
}

// 영양소 절감률 시각화 인포그래픽 (명세서 4장 NutritionDeltaChart.tsx)
export function NutritionDeltaChart({
  sugarBefore, sugarAfter, sugarReductionPct,
  sodiumBefore, sodiumAfter, sodiumReductionPct,
}: {
  sugarBefore: number; sugarAfter: number; sugarReductionPct: number
  sodiumBefore: number; sodiumAfter: number; sodiumReductionPct: number
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">영양소 절감 효과</h3>
      <div className="mt-4 flex flex-col gap-5">
        <DeltaBar label="나트륨 (mg)" unit="mg" before={sodiumBefore} after={sodiumAfter} reductionPct={sodiumReductionPct} />
        <DeltaBar label="당류 (g)" unit="g" before={sugarBefore} after={sugarAfter} reductionPct={sugarReductionPct} />
      </div>
    </div>
  )
}
