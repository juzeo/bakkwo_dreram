'use client'

import { useEffect, useMemo, useState } from 'react'
import { GNB } from '@/components/common/GNB'
import { DisclaimerBanner } from '@/components/common/DisclaimerBanner'
import { ExportActionBar } from '@/components/export/ExportActionBar'
import { applyRemodel, calcNutrition, getApplicableRules, type Ingredient, type RemodelSelections } from '@/lib/nutrition'
import { readHandoff, type SavedRecipe } from '@/lib/mockData'
import { buildRemodelExportText } from '@/lib/export'
import { ComparisonDashboard } from './ComparisonDashboard'
import { NutritionDeltaChart } from './NutritionDeltaChart'

// 인계 데이터 없이 바로 들어왔을 때 보여줄 데모 레시피 (물엿·진간장 함유)
const DEMO_RECIPE: SavedRecipe = {
  menu: '제육볶음 (데모)',
  servings: 1,
  added: [
    { food_id: 1420, food_group: '육류', name: '돼지고기, 앞다리, 생것', kcal: 223, protein: 18.6, carbs: 0, fat: 16, sugar: 0, sodium: 57, fiber: 0, saturatedFat: 5.8, transFat: 0.1, cholesterol: 72, grams: 180, cookingMethod: 'STIR' },
    { food_id: 352, food_group: '조미료류', name: '진간장', kcal: 53, protein: 5.2, carbs: 5.6, fat: 0.1, sugar: 0.9, sodium: 5493, fiber: 0, saturatedFat: 0, transFat: 0, cholesterol: 0, grams: 15, cookingMethod: 'STIR' },
    { food_id: 610, food_group: '당류', name: '물엿', kcal: 317, protein: 0, carbs: 79, fat: 0, sugar: 42, sodium: 5, fiber: 0, saturatedFat: 0, transFat: 0, cholesterol: 0, grams: 30, cookingMethod: 'STIR' },
  ],
}

export function RemodelerPage() {
  const [source, setSource] = useState<SavedRecipe | null>(null)
  const [selections, setSelections] = useState<RemodelSelections>({})

  useEffect(() => {
    setSource(readHandoff())
  }, [])

  const recipe = source ?? DEMO_RECIPE
  const added: Ingredient[] = recipe.added

  const matches = useMemo(() => getApplicableRules(added), [added])

  // 레시피가 바뀌면(또는 최초 로드 시) 감지된 룰마다 기본으로 '국산 상생' 옵션을 선택해둠
  // (재료별로 자유롭게 유지/가성비/상생으로 바꿀 수 있음)
  useEffect(() => {
    const defaults: RemodelSelections = {}
    matches.forEach(({ rule }) => {
      const localFarmOption = rule.options.find(o => o.category === 'LOCAL_FARM')
      defaults[rule.id] = localFarmOption ? localFarmOption.id : null
    })
    setSelections(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.menu])

  const selectOption = (ruleId: string, optionId: string | null) => {
    setSelections(prev => ({ ...prev, [ruleId]: optionId }))
  }

  const { totals: originalTotals } = calcNutrition(added, recipe.servings)
  const result = useMemo(() => applyRemodel(added, selections), [added, selections])

  const anyLocalFarmSelected = matches.some(m => result.applied.some(a => a.rule.id === m.rule.id && a.option.category === 'LOCAL_FARM'))

  return (
    <div className="min-h-screen bg-background">
      <GNB />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-medium text-primary">클린 레시피 리모델러</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">익숙한 메뉴를 더 건강하게 바꿔보세요.</h1>
          <p className="mt-4 text-muted-foreground">재료별로 유지·일반 가성비·국산 상생 중 원하는 대체안을 자유롭게 섞어서 골라보세요.</p>
        </div>
        {source && <p className="mb-4 text-sm text-muted-foreground">'{source.menu}' 레시피를 자율 영양표시 카드에서 불러왔습니다.</p>}
        {!source && <p className="mb-4 text-sm text-muted-foreground">저장된 레시피가 없어 데모 레시피('{DEMO_RECIPE.menu}')로 보여드려요.</p>}

        <div id="exportable-remodel-card">
          <ComparisonDashboard
            originalKcal={originalTotals.kcal} originalSugar={originalTotals.sugar} originalSodium={originalTotals.sodium}
            improvedKcal={result.after.kcal} improvedSugar={result.after.sugar} improvedSodium={result.after.sodium}
            matches={matches}
            selections={selections}
            onSelectOption={selectOption}
          />

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.9fr]">
            <NutritionDeltaChart
              sugarBefore={originalTotals.sugar} sugarAfter={result.after.sugar} sugarReductionPct={result.sugarReductionPct}
              sodiumBefore={originalTotals.sodium} sodiumAfter={result.after.sodium} sodiumReductionPct={result.sodiumReductionPct}
            />
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-sm font-medium text-primary">선택한 대체재 적용 결과</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">나트륨 {result.sodiumReductionPct}% 절감</span>
                <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">당류 {result.sugarReductionPct}% 절감</span>
              </div>
            </div>
          </div>
          <DisclaimerBanner />
        </div>

        <div className="mt-6">
          <ExportActionBar
            cardElementId="exportable-remodel-card"
            filename={`${recipe.menu}-remodel`}
            exportText={() => buildRemodelExportText({
              menu: recipe.menu,
              servingWeight: added.reduce((s, i) => s + i.grams, 0) / Math.max(recipe.servings, 1),
              kcal: result.after.kcal, carbs: result.after.carbs, protein: result.after.protein, fat: result.after.fat,
              sugar: result.after.sugar, sodium: result.after.sodium,
              sugarReductionPct: result.sugarReductionPct, sodiumReductionPct: result.sodiumReductionPct,
              isLocalFarmTrack: anyLocalFarmSelected,
            })}
          />
        </div>
      </main>
    </div>
  )
}