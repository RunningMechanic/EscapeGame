export const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// URLやテキストに含まれる数字列からIDを推定
export const extractParticipantId = (raw: string): number | null => {
    const idParam = raw.match(/[?&#]id=(\d+)/i);
    if (idParam && idParam[1]) return Number(idParam[1]);
    const pathNum = raw.match(/\/(\d+)(?:\D|$)/);
    if (pathNum && pathNum[1]) return Number(pathNum[1]);
    const standalone = raw.match(/\b(\d{1,6})\b/);
    if (standalone && standalone[1]) return Number(standalone[1]);
    return null;
};


