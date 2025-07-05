import { NextResponse } from 'next/server';
import pool from '../db';

// GET メソッドのハンドラー
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id'); // URLパラメータからidを取得
    const token = searchParams.get('token'); // セッショントークンを取得
    const tableName = process.env.TABLE_NAME || 'receptions';

    if (!id) {
        return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 });
    }

    // セッショントークンの検証
    if (!token) {
        return NextResponse.json({ error: 'セッショントークンが無効です' }, { status: 401 });
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

        // トークンの検証（簡易的な実装）
        const expectedToken = generateToken(id);
        if (token !== expectedToken) {
            return NextResponse.json({ error: 'セッショントークンが無効です' }, { status: 401 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'データベースエラーが発生しました' }, { status: 500 });
    }
}

// トークン生成関数（簡易的な実装）
function generateToken(id: string): string {
    // 実際の実装では、より安全なハッシュ関数を使用する
    const secret = process.env.SESSION_SECRET || 'default-secret';
    const timestamp = Math.floor(Date.now() / (1000 * 60 * 60)); // 1時間単位
    return btoa(`${id}-${timestamp}-${secret}`).replace(/[^a-zA-Z0-9]/g, '');
}