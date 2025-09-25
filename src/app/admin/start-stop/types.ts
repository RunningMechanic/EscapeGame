export type ScanStatus = "idle" | "waiting" | "started" | "stopped";

export interface GameSession {
    id: number;
    participantId: number | null; // null許容
    token?: string;               // undefinedも許容
    isActive: boolean;
    startTime: Date | null;
    endTime: Date | null;
    timeTaken: number | null;
}

export interface ParticipantInfo {
    id: number;
    number: number;
    start: string;
    name?: string;
    alignment: boolean;
    gameStarted: boolean;
}

export interface PendingCandidate {
    id: number;
    number: number;
    start: string;
    name?: string;
    token?: string;
}

export interface Reception {
    id: number;
    time: string;
    alignment: boolean;
    number: number;
    timeTaken: number;
    gameStarted: boolean;
    gameStartTime?: string;
    name: string;
}

export type ParticipantMetaById = Record<number, { number: number; name?: string | null; start: string }>;
