import { DateTime } from "luxon";

export interface ReceptionData {
    id: number;
    time: string;
    number: number;
    name?: string;
    alignment: boolean;
    gameStartTime?: string;
    gameStarted?: boolean;
    timeTaken?: number | null;
    cancelled?: boolean;
    difficulty: string;
    ended: boolean;
}

export interface SearchKey {
    name: string;
    type: string;
    description?: string;
    receptionKey?: keyof ReceptionData;
    match: (data: ReceptionData, param: string) => boolean;
}

export interface SearchParameter {
    key: string;
    value: string;
    inverted: boolean;
}

function matchTime(iso: string, time: string, includeSecond: boolean = true) {
    const a = DateTime.fromISO(iso).setZone("Asia/Tokyo");
    const b = DateTime.fromFormat(time, "H:m");
    return a.hour == b.hour && a.minute == b.minute && (includeSecond || a.second == b.second);
}

export const searchKeys: SearchKey[] = [
    {
        name: "id",
        type: "number",
        description: "受付IDでフィルタ",
        receptionKey: "id",
        match(data, param) {
            return param == data.id.toString();
        }
    },
    {
        name: "time",
        type: "time",
        receptionKey: "time",
        description: "開始希望時間でフィルタ",
        match(data, param) {
            return matchTime(data.time, param);
        }
    },
    {
        name: "linked",
        type: "boolean",
        description: "スマホ連携済みのみ",
        match(data, param) {
            return Boolean(data.alignment);
        }
    },
    {
        name: "gameStart",
        type: "time",
        receptionKey: "gameStartTime",
        description: "ゲーム開始時間でフィルタ",
        match(data, param) {
            return Boolean(data.gameStartTime && matchTime(data.gameStartTime, param));
        }
    },
    {
        name: "started",
        type: "boolean",
        description: "ゲーム開始済みのみ",
        match(data, param) {
            return Boolean(data.gameStarted);
        }
    },
    {
        name: "person",
        type: "number",
        receptionKey: "number",
        description: "人数でフィルタ",
        match(data, param) {
            return data.number.toString() == param;
        }
    },
    {
        name: "cancelled",
        type: "boolean",
        description: "キャンセル済みのみ",
        match(data, param) {
            return Boolean(data.cancelled);
        }
    },
    {
        name: "finished",
        type: "boolean",
        description: "終了済みのみ",
        match(data, param) {
            return Boolean(data.ended);
        }
    }
];
