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
  const tableName = searchParams.get(process.env.TABLE_NAME || 'receptions');
  if (!tableName) {
    return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
  }

  try {
    // 新しい行を挿入してidを取得
    const insertQuery = `
      INSERT INTO ${tableName} DEFAULT VALUES
      RETURNING id;
    `;
    const result = await pool.query(insertQuery);
    const newId = result.rows[0].id;

    // パラメータ付きのURLを生成
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const generatedUrl = `${baseUrl}/reception?number=${newId}`;

    // URLをデータベースに保存
    const saveUrlQuery = `
      UPDATE ${tableName}
      SET url = $1
      WHERE id = $2;
    `;
    await pool.query(saveUrlQuery, [generatedUrl, newId]);

    return NextResponse.json({ url: generatedUrl });
  } catch (error) {
    console.error('Error handling request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}