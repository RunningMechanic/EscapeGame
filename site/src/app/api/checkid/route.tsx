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
    const id = searchParams.get('id'); // URLパラメータからidを取得
    const tableName = process.env.TABLE_NAME || 'receptions';
    if (!id) {
        return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 });
    }

    try {
        // データベースから指定されたIDの情報を取得
        const selectQuery = `
      SELECT * FROM ${tableName} WHERE id = $1;
    `;
        const result = await pool.query(selectQuery, [id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: '指定されたIDのデータが見つかりません' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'データベースエラーが発生しました' }, { status: 500 });
    }
}