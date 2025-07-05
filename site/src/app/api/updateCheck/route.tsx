import pool from '../db';
import { validationErrorResponse, notFoundErrorResponse, errorResponse, successResponse } from '../../utils/apiUtils';

export async function POST(req: Request) {
    const tableName = process.env.TABLE_NAME || 'receptions';
    const { id, check } = await req.json();

    if (typeof id !== 'number' || typeof check !== 'boolean') {
        return validationErrorResponse('Invalid parameters');
    }

    try {
        await pool.query(
            `UPDATE ${tableName} SET checker = $1 WHERE id = $2`,
            [check, id]
        );
        return successResponse(null, 'Check status updated successfully');
    } catch (error: unknown) {
        console.error('Database error:', error);
        return errorResponse('DB error');
    }
}

// GET メソッドでIDを指定してcheckをtrueに更新
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const tableName = process.env.TABLE_NAME || 'receptions';

    if (!id) {
        return validationErrorResponse('IDが指定されていません');
    }

    try {
        const result = await pool.query(
            `UPDATE ${tableName} SET check = true WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return notFoundErrorResponse('指定されたIDのデータが見つかりません');
        }

        return successResponse(result.rows[0], 'チェックインが完了しました');
    } catch (error: unknown) {
        console.error('Database error:', error);
        return errorResponse('DB error');
    }
}