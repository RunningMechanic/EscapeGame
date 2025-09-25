import prisma from '@/lib/db';
import { errorResponse, successResponse } from '@/utils/apiUtils';

// GET メソッドのハンドラー
export async function GET() {
    try {
        // alignment = true のデータだけ取得
        const receptions = await prisma.reception.findMany({
            where: { alignment: true },
            orderBy: [{ time: 'asc' }],
        });

        return successResponse(receptions);
    } catch (error) {
        console.error('Unexpected error:', error);
        return errorResponse('Unexpected internal server error');
    }
}
