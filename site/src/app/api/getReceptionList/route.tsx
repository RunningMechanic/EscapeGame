import prisma from '@/lib/db';
import { errorResponse, successResponse } from '@/utils/apiUtils';

// GET メソッドのハンドラー
export async function GET() {
  try {
    // Prismaで全ReceptionDataを取得
    const receptions = await prisma.receptionData.findMany({
      orderBy: { start: 'asc' },
    });
    return successResponse(receptions);
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Unexpected internal server error');
  }
}