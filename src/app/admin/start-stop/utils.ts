export const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// QRコードの内容から id と token を取得
export function extractParticipantFromQR(raw: string): { id: number; token: string } | null {
    try {
        // QRコードがURLの場合
        const url = new URL(raw);
        const idStr = url.searchParams.get("id");
        const token = url.searchParams.get("token");

        if (idStr && token) {
            const id = parseInt(idStr, 10);
            if (!isNaN(id)) return { id, token };
        }

        return null;
    } catch {
        return null;
    }
}
