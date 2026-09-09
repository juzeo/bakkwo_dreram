import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// 명세서 5장 1) 식재료 검색 API — 기존 /api/foods/search를 /api/v1/foods/search로 이전하고
// 응답 필드명을 명세서 규격(food_name/energy_kcal/protein_g...)에 맞췄습니다.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)

  if (!q || q.length < 1) {
    return NextResponse.json({ success: true, total: 0, data: [] })
  }

  try {
    const sql = `
      SELECT
        food_id,
        food_group,
        food_name,
        energy_kcal,
        protein_g,
        fat_g,
        carb_g,
        sugar_g,
        sodium_mg,
        fiber_g,
        saturated_fat_g,
        trans_fat_g,
        cholesterol_mg
      FROM foods
      WHERE food_name LIKE ?
      LIMIT ?
    `
    const [rows] = await pool.query(sql, [`%${q}%`, limit])
    const list = rows as any[]

    return NextResponse.json({
      success: true,
      total: list.length,
      // 프론트 lib/nutrition.ts의 FoodItem 형태로도 바로 쓸 수 있도록 별칭을 함께 제공
      data: list.map(row => ({
        food_id: row.food_id,
        food_group: row.food_group,
        food_name: row.food_name,
        name: row.food_name,
        energy_kcal: row.energy_kcal,
        kcal: row.energy_kcal,
        protein_g: row.protein_g,
        protein: row.protein_g,
        fat_g: row.fat_g,
        fat: row.fat_g,
        carb_g: row.carb_g,
        carbs: row.carb_g,
        sugar_g: row.sugar_g,
        sugar: row.sugar_g,
        sodium_mg: row.sodium_mg,
        sodium: row.sodium_mg,
        fiber_g: row.fiber_g,
        fiber: row.fiber_g,
        saturated_fat_g: row.saturated_fat_g,
        saturatedFat: row.saturated_fat_g,
        trans_fat_g: row.trans_fat_g,
        transFat: row.trans_fat_g,
        cholesterol_mg: row.cholesterol_mg,
        cholesterol: row.cholesterol_mg,
      })),
    })
  } catch (error: any) {
    console.error('식재료 검색 에러:', error)
    return NextResponse.json({ success: false, message: '검색 중 오류가 발생했습니다.', error: error.message }, { status: 500 })
  }
}
