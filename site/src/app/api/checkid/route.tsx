import { NextResponse } from 'next/server';
import prisma from '../../../lib/db';
import { validateToken } from '../../../utils/tokenUtils';
import { validationErrorResponse, authErrorResponse, notFoundErrorResponse, errorResponse } from '../../../utils/apiUtils';

// GET メソッドのハンドラー
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id'); // URLパラメータからidを取得
    const token = searchParams.get('token'); // セッショントークンを取得

    if (!id) {
        return validationErrorResponse('IDが指定されていません');
    }

    // セッショントークンの検証
    if (!token || !validateToken(id, token)) {
        return authErrorResponse('セッショントークンが無効です');
    }

    try {
        // Prismaで指定IDのReceptionDataを取得
        const reception = await prisma.reception.findUnique({
            where: { id: Number(id) },
        });

        if (!reception) {
            return notFoundErrorResponse('指定されたIDのデータが見つかりません');
        }

        // フロントエンドが期待する形式でデータを返す
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