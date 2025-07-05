import pool from '../db';
import { validationErrorResponse, notFoundErrorResponse, errorResponse, successResponse } from '../../utils/apiUtils';

// GET メソッドでIDを指定してalignmentをtrueに更新
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const tableName = process.env.TABLE_NAME || 'receptions';

    if (!id) {
        return validationErrorResponse('IDが指定されていません');
    }

    try {
        const result = await pool.query(
            `UPDATE ${tableName} SET alignment = true WHERE id = $1 RETURNING *`,
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