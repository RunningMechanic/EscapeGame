import prisma from '@/lib/db';
import { validationErrorResponse, errorResponse, successResponse } from '@/utils/apiUtils';

// GET メソッドでIDを指定してalignmentをtrueに更新
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const name = searchParams.get('name');

    if (!id) {
        return validationErrorResponse('IDが指定されていません');
    }

    if (!name) {
        return validationErrorResponse('名前が指定されていません');
    }

    try {
        const updated = await prisma.reception.update({
            where: { id: Number(id) },
            data: {
                alignment: true,
                name: name
            },
        });
        return successResponse(updated, 'チェックインが完了しました');
    } catch (error: unknown) {
        console.error('Database error:', error);
        return errorResponse('DB error');
    }
}