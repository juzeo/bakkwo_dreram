import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// 명세서 5장 5) 사용자 레시피 저장/불러오기 API
// Headers: Authorization: Bearer <token> (Optional) — 로그인 유저는 DB 영구 저장, 비로그인은 401.
// TODO: 구글 로그인(NextAuth) 연동 후 실제 토큰 검증 로직으로 교체하세요.
//       예: const session = await auth(); const userId = session?.user?.id
function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice('Bearer '.length).trim()
  return token || null // 임시: 토큰 값을 그대로 user_id로 취급
}

export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, menu_name, servings, ingredients_json, summary_kcal, summary_sugar, summary_sodium, created_at
       FROM saved_recipes WHERE user_id = ? ORDER BY created_at DESC`,
      [userId],
    )
    return NextResponse.json({ success: true, recipes: rows })
  } catch (error: any) {
    console.error('레시피 조회 에러:', error)
    return NextResponse.json({ success: false, message: '조회 중 오류가 발생했습니다.', error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다. (클라이언트는 LocalStorage로 폴백하세요)' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { menu_name, servings, ingredients, summary } = body

    await pool.query(
      `INSERT INTO saved_recipes (user_id, menu_name, servings, ingredients_json, summary_kcal, summary_sugar, summary_sodium)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, menu_name, servings ?? 1, JSON.stringify(ingredients ?? []), summary?.kcal ?? null, summary?.sugar ?? null, summary?.sodium ?? null],
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('레시피 저장 에러:', error)
    return NextResponse.json({ success: false, message: '저장 중 오류가 발생했습니다.', error: error.message }, { status: 500 })
  }
}
