import { NextResponse } from 'next/server';
import pool from '../db';
import { validateToken } from '../../utils/tokenUtils';
import { validationErrorResponse, authErrorResponse, notFoundErrorResponse, errorResponse } from '../../utils/apiUtils';

// GET メソッドのハンドラー
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id'); // URLパラメータからidを取得
    const token = searchParams.get('token'); // セッショントークンを取得
    const tableName = process.env.TABLE_NAME || 'receptions';

    if (!id) {
        return validationErrorResponse('IDが指定されていません');
    }

    // セッショントークンの検証
    if (!token || !validateToken(id, token)) {
        return authErrorResponse('セッショントークンが無効です');
    }

    try {
        // データベースから指定されたIDの情報を取得
        const selectQuery = `
            SELECT * FROM ${tableName} WHERE id = $1;
        `;
        const result = await pool.query(selectQuery, [id]);

        if (result.rows.length === 0) {
            return notFoundErrorResponse('指定されたIDのデータが見つかりません');
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Database error:', error);
        return errorResponse('データベースエラーが発生しました');
    }
}