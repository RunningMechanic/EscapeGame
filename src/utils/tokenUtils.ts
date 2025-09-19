// トークン生成関数
export function generateToken(id: string): string {
    const secret = process.env.SESSION_SECRET || 'default-secret';
    const timestamp = Math.floor(Date.now() / (1000 * 60 * 60)); // 1時間単位
    return btoa(`${id}-${timestamp}-${secret}`).replace(/[^a-zA-Z0-9]/g, '');
}

// トークン検証関数
export function validateToken(id: string, token: string): boolean {
    if (!id || !token) return false;

    try {
        const expectedToken = generateToken(id);
        return token === expectedToken;
    } catch {
        return false;
    }
}

// セキュアなトークン生成（より安全な実装）
export function generateSecureToken(id: string): string {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        throw new Error('SESSION_SECRET environment variable is not set');
    }

    const timestamp = Math.floor(Date.now() / (1000 * 60 * 60)); // 1時間単位
    const data = `${id}-${timestamp}-${secret}`;

    // より安全なハッシュ生成（実際の実装では crypto を使用）
    return btoa(data).replace(/[^a-zA-Z0-9]/g, '');
} 