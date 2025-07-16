import prisma from '@/lib/db';
import { validationErrorResponse, errorResponse, successResponse } from '@/utils/apiUtils';

export async function POST(req: Request) {
    const { id, check } = await req.json();

    if (typeof id !== 'number' || typeof check !== 'boolean') {
        return validationErrorResponse('Invalid parameters');
    }

    try {
        await prisma.reception.update({
            where: { id },
            data: { alignment: check },
        });
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

    if (!id) {
        return validationErrorResponse('IDが指定されていません');
    }

    try {
        const updated = await prisma.reception.update({
            where: { id: Number(id) },
            data: { alignment: true },
        });
        return successResponse(updated, 'チェックインが完了しました');
    } catch (error: unknown) {
        console.error('Database error:', error);
        return errorResponse('DB error');
    }
}