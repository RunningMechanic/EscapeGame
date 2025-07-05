import { NextRequest, NextResponse } from 'next/server';
import pool from '../db';

export async function DELETE(request: NextRequest) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // データベースから指定されたIDのレコードを削除
        const result = await pool.query(
            'DELETE FROM reception WHERE id = $1',
            [id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 