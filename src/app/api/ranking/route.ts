import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { validationErrorResponse } from "@/utils/apiUtils";

export async function GET(request: NextRequest) {
    const difficulty = request.nextUrl.searchParams.get("difficulty");
    if (!difficulty) return validationErrorResponse("Invalid difficulty parameter");
    try {
        // タイムが設定されている上位5位を取得（タイムが短い順）
        const rankings = await prisma.reception.findMany({
            where: {
                timeTaken: {
                    not: null // タイムが設定されているもののみ
                },
                difficulty: difficulty
            },
            orderBy: {
                timeTaken: "asc" // 短い時間順
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

        const filtered = rankings.filter((p) => p.timeTaken && p.timeTaken <= 600);

        return NextResponse.json({ rankings: filtered });
    } catch (error) {
        console.error("ランキング取得エラー:", error);
        return NextResponse.json({ error: "ランキングの取得に失敗しました" }, { status: 500 });
    }
}
