import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { validateToken } from '@/utils/tokenUtils';
import { validationErrorResponse, authErrorResponse, notFoundErrorResponse, errorResponse, successResponse } from '@/utils/apiUtils';

export async function DELETE(request: NextRequest) {
    try {
        const { id, token } = await request.json();

        if (!id) {
            return validationErrorResponse('ID is required');
        }

        if (!token) {
            return validationErrorResponse('Token is required');
        }

        // トークンの検証
        if (!validateToken(id.toString(), token)) {
            return authErrorResponse('Invalid token');
        }

        // データベースから指定されたIDのレコードを削除
        const deleted = await prisma.receptionData.delete({
            where: { id: Number(id) },
        });

        if (!deleted) {
            return notFoundErrorResponse('Record not found');
        }

        return successResponse(null, 'Reservation cancelled successfully');
    } catch (error) {
        console.error('Cancel error:', error);
        return errorResponse('Internal server error');
    }
} 