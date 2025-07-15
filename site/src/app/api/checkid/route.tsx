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
        const reception = await prisma.receptionData.findUnique({
            where: { id: Number(id) },
        });

        if (!reception) {
            return notFoundErrorResponse('指定されたIDのデータが見つかりません');
        }

        return NextResponse.json(reception);
    } catch (error) {
        console.error('Database error:', error);
        return errorResponse('データベースエラーが発生しました');
    }
}