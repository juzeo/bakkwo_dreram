'use client'

import { useState } from 'react'
import { GNB } from '@/components/common/GNB'
import { NutritionCardPreview } from '@/components/export/NutritionCardPreview'
import { ExportActionBar } from '@/components/export/ExportActionBar'
import { calcNutrition, type CookingMethodCode, type FoodItem, type Ingredient } from '@/lib/nutrition'
import { toIngredient, saveHandoff, readSavedRecipes, writeSavedRecipes, MOCK_FOODS, type SavedRecipeEntry, type MenuTemplate } from '@/lib/mockData'
import { buildNutritionExportText } from '@/lib/export'
import { RecipeHeaderForm } from './RecipeHeaderForm'
import { IngredientTable } from './IngredientTable'
import { IngredientSearchModal } from './IngredientSearchModal'
import { WarningAlertBanner } from './WarningAlertBanner'

export function LabelMakerPage() {
  const [menu, setMenu] = useState('닭가슴살 간장 덮밥')
  const [servings, setServings] = useState(1)
  const [defaultMethod, setDefaultMethod] = useState<CookingMethodCode>('STIR')
  const [added, setAdded] = useState<Ingredient[]>(() => [
    toIngredient(MOCK_FOODS.find(f => f.food_id === 1103)!, 120, 'STIR'),
    toIngredient(MOCK_FOODS.find(f => f.food_id === 352)!, 12, 'STIR'),
    toIngredient(MOCK_FOODS.find(f => f.food_id === 906)!, 50, 'STIR'),
  ])
  const [searchOpen, setSearchOpen] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const { perServing, per100g, cookedWeightPerServing, rawWeight, warnings } = calcNutrition(added, servings)

  const loadTemplate = (tpl: MenuTemplate) => {
    setMenu(tpl.menu_name)
    setServings(tpl.default_servings)
    setDefaultMethod(tpl.default_method)
    // 목업 환경: 템플릿에 지정된 food_id를 로컬 검색으로 못 찾을 수도 있으니 없는 항목은 건너뜀
    import('@/lib/mockData').then(({ MOCK_FOODS }) => {
      setAdded(
        tpl.ingredients
          .map(ing => {
            const food = MOCK_FOODS.find(f => f.food_id === ing.food_id)
            return food ? toIngredient(food, ing.grams, ing.cookingMethod) : null
          })
          .filter((x): x is Ingredient => x !== null),
      )
    })
  }

  const addIngredient = (food: FoodItem) => {
    setAdded(current => [toIngredient(food, 50, defaultMethod), ...current])
  }

  const handoffToRemodeler = () => {
    saveHandoff({ menu, servings, added })
  }

  const saveRecipe = () => {
    const entry: SavedRecipeEntry = {
      id: `${Date.now()}`,
      menu,
      servings,
      added,
      savedAt: Date.now(),
      summary: { kcal: perServing.kcal, sugar: perServing.sugar, sodium: perServing.sodium },
    }
    writeSavedRecipes([entry, ...readSavedRecipes()])
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <GNB />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-medium text-primary">자율 영양표시 카드</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">메뉴 영양성분을 투명하게 보여주세요.</h1>
          <p className="mt-4 text-muted-foreground">원재료와 중량을 입력하면 1인분 기준 영양정보를 자동으로 계산합니다.</p>
        </div>

        <WarningAlertBanner warnings={warnings} onGoRemodel={handoffToRemodeler} />

        <RecipeHeaderForm
          menu={menu} onMenuChange={setMenu}
          servings={servings} onServingsChange={setServings}
          defaultMethod={defaultMethod} onDefaultMethodChange={setDefaultMethod}
          onLoadTemplate={loadTemplate}
        />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <IngredientTable
            items={added}
            rawWeight={rawWeight}
            onWeightChange={(index, grams) => setAdded(current => current.map((entry, i) => i === index ? { ...entry, grams } : entry))}
            onMethodChange={(index, method) => setAdded(current => current.map((entry, i) => i === index ? { ...entry, cookingMethod: method } : entry))}
            onRemove={index => setAdded(current => current.filter((_, i) => i !== index))}
            onOpenSearch={() => setSearchOpen(true)}
          />

          <div id="exportable-nutrition-card">
            <NutritionCardPreview
              menu={menu}
              servings={servings}
              servingWeight={cookedWeightPerServing}
              totalWeight={cookedWeightPerServing * servings}
              per100g={per100g}
              perServing={perServing}
            />
          </div>
        </div>

        <div className="mt-6">
          <ExportActionBar
            cardElementId="exportable-nutrition-card"
            filename={menu}
            onSave={saveRecipe}
            savedFlash={justSaved}
            exportText={() => buildNutritionExportText({
              menu, servingWeight: cookedWeightPerServing,
              kcal: perServing.kcal, carbs: perServing.carbs, protein: perServing.protein, fat: perServing.fat,
              sugar: perServing.sugar, sodium: perServing.sodium,
            })}
          />
        </div>
      </main>

      <IngredientSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onPick={addIngredient}
        excludeFoodIds={added.map(a => a.food_id)}
      />
    </div>
  )
}
