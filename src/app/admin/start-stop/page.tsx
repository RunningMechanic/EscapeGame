"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import jsQR from "jsqr";
import {
    Container,
    Title,
    Text,
    Button,
    Group,
    Stack,
    Card,
    ThemeIcon,
    Alert,
    Grid,
    SegmentedControl,
    Divider,
    Center,
} from '@mantine/core';
import {
    IconPlayerPlay,
    IconSquare,
    IconClock,
    IconQrcode,
    IconUsers,
    IconArrowLeft,
    IconCheck,
    IconPlayerStop,
    IconPlayerStopFilled,
    IconPlus,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { StatusCard } from './StatusCard';
import { ActiveSessionsList } from './ActiveSessionsList';
import { ConfirmStartModal } from './ConfirmStartModal';
import { extractParticipantFromQR } from './utils';
import type { GameSession, PendingCandidate, ParticipantMetaById, ScanStatus, Reception } from './types';
import { DateTime } from "luxon";
import QRScanner from "./QRScanner";
import { parse } from "path";

// 型は `./types` から取得

type Difficulty = string | "EASY" | "HARD"

const StartStopPage = () => {
    const router = useRouter();

    const [activeSessions, setActiveSessions] = useState<GameSession[]>([]);
    const [queuedParticipants, setQueuedParticipants] = useState<PendingCandidate[]>([]);
    const [pendingCandidate, setPendingCandidate] = useState<PendingCandidate | null>(null);
    const [participantMetaById, setParticipantMetaById] = useState<ParticipantMetaById>({});
    const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [globalStartTime, setGlobalStartTime] = useState<Date | null>(null);

    const clearSERef = useRef<HTMLAudioElement | null>(null)

    const [addParticipantScan, setAddParticipantScan] = useState(false);
    const [addParticipantError, setAddParticipantError] = useState<string | null>(null);
    
    const [stopGameScan, setStopGameScan] = useState(false);
    const [stopGameError, setStopGameError] = useState<string | null>(null);
    
    const [difficulty, setDifficulty] = useState<Difficulty>("EASY");

    /** ------------------ ゲーム開始 ------------------ **/
    const startGame = useCallback(
        async (participantId: number, meta?: PendingCandidate) => {
            try {
                const response = await fetch("/api/startGame", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ participantId }),
                });
                if (!response.ok) throw new Error("startGame API failed");
    
                const result = await response.json();
    
                const baseStart = globalStartTime ?? new Date();
                if (!globalStartTime) setGlobalStartTime(baseStart);
    
                setActiveSessions((prev) => [
                    ...prev,
                    {
                        id: result.sessionId,
                        startTime: baseStart,
                        endTime: null,
                        isActive: true,
                        timeTaken: null,
                        participantId,
                        token: meta?.token ?? "",
                    },
                ]);
    
                if (meta) {
                    setParticipantMetaById((prev) => ({
                        ...prev,
                        [participantId]: {
                            number: meta.number,
                            name: meta.name,
                            start: meta.start,
                        },
                    }));
                }
    
                setElapsedTime(0);
                setScanStatus("started");
    
                // --- スキャン停止 ---
                stopAddParticipantScan();
            } catch (error) {
                console.error("ゲーム開始エラー:", error);
            }
        },
        [globalStartTime]
    );
    /** ------------------ ゲーム停止 ------------------ **/
    const stopGame = useCallback(
        async (targetSessionId: number) => {
            const target = activeSessions.find((s) => s.id === targetSessionId);
            if (!target) return;

            try {
                const response = await fetch("/api/stopGame", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId: target.id,
                        participantId: target.participantId,
                        timeTaken: target.startTime
                            ? Math.floor((Date.now() - new Date(target.startTime).getTime()) / 1000)
                            : elapsedTime,
                    }),
                });
                if (!response.ok) throw new Error("stopGame API failed");

                const result = await response.json();

                setActiveSessions((prev) =>
                    prev.map((s) =>
                        s.id === target.id
                            ? {
                                ...s,
                                endTime: new Date(),
                                isActive: false,
                                timeTaken: result.timeTaken,
                            }
                            : s
                    )
                );
                console.log("ゲーム停止:", target.participantId);
            } catch (error) {
                console.error("ゲーム停止エラー:", error);
            }
        },
        [activeSessions, elapsedTime]
    );

    // ロード
    useEffect(() => {
        (async () => {
            const response: Response = await fetch('/api/getReceptionList', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) return
            const { data }: { data: Reception[] } = await response.json()

            for (const reception of data.filter(p => p.gameStarted)) {
                const startTime = DateTime.fromISO(reception.gameStartTime!).setZone("Asia/Tokyo").toJSDate()
                const dt = DateTime.fromISO(reception.time);
                const candidate: PendingCandidate = { id: reception.id, number: reception.number ?? 0, start: dt.toFormat("HH:mm"), name: reception.name };
                
                setParticipantMetaById(prev => ({
                    ...prev,
                    [candidate.id]: {
                        number: candidate.number,
                        name: candidate.name,
                        start: candidate.start,
                    },
                }));

                const session: GameSession = {
                    id: startTime.getTime(),
                    startTime: startTime,
                    timeTaken: null,
                    endTime: null,
                    isActive: true,
                    participantId: reception.id,
                }

                setGlobalStartTime(session.startTime)
                setActiveSessions(prev => ([
                    ...prev, session
                ]));
                setElapsedTime(0);
                setScanStatus('started');
                
                console.log(queuedParticipants)
            }
        })()
    }, [])

    /** ------------------ 全体タイマー ------------------ **/
    useEffect(() => {
        if (!globalStartTime || activeSessions.filter((s) => s.isActive).length === 0) return;
        const interval = setInterval(() => {
            const now = Date.now();
            const start = new Date(globalStartTime).getTime();
            const elapsed = Math.floor((now - start) / 1000);
            setElapsedTime(elapsed);
        }, 1000);
        return () => clearInterval(interval);
    }, [globalStartTime, activeSessions]);

    /** ------------------ QRスキャン開始 ------------------ **/
    const startAddParticipantScan = () => {
        setAddParticipantScan(true);
    };
    const stopAddParticipantScan = () => {
        setAddParticipantScan(false);
    };

    function startStopGameScan() {
        if (stopGameScan) setStopGameScan(false)
        setStopGameScan(true)
    }

    async function handleAddParticipantQRCodeScanned(data: any) {
        const parsedData = extractParticipantFromQR(data);
        if (!parsedData) return
        if (parsedData.id != null) {
            stopAddParticipantScan()
            if (queuedParticipants.some(p => p.id == parsedData.id)) return
            await handleAddParticipant(parsedData);
        }
    }

    async function handleStopGameScanned(data: any) {
        const parsedData = data.toString();
        if (parsedData == "clear") {
            setStopGameScan(false)
            await handleStopGameScan();
        }
    }

    async function handleStopGameScan() {
        await stopAllGroups()
    }

    /** ------------------ QRスキャン結果処理 ------------------ **/
    const handleAddParticipant = async (qrData: { id: number; token: string }) => {
    
        // すでにアクティブ or 待機中ならモーダル出さない
        const alreadyActive = activeSessions.some(
            (s) => s.isActive && s.participantId === qrData.id && s.token === qrData.token
        );
        const alreadyQueued = queuedParticipants.some(
            (p) => p.id === qrData.id && p.token === qrData.token
        );
        if (alreadyActive || alreadyQueued) {
            setAddParticipantError(alreadyQueued ? "このIDは待機中です（同じtoken）" : "このIDはすでに計測中です");
            return;
        }
    
        setPendingCandidate(null);
        setShowConfirmModal(false);
    
        try {
    
            const response = await fetch(`/api/checkid?id=${qrData.id}&token=${qrData.token}`);
            if (!response.ok) throw new Error("check-id API failed");
    
            const data = await response.json();
    
            const candidate: PendingCandidate = {
                id: data.id,
                token: qrData.token,
                number: data.count ?? 0,
                start: data.start ?? "-",
                name: data.name ?? "不明",
            };
    
            setPendingCandidate(candidate);
            setShowConfirmModal(true);
            updateDifficulty(difficulty)
        } catch (err) {
            console.error("check-id API エラー:", err);
            setAddParticipantError("参加者情報の取得に失敗しました");
        }
    };

    /** ------------------ 確認モーダル確定 ------------------ **/
    const confirmStart = () => {
        if (!pendingCandidate) return;
        setShowConfirmModal(false);
        setQueuedParticipants(prev => prev.some(p => p.id === pendingCandidate.id && p.token === pendingCandidate.token) ? prev : [...prev, pendingCandidate]);
        setPendingCandidate(null);
        setAddParticipantScan(true);
        setScanStatus("waiting");
    };

    /** ------------------ 待機中一括開始 ------------------ **/
    const startQueuedGroups = async () => {
        stopAddParticipantScan()
        for (const p of queuedParticipants) {
            await startGame(p.id, p);
        }
        setQueuedParticipants([]);
        setScanStatus("started");
    };

    const stopAllGroups = async () => {
        for (const session of activeSessions) {
            await stopGame(session.id)
        }
        setScanStatus("stopped");
        await clearSERef.current?.play()
        setTimeout(() => {
            if (clearSERef.current) clearSERef.current.currentTime = 0
        }, 3000)
    }

    function resetData() {
        setPendingCandidate(null);
        setElapsedTime(0)
        setQueuedParticipants([]);
        setActiveSessions([]);
        setGlobalStartTime(null)
        setTimeout(() => {
            setScanStatus("idle");
        }, 1000)
    }

    async function updateDifficulty(data: string) {
        console.log(data)
        setDifficulty(data)
        for (const participant of queuedParticipants) {
            const response = await fetch("/api/updateDifficulty", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "id": participant.id,
                    "difficulty": difficulty
                })
            })
            if (!response.ok) throw new Error(`難易度の変更に失敗しました。HTTP: ${response.status}`);
            const { success }: { success: boolean } = await response.json()
            if (!success) throw new Error(`難易度の変更に失敗しました。Status: ${success}`);
        }
    }

    return (
        <Container size="lg" py="xl">
            <Stack align="center" gap="xl">
                <Stack align="center" gap="md">
                    <ThemeIcon size={80} radius="xl" color="blue" variant="gradient">
                        <IconClock size={40} />
                    </ThemeIcon>
                    <Title order={1}>ゲーム管理</Title>
                    <Text>QRコードをスキャンしてゲームを開始・停止</Text>
                </Stack>
                <audio src="/clear.mp3" ref={clearSERef}></audio>

                <Card shadow="xl" p="xl" radius="lg" withBorder style={{ width: '100%', maxWidth: 800 }}>
                    <Stack gap="lg">
                        <StatusCard scanStatus={scanStatus} elapsedTime={elapsedTime} queuedCount={queuedParticipants.length} />
                        <Divider></Divider>
                        <Stack justify="center" align="stretch">
                            <Center>難易度選択</Center>
                            <SegmentedControl disabled={scanStatus == "started" || scanStatus == "stopped"} value={difficulty} onChange={updateDifficulty} data={["EASY", "HARD"]}></SegmentedControl>
                        </Stack>
                    </Stack>
                </Card>
                

                <ActiveSessionsList activeSessions={activeSessions} participantMetaById={participantMetaById} onStop={stopGame} />
            
                <Card shadow="md" p="xl" radius="lg" withBorder style={{ width: "100%", maxWidth: 600 }}>
                    <Stack gap="lg">

                        {(scanStatus === "waiting" || scanStatus == "idle") && (
                            <>
                                <Button size="xl" color="green" leftSection={<IconQrcode size={24} />} onClick={startAddParticipantScan}>
                                    新しいグループを追加（QRスキャン）
                                </Button>
                                <QRScanner enabled={addParticipantScan} onScanned={handleAddParticipantQRCodeScanned} error={addParticipantError}></QRScanner>
                            </>
                        )}

                        {scanStatus === "started" && (
                            <>
                                <Button size="xl" color="green" leftSection={<IconQrcode size={24} />} onClick={startStopGameScan}>
                                    クリア（QRスキャン）
                                </Button>
                                <QRScanner enabled={stopGameScan} onScanned={handleStopGameScanned} error={stopGameError}></QRScanner>
                            </>
                        )}

                        

                        <Group justify="center">
                            {(scanStatus === "waiting" || scanStatus == "idle") && (
                                <Button size="md" color="blue" leftSection={<IconPlayerPlay size={18} />} onClick={startQueuedGroups} disabled={queuedParticipants.length === 0}>
                                    ゲーム開始（待機中 {queuedParticipants.length}）
                                </Button>
                            )}
                            {scanStatus == "started" && (
                                <Button size="md" color="blue" leftSection={<IconPlayerStopFilled size={18} />} onClick={stopAllGroups}>
                                    ゲーム停止
                                </Button>
                            )}
                            {scanStatus == "stopped" && (
                                <Button size="md" color="green" leftSection={<IconPlus size={18} />} onClick={resetData}>
                                    次のグループを開始
                                </Button>
                            )}
                        </Group>
                    </Stack>
                </Card>

                <ConfirmStartModal
                    opened={showConfirmModal}
                    pendingCandidate={pendingCandidate}
                    onConfirm={confirmStart}
                    onCancel={() => { setShowConfirmModal(false); setPendingCandidate(null); setAddParticipantScan(true); setScanStatus("waiting"); }}
                />

                <Button variant="light" color="blue" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push("/admin")} size="lg">
                    管理画面に戻る
                </Button>
            </Stack>
        </Container>
    );
};

export default StartStopPage;
