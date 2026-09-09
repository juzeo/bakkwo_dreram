import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { applyRemodel, type CookingMethodCode, type Ingredient, type Track } from '@/lib/nutrition'

// 명세서 5장 4) 투-트랙 레시피 리모델링 추천 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const track: Track = body.track ?? 'LOCAL_FARM'
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
        food_id: f.food_id, food_group: f.food_group, name: f.food_name,
        kcal: f.energy_kcal ?? 0, protein: f.protein_g ?? 0, fat: f.fat_g ?? 0,
        carbs: f.carb_g ?? 0, sugar: f.sugar_g ?? 0, sodium: f.sodium_mg ?? 0, fiber: f.fiber_g ?? 0,
        saturatedFat: f.saturated_fat_g ?? 0, transFat: f.trans_fat_g ?? 0, cholesterol: f.cholesterol_mg ?? 0,
        grams: r.weight_g, cookingMethod,
      }
    })

    // 감지된 룰은 기본 전부 활성화 (프론트에서 개별 토글은 이후 별도 재계산 호출로 처리)
    const matches = applyRemodel(added, track, new Set()).matches
    const enabledRuleIds = new Set(matches.map(m => m.rule.id))
    const result = applyRemodel(added, track, enabledRuleIds)

    return NextResponse.json({
      success: true,
      track,
      substitutions: result.applied.map(a => ({
        target_food_id: a.matchedItem.food_id,
        target_name: a.matchedItem.name,
        substitute_name: a.option.label,
        original_weight_g: a.matchedItem.grams,
        reason: a.option.reason,
      })),
      recalculated_summary: {
        sugar_g: Math.round(result.after.sugar * 10) / 10,
        sugar_reduction_pct: result.sugarReductionPct,
        sodium_mg: Math.round(result.after.sodium * 10) / 10,
        sodium_reduction_pct: result.sodiumReductionPct,
        partner_badge: track === 'LOCAL_FARM' && result.applied.length > 0 ? '국산 농식품 상생 레시피 적용 매장' : null,
      },
    })
  } catch (error: any) {
    console.error('리모델링 계산 에러:', error)
    return NextResponse.json({ success: false, message: '계산 중 오류가 발생했습니다.', error: error.message }, { status: 500 })
  }
}
