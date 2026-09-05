import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT VERSION() as tidb_version, NOW() as server_time');
    return NextResponse.json({
      success: true,
      message: 'TiDB Cloud 연결 성공!',
      data: rows,
    });
  } catch (error: any) {
    console.error('TiDB Connection Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'TiDB 연결 실패',
        error: error.message,
      },
      { status: 500 }
    );
  }
}