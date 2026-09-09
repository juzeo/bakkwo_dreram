import { WARNING_THRESHOLD } from './nutrition'

function badge(value: number, threshold: number) {
  return value >= threshold ? '⚠️ 기준치 초과' : ''
}

// 포맷 1 (배달앱 텍스트) — 순정 레시피용
export function buildNutritionExportText(params: {
  menu: string; servingWeight: number; kcal: number; carbs: number; protein: number; fat: number; sugar: number; sodium: number
}) {
  const { menu, servingWeight, kcal, carbs, protein, fat, sugar, sodium } = params
  return [
    '[영양성분 안내 (자율 영양표시)]',
    `• 메뉴명: ${menu} (1인분 약 ${Math.round(servingWeight)}g 기준)`,
    `• 열량: ${kcal.toFixed(0)} kcal`,
    `• 탄수화물: ${carbs.toFixed(1)}g | 단백질: ${protein.toFixed(1)}g | 지방: ${fat.toFixed(1)}g`,
    `• 당류: ${sugar.toFixed(1)}g ${badge(sugar, WARNING_THRESHOLD.sugar)}`,
    `• 나트륨: ${sodium.toFixed(0)}mg ${badge(sodium, WARNING_THRESHOLD.sodium)}`,
    '* 본 정보는 농촌진흥청 국가표준식품성분 DB 10.4 기준 산출치이며, 매장 조리 환경에 따라 차이가 있을 수 있습니다.',
  ].join('\n')
}

// 포맷 1 (배달앱 텍스트) — 리모델링 완료본용. {remodel_badge_info} 라인 포함 (명세서 7장)
export function buildRemodelExportText(params: {
  menu: string
  servingWeight: number
  kcal: number; carbs: number; protein: number; fat: number; sugar: number; sodium: number
  sugarReductionPct: number
  sodiumReductionPct: number
  isLocalFarmTrack: boolean
}) {
  const { menu, servingWeight, kcal, carbs, protein, fat, sugar, sodium, sugarReductionPct, sodiumReductionPct, isLocalFarmTrack } = params
  const remodelBadgeInfo = isLocalFarmTrack
    ? `🟢 국산 농식품 상생 레시피 적용 매장 (나트륨 ${sodiumReductionPct}% · 당류 ${sugarReductionPct}% 절감)`
    : `✅ 클린 레시피 적용 (나트륨 ${sodiumReductionPct}% · 당류 ${sugarReductionPct}% 절감)`
  return [
    '[영양성분 안내 (자율 영양표시 · 리모델링 완료)]',
    `• 메뉴명: ${menu} (1인분 약 ${Math.round(servingWeight)}g 기준)`,
    `• 열량: ${kcal.toFixed(0)} kcal`,
    `• 탄수화물: ${carbs.toFixed(1)}g | 단백질: ${protein.toFixed(1)}g | 지방: ${fat.toFixed(1)}g`,
    `• 당류: ${sugar.toFixed(1)}g ${badge(sugar, WARNING_THRESHOLD.sugar)}`,
    `• 나트륨: ${sodium.toFixed(0)}mg ${badge(sodium, WARNING_THRESHOLD.sodium)}`,
    remodelBadgeInfo,
    '* 본 정보는 농촌진흥청 국가표준식품성분 DB 10.4 기준 산출치이며, 매장 조리 환경에 따라 차이가 있을 수 있습니다.',
  ].join('\n')
}

// 포맷 2 (안내 카드 이미지) — html-to-image 기반 PNG 다운로드
export async function downloadNodeAsPng(elementId: string, filename: string) {
  const node = document.getElementById(elementId)
  if (!node) return
  const { toPng } = await import('html-to-image')
  const dataUrl = await toPng(node, { pixelRatio: 2 })
  const link = document.createElement('a')
  link.download = `${filename || 'nutrition-card'}.png`
  link.href = dataUrl
  link.click()
}
