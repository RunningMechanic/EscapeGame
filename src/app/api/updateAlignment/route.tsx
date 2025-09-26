import prisma from '@/lib/db';
import { validationErrorResponse, errorResponse, successResponse } from '@/utils/apiUtils';
import { NextResponse } from 'next/server';

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
        const before = await prisma.reception.findFirst({
            where: { id: Number.parseInt(id) }
        })
        if (before?.alignment && before.name == name) {
            return NextResponse.json({
                success: true,
            }, {status: 202})
        }

        const updated = await prisma.reception.update({
            where: { id: Number.parseInt(id) },
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