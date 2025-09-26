import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const time = searchParams.get('time');

    if (!time) {
        return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    try {
        const targetTime = new Date(time);
        if (isNaN(targetTime.getTime())) {
            return NextResponse.json({ error: 'Invalid time format' }, { status: 400 });
        }

        const maxGroupSize = Number(process.env.MAX_GROUP_SIZE || 8);

        // 同時刻の合計人数を集計
        const bookings = await prisma.reception.findMany({
            where: { time: targetTime },
        });

        const used = bookings.filter(p => p.alignment && !p.cancelled && !p.ended).reduce((sum, b) => sum + (b.number || 0), 0);
        const remaining = Math.max(0, maxGroupSize - used);
        return NextResponse.json({ available: remaining > 0, remaining, max: maxGroupSize });
    } catch (error) {
        console.error('DB error:', error);
        return NextResponse.json({ error: 'Database error. テーブルが存在しない可能性があります。' }, { status: 500 });
    }
}