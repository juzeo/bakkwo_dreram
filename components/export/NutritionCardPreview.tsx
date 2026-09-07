import { DAILY_VALUE, WARNING_THRESHOLD } from '@/lib/nutrition'
import { DisclaimerBanner } from '@/components/common/DisclaimerBanner'
import { PartnerBadge } from '@/components/common/Badge'

function StatusChip({ overThreshold }: { overThreshold: boolean }) {
  return (
    <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${overThreshold ? 'bg-warning/20 text-warning-foreground' : 'bg-primary/10 text-primary'}`}>
      {overThreshold ? '⚠️ 기준치 초과' : '적정'}
    </span>
  )
}

// PNG 다운로드 대상(DOM 캡처 타깃). id="exportable-nutrition-card"는 상위에서 부여합니다.
export function NutritionCardPreview({
  menu, servingWeight, kcal, carbs, protein, fat, sugar, sodium, fiber, showPartnerBadge,
}: {
  menu: string
  servingWeight: number
  kcal: number
  carbs: number
  protein: number
  fat: number
  sugar: number
  sodium: number
  fiber: number
  showPartnerBadge?: boolean
}) {
  const sodiumPct = (sodium / DAILY_VALUE.sodium) * 100
  const sugarPct = (sugar / DAILY_VALUE.sugar) * 100

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <p className="text-xs text-muted-foreground">자율 영양성분 안내 카드</p>
          <p className="mt-1 text-lg font-semibold">{menu}</p>
        </div>
        <span className="text-xs text-muted-foreground">1회 제공량 약 {Math.round(servingWeight)}g</span>
      </div>

      <div className="mt-4 rounded-xl bg-primary p-4 text-primary-foreground">
        <p className="text-xs opacity-80">열량 (Calories)</p>
        <p className="mt-1 text-2xl font-semibold">{kcal.toFixed(0)} kcal</p>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">나트륨 (Sodium)</span>
          <span className="font-medium">{sodium.toFixed(0)}mg <span className="text-xs text-muted-foreground">({sodiumPct.toFixed(0)}%)</span><StatusChip overThreshold={sodium >= WARNING_THRESHOLD.sodium} /></span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">탄수화물 (Carbohydrate)</span>
          <span className="font-medium">{carbs.toFixed(1)}g</span>
        </div>
        <div className="flex items-center justify-between pl-3">
          <span className="text-muted-foreground">– 당류 (Sugars)</span>
          <span className="font-medium">{sugar.toFixed(1)}g <span className="text-xs text-muted-foreground">({sugarPct.toFixed(0)}%)</span><StatusChip overThreshold={sugar >= WARNING_THRESHOLD.sugar} /></span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">지방 (Fat)</span>
          <span className="font-medium">{fat.toFixed(1)}g</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">단백질 (Protein)</span>
          <span className="font-medium">{protein.toFixed(1)}g</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">식이섬유</span>
          <span className="font-medium">{fiber.toFixed(1)}g</span>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">* 1일 영양성분 기준치에 대한 비율(%)을 반영하였습니다.</p>
      {showPartnerBadge && <div className="mt-3"><PartnerBadge /></div>}
      <DisclaimerBanner />
    </div>
  )
}
