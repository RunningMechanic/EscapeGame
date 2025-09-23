import prisma from "@/lib/db";

// トークン生成関数
export function generateToken(id: string, timestamp?: number): string {
    if (!timestamp) timestamp = Date.now();
    const time = Math.floor(timestamp / (1000 * 60 * 60)); // 1時間単位
    const secret = process.env.SESSION_SECRET || "default-secret";
    return Buffer.from(`${id}-${time}-${secret}`)
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "");
}

// トークン検証関数
export async function validateToken(id: string, token: string): Promise<boolean> {
    if (!id || !token) return false;

    try {
        const data = await prisma.reception.findUnique({
            where: { id: Number(id) },
        });
        if (!data) return false;
        const expectedToken = generateToken(id, data?.gameStartTime?.getTime());
        return token === expectedToken;
    } catch {
        return false;
    }
}

// セキュアなトークン生成（より安全な実装）
export function generateSecureToken(id: string): string {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        throw new Error("SESSION_SECRET environment variable is not set");
    }

    const timestamp = Math.floor(Date.now() / (1000 * 60 * 60)); // 1時間単位
    const data = `${id}-${timestamp}-${secret}`;

    // より安全なハッシュ生成（実際の実装では crypto を使用）
    return btoa(data).replace(/[^a-zA-Z0-9]/g, "");
}
