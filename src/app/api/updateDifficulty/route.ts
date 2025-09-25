import prisma from "@/lib/db";
import { validationErrorResponse, errorResponse, successResponse } from "@/utils/apiUtils";

export async function POST(request: Request) {
    const { id, difficulty } = await request.json();

    if (typeof id !== "number") {
        return validationErrorResponse("Invalid id parameter");
    }
    if (difficulty !== "EASY" && difficulty !== "HARD") {
        return validationErrorResponse("Invalid difficulty parameter");
    }

    try {
        await prisma.reception.update({
            where: { id },
            data: { difficulty: difficulty }
        });
        return successResponse(null, "Check status updated successfully");
    } catch (error: unknown) {
        console.error("Database error:", error);
        return errorResponse("DB error");
    }
}
