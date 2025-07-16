import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const time = searchParams.get('time');
    const room = Number(searchParams.get('room'));

    if (!time || !room) {
        return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    try {
        // receptionテーブルが存在するか確認し、なければエラーを返す
        const exists = await prisma.reception.findFirst({
            where: {
                time: new Date(time),
                room: room,
            },
        });
        return NextResponse.json({ available: !exists });
    } catch (error) {
        console.error('DB error:', error);
        return NextResponse.json({ error: 'Database error. テーブルが存在しない可能性があります。' }, { status: 500 });
    }
}