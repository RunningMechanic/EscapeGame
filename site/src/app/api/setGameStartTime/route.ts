import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { participantId } = await request.json();

        if (!participantId) {
            return NextResponse.json(
                { error: '参加者IDが指定されていません' },
                { status: 400 }
            );
        }

        // 参加者の存在確認と受付時間の取得
        const participant = await prisma.reception.findUnique({
            where: { id: participantId }
        });

        if (!participant) {
            return NextResponse.json(
                { error: '参加者が見つかりません' },
                { status: 404 }
            );
        }

        // 受付時に選択した時間をゲーム開始時間として設定
        const gameStartTime = participant.time;
        
        const updatedParticipant = await prisma.reception.update({
            where: { id: participantId },
            data: {
                gameStartTime: gameStartTime
            }
        });

        console.log('ゲーム開始時間設定 - 参加者ID:', participantId, '開始時刻:', gameStartTime);

        return NextResponse.json({
            success: true,
            participant: updatedParticipant,
            message: 'ゲーム開始時間が受付時間に設定されました'
        });

    } catch (error) {
        console.error('ゲーム開始時間設定エラー:', error);
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}

