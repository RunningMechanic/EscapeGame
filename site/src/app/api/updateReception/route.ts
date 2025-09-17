import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, timeTaken } = body as { id?: number; name?: string | null; timeTaken?: number | null };

        if (!id) {
            return NextResponse.json({ error: 'ID が指定されていません' }, { status: 400 });
        }

        const payload: { name?: string | null; timeTaken?: number | null } = {};
        if (name !== undefined) payload.name = name;
        if (timeTaken !== undefined) payload.timeTaken = timeTaken;

        const updated = await prisma.reception.update({
            where: { id },
            data: payload,
        });

        return NextResponse.json({ success: true, participant: updated });
    } catch (error) {
        console.error('updateReception error:', error);
        return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}


