import { DAILY_VALUE } from '@/lib/nutrition'
import { DisclaimerBanner } from '@/components/common/DisclaimerBanner'
import { PartnerBadge } from '@/components/common/Badge'

type NutrientSet = {
  kcal: number; carbs: number; sugar: number; fat: number; saturatedFat: number; transFat: number
  cholesterol: number; sodium: number; protein: number
}

function pct(value: number, key: keyof typeof DAILY_VALUE) {
  return (value / DAILY_VALUE[key]) * 100
}

// 식품 등의 표시기준 별표 서식을 그대로 따르는 두 컬럼(100g당 / 1인분당) 영양정보 카드.
function Row({
  label, indent, unit, per100g, perServing, dvKey,
}: {
  label: string
  indent?: boolean
  unit: string
  per100g: number
  perServing: number
  dvKey?: keyof typeof DAILY_VALUE // 없으면 %기준치 표시 안 함 (트랜스지방)
}) {
  return (
    <div className={`grid grid-cols-[1fr_100px_100px] items-baseline border-b border-gray-200 py-1.5 text-sm ${indent ? 'pl-4 text-[13px] text-gray-600' : 'font-medium'}`}>
      <span>{indent ? `– ${label}` : label}</span>
      <span className="text-right tabular-nums">
        {per100g.toFixed(1)}{unit}
        {dvKey && <span className="ml-1 text-xs text-gray-500">{pct(per100g, dvKey).toFixed(0)}%</span>}
      </span>
      <span className="text-right font-semibold tabular-nums">
        {perServing.toFixed(1)}{unit}
        {dvKey && <span className="ml-1 text-xs text-gray-500">{pct(perServing, dvKey).toFixed(0)}%</span>}
      </span>
    </div>
  )
}

// PNG 다운로드 대상(DOM 캡처 타깃). id="exportable-nutrition-card"는 상위에서 부여합니다.
export function NutritionCardPreview({
  menu, servings, servingWeight, totalWeight, per100g, perServing, showPartnerBadge,
}: {
  menu: string
  servings: number
  servingWeight: number // 1인분 조리 후 중량(g)
  totalWeight: number // 총 내용량(g) = servingWeight * servings
  per100g: NutrientSet
  perServing: NutrientSet
  showPartnerBadge?: boolean
}) {
  return (
    <div className="rounded-2xl border-2 border-black bg-white p-5 text-black">
      <div className="flex items-baseline justify-between border-b-4 border-black pb-2">
        <div>
          <h3 className="text-xl font-black tracking-tight">영양정보</h3>
          <p className="mt-1 text-xs text-gray-600">{menu}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">총 내용량 {Math.round(totalWeight)}g ({servings}인분 · 1인분 {Math.round(servingWeight)}g)</p>
          <p className="text-2xl font-black">{perServing.kcal.toFixed(0)}kcal <span className="text-xs font-normal text-gray-500">/ 1인분</span></p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_100px_100px] border-b-2 border-black py-1.5 text-xs font-semibold text-gray-600">
        <span>1일 영양성분 기준치에 대한 비율(%)</span>
        <span className="text-right">100g당</span>
        <span className="text-right">1인분당</span>
      </div>

      <div className="flex flex-col">
        <Row label="나트륨" unit="mg" per100g={per100g.sodium} perServing={perServing.sodium} dvKey="sodium" />
        <Row label="탄수화물" unit="g" per100g={per100g.carbs} perServing={perServing.carbs} dvKey="carbs" />
        <Row label="당류" indent unit="g" per100g={per100g.sugar} perServing={perServing.sugar} dvKey="sugar" />
        <Row label="지방" unit="g" per100g={per100g.fat} perServing={perServing.fat} dvKey="fat" />
        <Row label="트랜스지방" indent unit="g" per100g={per100g.transFat} perServing={perServing.transFat} />
        <Row label="포화지방" indent unit="g" per100g={per100g.saturatedFat} perServing={perServing.saturatedFat} dvKey="saturatedFat" />
        <Row label="콜레스테롤" unit="mg" per100g={per100g.cholesterol} perServing={perServing.cholesterol} dvKey="cholesterol" />
        <Row label="단백질" unit="g" per100g={per100g.protein} perServing={perServing.protein} dvKey="protein" />
      </div>

      <p className="mt-3 border-t-4 border-black pt-2 text-[11px] leading-4 text-gray-500">
        1일 영양성분 기준치에 대한 비율(%)은 2,000kcal 기준이므로 개인의 필요 열량에 따라 다를 수 있습니다.
      </p>

      {showPartnerBadge && <div className="mt-3"><PartnerBadge /></div>}
      <DisclaimerBanner />
    </div>
  )
}
