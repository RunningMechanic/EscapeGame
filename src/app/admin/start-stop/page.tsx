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
} from "@mantine/core";
import { IconPlayerPlay, IconClock, IconQrcode, IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { StatusCard } from "./StatusCard";
import { ActiveSessionsList } from "./ActiveSessionsList";
import { ConfirmStartModal } from "./ConfirmStartModal";
import { extractParticipantFromQR } from "./utils";
import type { GameSession, PendingCandidate, ParticipantMetaById, ScanStatus } from "./types";

const StartStopPage = () => {
    const router = useRouter();

    const [activeSessions, setActiveSessions] = useState<GameSession[]>([]);
    const [queuedParticipants, setQueuedParticipants] = useState<PendingCandidate[]>([]);
    const [pendingCandidate, setPendingCandidate] = useState<PendingCandidate | null>(null);
    const [participantMetaById, setParticipantMetaById] = useState<ParticipantMetaById>({});
    const [isWaitingForScan, setIsWaitingForScan] = useState(false);
    const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [startScanError, setStartScanError] = useState<string | null>(null);
    const [globalStartTime, setGlobalStartTime] = useState<Date | null>(null);

    const startVideoRef = useRef<HTMLVideoElement | null>(null);
    const startStreamRef = useRef<MediaStream | null>(null);
    const startScanRafRef = useRef<number | null>(null);
    const startCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const stopScan = () => {
        setIsWaitingForScan(false);
        if (startScanRafRef.current) {
            cancelAnimationFrame(startScanRafRef.current);
            startScanRafRef.current = null;
        }
        if (startVideoRef.current) {
            startVideoRef.current.pause();
            startVideoRef.current.srcObject = null;
        }
        startStreamRef.current?.getTracks().forEach((t) => t.stop());
        startStreamRef.current = null;
    };
    
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
                stopScan();
            } catch (error) {
                console.error("ゲーム開始エラー:", error);
            }
        },
        [globalStartTime]
    );
