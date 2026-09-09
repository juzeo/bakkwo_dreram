import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { calcNutrition, type CookingMethodCode, type Ingredient } from '@/lib/nutrition'

// 명세서 5장 3) 실시간 영양성분 산출 API
// 클라이언트의 즉시 미리보기와 동일한 lib/nutrition.ts 함수를 사용하므로 값이 절대 어긋나지 않습니다.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const servings: number = body.servings ?? 1
    const cookingMethod: CookingMethodCode = body.cooking_method ?? 'STIR'
    const requested: { food_id: number; weight_g: number }[] = body.ingredients ?? []

    if (!requested.length) {
      return NextResponse.json({ success: false, message: 'ingredients가 비어 있습니다.' }, { status: 400 })
    }

    const foodIds = requested.map(r => r.food_id)
    const [rows] = await pool.query(
      `SELECT food_id, food_group, food_name, energy_kcal, protein_g, fat_g, carb_g, sugar_g, sodium_mg, fiber_g,
              saturated_fat_g, trans_fat_g, cholesterol_mg
       FROM foods WHERE food_id IN (${foodIds.map(() => '?').join(',')})`,
      foodIds,
    )
    const foods = rows as any[]

    const added: Ingredient[] = requested.map(r => {
      const f = foods.find(x => x.food_id === r.food_id)
      if (!f) throw new Error(`food_id ${r.food_id}를 찾을 수 없습니다.`)
      return {
        food_id: f.food_id,
        food_group: f.food_group,
        name: f.food_name,
        kcal: f.energy_kcal ?? 0,
        protein: f.protein_g ?? 0,
        fat: f.fat_g ?? 0,
        carbs: f.carb_g ?? 0,
        sugar: f.sugar_g ?? 0,
        sodium: f.sodium_mg ?? 0,
        fiber: f.fiber_g ?? 0,
        saturatedFat: f.saturated_fat_g ?? 0,
        transFat: f.trans_fat_g ?? 0,
        cholesterol: f.cholesterol_mg ?? 0,
        grams: r.weight_g,
        cookingMethod,
      }
    })

    const result = calcNutrition(added, servings)
    const round1 = (v: number) => Math.round(v * 10) / 10

    return NextResponse.json({
      success: true,
      serving_summary: {
        raw_weight_g: result.rawWeight,
        cooked_weight_g: round1(result.cookedWeight),
        yield_factor: Math.round(result.yieldFactor * 100) / 100,
        energy_kcal: round1(result.perServing.kcal),
        carb_g: round1(result.perServing.carbs),
        protein_g: round1(result.perServing.protein),
        fat_g: round1(result.perServing.fat),
        saturated_fat_g: round1(result.perServing.saturatedFat),
        trans_fat_g: round1(result.perServing.transFat),
        cholesterol_mg: round1(result.perServing.cholesterol),
        sugar_g: round1(result.perServing.sugar),
        sodium_mg: round1(result.perServing.sodium),
      },
      // 공식 영양표시 카드(100g당/1인분당 두 컬럼) 렌더링용
      per_100g: {
        energy_kcal: round1(result.per100g.kcal),
        carb_g: round1(result.per100g.carbs),
        protein_g: round1(result.per100g.protein),
        fat_g: round1(result.per100g.fat),
        saturated_fat_g: round1(result.per100g.saturatedFat),
        trans_fat_g: round1(result.per100g.transFat),
        cholesterol_mg: round1(result.per100g.cholesterol),
        sugar_g: round1(result.per100g.sugar),
        sodium_mg: round1(result.per100g.sodium),
      },
      diagnosis: {
        is_warning: result.warnings.length > 0,
        warnings: result.warnings.map(w => ({
          nutrient: w.nutrient,
          current_val: Math.round(w.value * 10) / 10,
          daily_pct: Math.round(w.dailyPct * 10) / 10,
          main_cause: w.mainCause,
        })),
      },
    })
  } catch (error: any) {
    console.error('영양성분 계산 에러:', error)
    return NextResponse.json({ success: false, message: '계산 중 오류가 발생했습니다.', error: error.message }, { status: 500 })
  }
}
