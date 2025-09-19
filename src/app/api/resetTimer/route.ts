import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { participantId } = await request.json();
        if (!participantId) {
            return NextResponse.json({ error: '参加者IDが指定されていません' }, { status: 400 });
        }

        const updated = await prisma.reception.update({
            where: { id: participantId },
            data: {
                gameStarted: false,
                gameStartTime: null,
                timeTaken: null,
            },
        });

        return NextResponse.json({ success: true, participant: updated });
    } catch (error) {
        console.error('resetTimer error:', error);
        return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}