/**     ------------------ ゲーム停止 ------------------ **/
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
    const startWaitingForScan = () => {
        setIsWaitingForScan(true);
        setScanStatus("waiting");
    };

    useEffect(() => {
        if (!isWaitingForScan) return;
        let cancelled = false;

        const startScanner = async () => {
            try {
                setStartScanError(null);
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                startStreamRef.current = stream;
                if (startVideoRef.current) {
                    startVideoRef.current.srcObject = stream;
                    await startVideoRef.current.play();
                }

                const BarcodeDetectorCtor: any = (globalThis as any).BarcodeDetector;
                if (BarcodeDetectorCtor) {
                    const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
                    const detectOnce = async () => {
                        if (cancelled) return;
                        if (startVideoRef.current && !startVideoRef.current.paused && !startVideoRef.current.ended) {
                            const barcodes = await detector.detect(startVideoRef.current);
                            if (barcodes?.length) {
                                const raw = (barcodes[0].rawValue || "").toString();
                                const data = extractParticipantFromQR(raw);
                                if (data?.id != null) {
                                    console.log("QR検出 (BarcodeDetector):", data);
                                    handleScannedParticipantId(data);
                                }
                            }
                        }
                        startScanRafRef.current = requestAnimationFrame(detectOnce);
                    };
                    startScanRafRef.current = requestAnimationFrame(detectOnce);
                } else {
                    if (!startCanvasRef.current) startCanvasRef.current = document.createElement("canvas");
                    const detectOnce = () => {
                        if (cancelled) return;
                        const video = startVideoRef.current;
                        const canvas = startCanvasRef.current;
                        if (video && canvas && video.videoWidth && video.videoHeight) {
                            if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
                            if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
                            const ctx = canvas.getContext("2d");
                            if (ctx) {
                                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                                const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
                                if (code?.data) {
                                    const data = extractParticipantFromQR(code.data);
                                    if (data?.id != null) {
                                        console.log("QR検出 (jsQR):", data);
                                        handleScannedParticipantId(data);
                                    }
                                }
                            }
                        }
                        startScanRafRef.current = requestAnimationFrame(detectOnce);
                    };
                    startScanRafRef.current = requestAnimationFrame(detectOnce);
                }
            } catch (e) {
                console.error(e);
                setStartScanError("カメラにアクセスできません。");
            }
        };
        startScanner();

        return () => {
            cancelled = true;
            if (startScanRafRef.current) cancelAnimationFrame(startScanRafRef.current);
            if (startVideoRef.current) {
                startVideoRef.current.pause();
                startVideoRef.current.srcObject = null;
            }
            startStreamRef.current?.getTracks().forEach((t) => t.stop());
            startStreamRef.current = null;
        };
    }, [isWaitingForScan]);

    /** ------------------ QRスキャン結果処理 ------------------ **/
    const lastScannedTokenRef = useRef<string | null>(null);
    /** ------------------ QRスキャン結果処理 ------------------ **/
    const handleScannedParticipantId = async (qrData: { id: number; token: string }) => {
        console.log("Scanned QR:", qrData);
    
        // スキャンを一旦停止
        setIsWaitingForScan(false);
        if (startScanRafRef.current) {
            cancelAnimationFrame(startScanRafRef.current);
            startScanRafRef.current = null;
        }
        if (startVideoRef.current) {
            startVideoRef.current.pause();
            startVideoRef.current.srcObject = null;
        }
        startStreamRef.current?.getTracks().forEach((t) => t.stop());
        startStreamRef.current = null;
    
        // すでにアクティブ or 待機中ならモーダル出さない
        const alreadyActive = activeSessions.some(
            (s) => s.isActive && s.participantId === qrData.id && s.token === qrData.token
        );
        const alreadyQueued = queuedParticipants.some(
            (p) => p.id === qrData.id && p.token === qrData.token
        );
        if (alreadyActive || alreadyQueued) {
            setStartScanError(alreadyQueued ? "このIDは待機中です（同じtoken）" : "このIDはすでに計測中です");
            return;
        }
    
        setPendingCandidate(null);
        setShowConfirmModal(false);
    
        try {
            const baseUrl = window.location.origin;
    
            const response = await fetch(`${baseUrl}/api/checkid?id=${qrData.id}&token=${qrData.token}`);
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
        } catch (err) {
            console.error("check-id API エラー:", err);
            setStartScanError("参加者情報の取得に失敗しました");
        }
    };
    





    /** ------------------ 確認モーダル確定 ------------------ **/
    const confirmStart = () => {
        if (!pendingCandidate) return;
        setShowConfirmModal(false);
        setQueuedParticipants(prev => prev.some(p => p.id === pendingCandidate.id && p.token === pendingCandidate.token) ? prev : [...prev, pendingCandidate]);
        setPendingCandidate(null);
        setIsWaitingForScan(true);
        setScanStatus("waiting");
    };

    /** ------------------ 待機中一括開始 ------------------ **/
    const startQueuedGroups = async () => {
        for (const p of queuedParticipants) {
            await startGame(p.id, p);
        }
        setQueuedParticipants([]);
        setScanStatus("started");
    };

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

                <StatusCard scanStatus={scanStatus} elapsedTime={elapsedTime} queuedCount={queuedParticipants.length} />

                <ActiveSessionsList activeSessions={activeSessions} participantMetaById={participantMetaById} onStop={stopGame} />

                <Card shadow="md" p="xl" radius="lg" withBorder style={{ width: "100%", maxWidth: 600 }}>
                    <Stack gap="lg">
                        <Button size="xl" color="green" leftSection={<IconQrcode size={24} />} onClick={startWaitingForScan}>
                            新しいグループを追加（QRスキャン）
                        </Button>

                        {scanStatus === "waiting" && (
                            <Stack align="center">
                                <Alert title="スキャン待機中" color="orange" variant="light">QRコードをスキャンしてください</Alert>
                                {startScanError && <Alert color="red" variant="light" title="エラー">{startScanError}</Alert>}
                                <video ref={startVideoRef} style={{ width: "100%", maxHeight: 280, background: "#000", borderRadius: 8 }} muted playsInline />
                            </Stack>
                        )}

                        <Group justify="center">
                            <Button size="md" color="blue" leftSection={<IconPlayerPlay size={18} />} onClick={startQueuedGroups} disabled={queuedParticipants.length === 0}>
                                ゲーム開始（待機中 {queuedParticipants.length}）
                            </Button>
                        </Group>
                    </Stack>
                </Card>

                <ConfirmStartModal
                    opened={showConfirmModal}
                    pendingCandidate={pendingCandidate}
                    onConfirm={confirmStart}
                    onCancel={() => { setShowConfirmModal(false); setPendingCandidate(null); setIsWaitingForScan(true); setScanStatus("waiting"); }}
                />

                <Button variant="light" color="blue" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push("/admin")} size="lg">
                    管理画面に戻る
                </Button>
            </Stack>
        </Container>
    );
};

export default StartStopPage;
