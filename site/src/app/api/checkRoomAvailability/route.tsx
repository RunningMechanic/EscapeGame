import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const time = searchParams.get('time');

    if (!time) {
        return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    try {
        // 同じ時間帯に既に予約があるかチェック（教室は1つだけなので）
        const exists = await prisma.reception.findFirst({
            where: {
                time: new Date(time),
            },
        });
        return NextResponse.json({ available: !exists });
    } catch (error) {
        console.error('DB error:', error);
        return NextResponse.json({ error: 'Database error. テーブルが存在しない可能性があります。' }, { status: 500 });
    }
}