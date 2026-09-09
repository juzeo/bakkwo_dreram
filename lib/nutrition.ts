// 서버(API route)와 클라이언트(실시간 미리보기)가 동일하게 사용하는 순수 로직 모듈입니다.
// react/dom 의존이 없으므로 Route Handler(Node 런타임)에서도 그대로 import 가능합니다.

export type CookingMethodCode = 'RAW' | 'BOIL' | 'STIR' | 'GRILL' | 'FRY'

export interface FoodItem {
  food_id: number
  food_group: string
  name: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  sugar: number
  sodium: number
  fiber: number
  saturatedFat: number
  transFat: number
  cholesterol: number // mg
}

export interface Ingredient extends FoodItem {
  grams: number
  cookingMethod: CookingMethodCode
}

// ── 로직 2: 조리 가열 수율(Yield Factor) — 명세서 3장 ──
export const COOKING_METHODS: { value: CookingMethodCode; label: string; yield: number }[] = [
  { value: 'RAW', label: '생것 / 단순무침', yield: 1.0 },
  { value: 'BOIL', label: '국 / 탕 / 찌개', yield: 0.98 },
  { value: 'STIR', label: '볶음 / 조림', yield: 0.88 },
  { value: 'GRILL', label: '구이', yield: 0.82 },
  { value: 'FRY', label: '튀김', yield: 1.06 },
]

// 식품 등의 표시기준 [별표] 1일 영양성분 기준치 (2,000kcal 기준). 트랜스지방은 기준치가 없어 %를 표시하지 않습니다.
export const DAILY_VALUE = { sodium: 2000, carbs: 324, sugar: 100, fat: 54, saturatedFat: 15, cholesterol: 300, protein: 55 }
export const WARNING_THRESHOLD = { sodium: 800, sugar: 20 } // 로직3: 1인분 기준 경고 트리거

export const DISCLAIMER_TEXT =
  "본 영양정보는 농촌진흥청 국가표준식품성분 DB 10.4 데이터를 기반으로 레시피 원재료 및 조리 수율을 환산하여 산출한 '외식 자율 영양표시 참고용' 정보입니다. 식품위생법상 완제품 가공식품의 법정 의무 시험성적서를 대체할 수 없습니다."

type NutrientTotals = {
  kcal: number; protein: number; carbs: number; fat: number; sugar: number; sodium: number; fiber: number
  saturatedFat: number; transFat: number; cholesterol: number
}

const ZERO_TOTALS: NutrientTotals = {
  kcal: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, sodium: 0, fiber: 0, saturatedFat: 0, transFat: 0, cholesterol: 0,
}

// ── 로직 1+2: 재료 집계 · 단위환산 · 수율보정 엔진 ──
export function calcNutrition(added: Ingredient[], servings: number) {
  const s = Math.max(servings, 1)
  const totals = added.reduce<NutrientTotals>((sum, item) => {
    const ratio = item.grams / 100
    return {
      kcal: sum.kcal + (item.kcal || 0) * ratio,
      protein: sum.protein + (item.protein || 0) * ratio,
      carbs: sum.carbs + (item.carbs || 0) * ratio,
      fat: sum.fat + (item.fat || 0) * ratio,
      sugar: sum.sugar + (item.sugar || 0) * ratio,
      sodium: sum.sodium + (item.sodium || 0) * ratio,
      fiber: sum.fiber + (item.fiber || 0) * ratio,
      saturatedFat: sum.saturatedFat + (item.saturatedFat || 0) * ratio,
      transFat: sum.transFat + (item.transFat || 0) * ratio,
      cholesterol: sum.cholesterol + (item.cholesterol || 0) * ratio,
    }
  }, ZERO_TOTALS)

  const perServing = Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, v / s])) as NutrientTotals

  const rawWeight = added.reduce((sum, item) => sum + item.grams, 0)
  const cookedWeight = added.reduce((sum, item) => {
    const yieldFactor = COOKING_METHODS.find(m => m.value === item.cookingMethod)?.yield ?? 1
    return sum + item.grams * yieldFactor
  }, 0)
  const cookedWeightPerServing = cookedWeight / s
  const averageYieldFactor = rawWeight > 0 ? cookedWeight / rawWeight : 1

  // 공식 영양표시 양식의 "100g당" 컬럼 — 조리 후(가식) 중량 기준으로 환산
  const per100g = cookedWeight > 0
    ? (Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, (v / cookedWeight) * 100])) as NutrientTotals)
    : ZERO_TOTALS

  const warnings = (['sodium', 'sugar'] as const)
    .filter(nutrient => perServing[nutrient] >= WARNING_THRESHOLD[nutrient])
    .map(nutrient => {
      const total = totals[nutrient] || 1
      const contributors = added.map(item => ({
        name: item.name,
        ratio: ((item[nutrient] || 0) * item.grams) / 100 / total,
      }))
      const topContributor = contributors.reduce<{ name: string; ratio: number } | null>(
        (top, current) => (top === null || current.ratio > top.ratio ? current : top),
        null,
      )
      return {
        nutrient,
        value: perServing[nutrient],
        dailyPct: (perServing[nutrient] / DAILY_VALUE[nutrient]) * 100,
        mainCause: topContributor !== null && topContributor.ratio >= 0.4 ? topContributor.name : null,
      }
    })

  return { totals, perServing, per100g, rawWeight, cookedWeight, cookedWeightPerServing, yieldFactor: averageYieldFactor, warnings }
}

