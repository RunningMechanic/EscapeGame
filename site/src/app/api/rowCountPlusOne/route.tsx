import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { config } from 'dotenv';

// .env ファイルの読み込み
config();

// PostgreSQL 接続設定
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
});

// GET メソッドのハンドラー
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tableName = searchParams.get('tableName');

  if (!tableName) {
    return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
  }

  try {
    const query = `
      SELECT COUNT(*) AS row_count
      FROM ${tableName}
    `;
    const result = await pool.query(query);
    const rowCount = parseInt(result.rows[0].row_count, 10);
    return NextResponse.json({ rowCountPlusOne: rowCount + 1 });
  } catch (error) {
    console.error('Error fetching row count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}