import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 1) {
    return NextResponse.json({ success: true, items: [] });
  }

  try {
    // food_name 인덱스를 활용한 접두사/부분 검색 (최대 15건)
    const sql = `
      SELECT 
        food_id,
        food_group,
        food_name as name,
        energy_kcal as kcal,
        protein_g as protein,
        carb_g as carbs,
        fat_g as fat,
        sugar_g as sugar,
        sodium_mg as sodium,
        fiber_g as fiber
      FROM foods
      WHERE food_name LIKE ?
      LIMIT 15
    `;
    const [rows] = await pool.query(sql, [`%${q}%`]);

    return NextResponse.json({
      success: true,
      items: rows,
    });
  } catch (error: any) {
    console.error('식재료 검색 에러:', error);
    return NextResponse.json(
      { success: false, message: '검색 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}