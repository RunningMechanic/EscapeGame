import { NextResponse } from 'next/server';
import pool from '../db';

// GET メソッドでIDを指定してalignmentをtrueに更新
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const tableName = process.env.TABLE_NAME || 'receptions';

    if (!id) {
        return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 });
    }

    try {
        const result = await pool.query(
            `UPDATE ${tableName} SET alignment = true WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: '指定されたIDのデータが見つかりません' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'チェックインが完了しました',
            data: result.rows[0]
        });
    } catch (error: unknown) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
}