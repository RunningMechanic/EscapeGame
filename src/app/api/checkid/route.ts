import { NextResponse } from 'next/server';
import prisma from '../../../lib/db';
import { validateToken } from '../../../utils/tokenUtils';
import { validationErrorResponse, authErrorResponse, notFoundErrorResponse, errorResponse } from '../../../utils/apiUtils';

// GET メソッドのハンドラー
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const token = searchParams.get('token');

    if (!id) {
        return validationErrorResponse('IDが指定されていません');
    }

    if (!token || !validateToken(id, token)) {
        return authErrorResponse('セッショントークンが無効です');
    }

    try {
        const reception = await prisma.reception.findUnique({
            where: { id: Number(id) },
        });

        if (!reception) {
            return notFoundErrorResponse('指定されたIDのデータが見つかりません');
        }

        const responseData = {
            id: reception.id,
            start: reception.time ? new Date(reception.time).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit'
            }) : '未設定',
            count: reception.number,
            name: reception.name || '未入力',
            checker: reception.alignment,
            alignment: reception.alignment
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Database error:', error);
        return errorResponse('データベースエラーが発生しました');
    }
}


