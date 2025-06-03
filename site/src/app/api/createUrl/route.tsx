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
  const tableName = process.env.TABLE_NAME || 'receptions';
  const count = searchParams.get('count'); // URLパラメータから人数を取得
  const start = searchParams.get('start'); // URLパラメータから開始時間を取得
  console.log('Received start time:', start);
  console.log('Received count:', count);
  if (!count) {
    return NextResponse.json({ error: '人数が指定されていません' }, { status: 400 });
  }

  try {
    // IDと人数を保存
    const insertQuery = `
      INSERT INTO ${tableName} (count, start)
      VALUES ($1, $2)
      RETURNING id;
    `;
    let result;
    try {
      result = await pool.query(insertQuery, [parseInt(count), start]);
    } catch (dbError) {
      console.error('Database error during INSERT:', dbError);
      return NextResponse.json({ error: 'Database error during INSERT operation' }, { status: 500 });
    }

    const newId = result.rows[0]?.id;
    if (!newId) {
      console.error('Failed to retrieve new ID from database');
      return NextResponse.json({ error: 'Failed to retrieve new ID from database' }, { status: 500 });
    }

    return NextResponse.json({ id: newId, count });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected internal server error' }, { status: 500 });
  }
}