import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const { participantId, timeTaken } = await request.json();

        if (!participantId) {
            return NextResponse.json({ error: "参加者IDが指定されていません" }, { status: 400 });
        }

        if (timeTaken === undefined || timeTaken === null) {
            return NextResponse.json({ error: "経過時間が指定されていません" }, { status: 400 });
        }

        // 参加者の存在確認
        const participant = await prisma.reception.findUnique({
            where: { id: participantId }
        });

        if (!participant) {
            return NextResponse.json({ error: "参加者が見つかりません" }, { status: 404 });
        }

        // ゲームが開始されているかチェック
        if (!participant.gameStarted) {
            return NextResponse.json({ error: "この参加者はゲームを開始していません" }, { status: 409 });
        }

        // データベースから開始時刻を取得して正確な経過時間を計算
        const gameStartTime = participant.gameStartTime;
        if (!gameStartTime) {
            return NextResponse.json({ error: "ゲーム開始時刻が見つかりません" }, { status: 400 });
        }

        const actualTimeTaken = Math.floor((Date.now() - gameStartTime.getTime()) / 1000);
        console.log("ゲーム停止 - フロントエンド時間:", timeTaken, "秒, データベース時間:", actualTimeTaken, "秒");

        // データベースの時間を使用（より正確）
        const finalTimeTaken = actualTimeTaken;

        // ゲーム終了処理
        const updatedParticipant = await prisma.reception.update({
            where: { id: participantId },
            data: {
                gameStarted: false,
                timeTaken: finalTimeTaken,
                ended: true
            }
        });

        return NextResponse.json({
            success: true,
            participant: updatedParticipant,
            timeTaken: finalTimeTaken,
            message: "ゲームが終了されました"
        });
    } catch (error) {
        console.error("ゲーム停止エラー:", error);
        return NextResponse.json({ error: "ゲーム停止に失敗しました" }, { status: 500 });
    }
}