// ── 로직 3: 대체 식재료 매핑 룰 (명세서 3장 Rule Matrix 5종 전체) ──
// 트랙(전체 전환) 대신, 재료마다 독립적으로 "가성비/상생" 중 선택하거나 유지할 수 있도록
// 각 룰이 여러 개의 개별 대체 옵션(options)을 갖는 구조로 바꿨습니다.
export type SubstituteCategory = 'AFFORDABLE' | 'LOCAL_FARM'
export type NutrientKey = 'sugar' | 'sodium'

export interface SubstituteOption {
  id: string
  category: SubstituteCategory
  label: string
  reason: string
  // 대상 식재료의 해당 영양소 기여분에 곱하는 배율 (1=변화없음, 0=완전제거)
  effects: Partial<Record<NutrientKey, number>>
}

export interface RemodelRule {
  id: string
  category: string // 명세서 표기 그대로 (예: '당류 #1')
  triggerNames: string[] // 이 중 하나라도 재료명에 포함되면 룰이 활성화됨
  primaryNutrient: NutrientKey
  options: SubstituteOption[]
}

export const RULE_MATRIX: RemodelRule[] = [
  {
    id: 'sugar_white',
    category: '당류 #1',
    triggerNames: ['백설탕', '흑설탕', '설탕'],
    primaryNutrient: 'sugar',
    options: [
      { id: 'sugar_white_allulose', category: 'AFFORDABLE', label: '합성/범용 알룰로스 분말', reason: '당류 98% 절감 (극단적 저당)', effects: { sugar: 0.02 } },
      { id: 'sugar_white_ricesyrup', category: 'LOCAL_FARM', label: '국산 쌀조청', reason: '비정제 천연당, 구수한 단맛', effects: { sugar: 0.65 } },
      { id: 'sugar_white_pear', category: 'LOCAL_FARM', label: '나주 배 농축액', reason: '천연 과당 + 유기산 보강, 은은한 단맛', effects: { sugar: 0.55 } },
    ],
  },
  {
    id: 'sugar_syrup',
    category: '당류 #2',
    triggerNames: ['물엿', '올리고당'],
    primaryNutrient: 'sugar',
    options: [
      { id: 'sugar_syrup_affordable', category: 'AFFORDABLE', label: '시판 대체 감미 시럽', reason: '칼로리 대폭 차단', effects: { sugar: 0.3 } },
      { id: 'sugar_syrup_onion', category: 'LOCAL_FARM', label: '국산 양파당(양파 퓨레)', reason: '천연 단맛 + 퀘르세틴/식이섬유 보충', effects: { sugar: 0.5 } },
    ],
  },
  {
    id: 'sodium_soy',
    category: '나트륨 #1',
    triggerNames: ['진간장', '국간장'],
    primaryNutrient: 'sodium',
    options: [
      { id: 'sodium_soy_affordable', category: 'AFFORDABLE', label: '범용 저염간장(산분해 혼합)', reason: '나트륨 30% 단순 감량', effects: { sodium: 0.7 } },
      { id: 'sodium_soy_local', category: 'LOCAL_FARM', label: '국산 전통 한식간장 + 표고가루', reason: '감칠맛(구아닐산) 보충으로 짠맛 만족도 유지, 나트륨 35% 감량', effects: { sodium: 0.65 } },
    ],
  },
  {
    id: 'sodium_salt',
    category: '나트륨 #2',
    triggerNames: ['정제염', '맛소금'],
    primaryNutrient: 'sodium',
    options: [
      { id: 'sodium_salt_affordable', category: 'AFFORDABLE', label: '저나트륨 칼륨염(KCl 대체)', reason: '나트륨 50% 대체', effects: { sodium: 0.5 } },
      { id: 'sodium_salt_kelp', category: 'LOCAL_FARM', label: '국산 다시마 가루', reason: '천연 알긴산·요오드 공급', effects: { sodium: 0.55 } },
      { id: 'sodium_salt_seamustard', category: 'LOCAL_FARM', label: '국산 미역귀 분말', reason: '풍부한 칼슘·식이섬유 및 감칠맛 보강', effects: { sodium: 0.5 } },
    ],
  },
  {
    id: 'sodium_gochujang',
    category: '나트륨 #3',
    triggerNames: ['고추장'],
    primaryNutrient: 'sodium',
    options: [
      { id: 'sodium_gochujang_affordable', category: 'AFFORDABLE', label: '시판 저칼로리 양념장', reason: '간편한 칼로리 조절', effects: { sodium: 0.8 } },
      { id: 'sodium_gochujang_local', category: 'LOCAL_FARM', label: '국산 영양 고춧가루 + 다진마늘 + 된장', reason: '숨은 정제당 70% 차단 및 고유 발효 풍미', effects: { sodium: 0.75, sugar: 0.3 } },
    ],
  },
]

