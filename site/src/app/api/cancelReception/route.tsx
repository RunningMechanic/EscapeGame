import { NextRequest, NextResponse } from 'next/server';
import pool from '../db';

export async function DELETE(request: NextRequest) {
    try {
        const { id, token } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // トークンの検証（簡易的な実装）
        const expectedToken = generateToken(id.toString());
        if (token !== expectedToken) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // データベースから指定されたIDのレコードを削除
        const result = await pool.query(
            'DELETE FROM reception WHERE id = $1',
            [id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Reservation cancelled successfully' });
    } catch (error) {
        console.error('Cancel error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// トークン生成関数（checkidと同じ実装）
function generateToken(id: string): string {
    const secret = process.env.SESSION_SECRET || 'default-secret';
    const timestamp = Math.floor(Date.now() / (1000 * 60 * 60)); // 1時間単位
    return btoa(`${id}-${timestamp}-${secret}`).replace(/[^a-zA-Z0-9]/g, '');
} 