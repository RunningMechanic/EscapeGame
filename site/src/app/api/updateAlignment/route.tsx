import prisma from '@/lib/db';
import { validationErrorResponse, errorResponse, successResponse } from '@/utils/apiUtils';

// GET メソッドでIDを指定してalignmentをtrueに更新
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return validationErrorResponse('IDが指定されていません');
    }

    try {
        const updated = await prisma.receptionData.update({
            where: { id: Number(id) },
            data: { alignment: true },
        });
        return successResponse(updated, 'チェックインが完了しました');
    } catch (error: unknown) {
        console.error('Database error:', error);
        return errorResponse('DB error');
    }
}