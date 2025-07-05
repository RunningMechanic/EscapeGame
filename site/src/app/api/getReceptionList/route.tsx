import { NextResponse } from 'next/server';
import pool from '../db';

// GET メソッドのハンドラー
export async function GET() {
  const tableName = process.env.TABLE_NAME || 'receptions';

  try {
    // テーブル内のすべての行をid順に取得
    const selectQuery = `
      SELECT * FROM ${tableName}
      ORDER BY start ASC; -- 開始希望時間の昇順で並べる
    `;
    let result;
    try {
      result = await pool.query(selectQuery);
    } catch (dbError) {
      console.error('Database error during SELECT:', dbError);
      return NextResponse.json({ error: 'Database error during SELECT operation' }, { status: 500 });
    }

    // 結果を返す
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected internal server error' }, { status: 500 });
  }
}