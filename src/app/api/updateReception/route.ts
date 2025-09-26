import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Reception } from "@prisma/client";

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, timeTaken, cancelled, difficulty } = body as Partial<Reception>;

        if (!id) {
            return NextResponse.json({ error: "ID が指定されていません" }, { status: 400 });
        }

        const payload: Partial<Reception> = {};
        if (name !== undefined) payload.name = name;
        if (timeTaken !== undefined) payload.timeTaken = timeTaken;
        if (cancelled !== undefined) payload.cancelled = cancelled;
        if (difficulty !== undefined) payload.difficulty = difficulty;

        const updated = await prisma.reception.update({
            where: { id },
            data: payload
        });

        return NextResponse.json({ success: true, participant: updated });
    } catch (error) {
        console.error("updateReception error:", error);
        return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
    }
}
