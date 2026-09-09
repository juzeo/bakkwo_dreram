import { NextResponse } from 'next/server'
import pool from '@/lib/db'

// 명세서 5장 2) 메뉴젠 표준 템플릿 로드 API
export async function GET() {
  try {
    const [templateRows] = await pool.query(
      `SELECT template_id, menu_name, default_servings, default_method FROM menu_templates`,
    )
    const [ingredientRows] = await pool.query(
      `SELECT ti.template_id, ti.food_id, f.food_name, ti.weight_g, ti.cooking_method
       FROM menu_template_ingredients ti
       JOIN foods f ON f.food_id = ti.food_id`,
    )

    const templates = templateRows as any[]
    const ingredients = ingredientRows as any[]

    const menus = templates.map(t => ({
      template_id: t.template_id,
      menu_name: t.menu_name,
      default_servings: t.default_servings,
      default_method: t.default_method,
      ingredients: ingredients
        .filter(i => i.template_id === t.template_id)
        .map(i => ({ food_id: i.food_id, food_name: i.food_name, weight_g: i.weight_g, cooking_method: i.cooking_method })),
    }))

    return NextResponse.json({ success: true, menus })
  } catch (error: any) {
    console.error('템플릿 조회 에러:', error)
    return NextResponse.json({ success: false, message: '템플릿을 불러오지 못했습니다.', error: error.message }, { status: 500 })
  }
}
