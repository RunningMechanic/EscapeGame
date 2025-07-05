import pool from '../db';
import { errorResponse, successResponse } from '../../utils/apiUtils';

// GET メソッドのハンドラー
export async function GET() {
  const tableName = process.env.TABLE_NAME || 'receptions';

  try {
    // テーブル内のすべての行をid順に取得
    const selectQuery = `
      SELECT * FROM ${tableName}
      ORDER BY start ASC; -- 開始希望時間の昇順で並べる
    `;

    const result = await pool.query(selectQuery);
    return successResponse(result.rows);

  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Unexpected internal server error');
  }
}