export interface MatchedRule {
  rule: RemodelRule
  matchedItem: Ingredient
}

// 대체제 추천을 "실제 레시피 안의 재료"에만 매칭 (데이터 기반)
export function getApplicableRules(added: Ingredient[]): MatchedRule[] {
  const matches: MatchedRule[] = []
  for (const rule of RULE_MATRIX) {
    const matchedItem = added.find(item => rule.triggerNames.some(trigger => item.name.includes(trigger)))
    if (matchedItem) matches.push({ rule, matchedItem })
  }
  return matches
}

// ruleId -> 선택된 optionId (없거나 null이면 "유지"). 재료마다 독립적으로 선택 가능.
export type RemodelSelections = Record<string, string | null | undefined>

// 선택된 옵션들을 적용해 영양성분 재계산
export function applyRemodel(added: Ingredient[], selections: RemodelSelections) {
  const matches = getApplicableRules(added)
  const base = calcNutrition(added, 1) // 대체 적용은 재료 총량 기준(1배)으로 계산 후 그대로 사용

  const adjusted: NutrientTotals = { ...base.totals }
  const applied: { rule: RemodelRule; matchedItem: Ingredient; option: SubstituteOption }[] = []

  for (const { rule, matchedItem } of matches) {
    const optionId = selections[rule.id]
    if (!optionId) continue
    const option = rule.options.find(o => o.id === optionId)
    if (!option) continue
    applied.push({ rule, matchedItem, option })
    ;(Object.keys(option.effects) as NutrientKey[]).forEach(nutrient => {
      const multiplier = option.effects[nutrient]!
      const originalContribution = ((matchedItem[nutrient] || 0) * matchedItem.grams) / 100
      adjusted[nutrient] = adjusted[nutrient] - originalContribution + originalContribution * multiplier
    })
  }

  const reduction = (nutrient: NutrientKey) => {
    const before = base.totals[nutrient]
    const after = adjusted[nutrient]
    return before > 0 ? Math.round((1 - after / before) * 100) : 0
  }

  return {
    before: base.totals,
    after: adjusted,
    applied,
    matches,
    sugarReductionPct: reduction('sugar'),
    sodiumReductionPct: reduction('sodium'),
  }
}