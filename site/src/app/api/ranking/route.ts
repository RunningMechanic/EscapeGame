import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        // タイムが設定されている上位5位を取得（タイムが短い順）
        const rankings = await prisma.reception.findMany({
            where: {
                timeTaken: {
                    not: null // タイムが設定されているもののみ
                }
            },
            orderBy: {
                timeTaken: 'asc' // 短い時間順
            },
            take: 5, // 上位5位まで
            select: {
                id: true,
                timeTaken: true,
                number: true,
                name: true,
                time: true
            }
        });

        return NextResponse.json({ rankings });
    } catch (error) {
        console.error('ランキング取得エラー:', error);
        return NextResponse.json(
            { error: 'ランキングの取得に失敗しました' },
            { status: 500 }
        );
    }
}
