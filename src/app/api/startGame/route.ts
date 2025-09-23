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

        // 参加者の存在確認
        const participant = await prisma.reception.findUnique({
            where: { id: participantId }
        });

        if (!participant) {
            return NextResponse.json(
                { error: '参加者が見つかりません' },
                { status: 404 }
            );
        }

        // 既にゲームが開始されている場合は冪等に成功レスポンスを返す
        if (participant.gameStarted) {
            let startTime = participant.gameStartTime ?? new Date();
            // gameStarted=true かつ gameStartTime が無い場合は今を補完
            if (!participant.gameStartTime) {
                await prisma.reception.update({
                    where: { id: participantId },
                    data: { gameStartTime: startTime }
                });
            }
            const sessionId = Number(startTime) || Date.now();
            return NextResponse.json({
                success: true,
                sessionId,
                participant,
                message: '既に開始済みのためセッションを再利用しました'
            });
        }

        // ゲーム開始フラグと開始時刻を更新
        const gameStartTime = new Date();
        const updatedParticipant = await prisma.reception.update({
            where: { id: participantId },
            data: {
                gameStarted: true,
                gameStartTime: gameStartTime
            }
        });

        console.log('ゲーム開始 - 参加者ID:', participantId, '開始時刻:', gameStartTime);

        // セッションIDを生成（実際の実装では別テーブルを使用することを推奨）
        const sessionId = Date.now();

        return NextResponse.json({
            success: true,
            sessionId,
            participant: updatedParticipant,
            message: 'ゲームが開始されました'
        });

    } catch (error) {
        console.error('ゲーム開始エラー:', error);
        return NextResponse.json(
            { error: 'ゲーム開始に失敗しました' },
            { status: 500 }
        );
    }
}
