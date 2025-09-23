"use client";  // ← 必須: React Hooks を使うため

import React, { useState, useEffect, useCallback, useRef } from "react";
import jsQR from 'jsqr';
import {
    Container,
    Title,
    Text,
    Button,
    Group,
    Stack,
    Card,
    ThemeIcon,
    Badge,
    Paper,
    Alert,
    Grid,
} from '@mantine/core';
import {
    IconPlayerPlay,
    IconSquare,
    IconClock,
    IconQrcode,
    IconUsers,
    IconArrowLeft,
    IconCheck,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { StatusCard } from './StatusCard';
import { ActiveSessionsList } from './ActiveSessionsList';
import { ConfirmStartModal } from './ConfirmStartModal';
import { formatTime, extractParticipantId } from './utils';
import type { GameSession, ParticipantInfo, PendingCandidate, ParticipantMetaById, ScanStatus } from './types';

// 型は `./types` から取得

const StartStopPage = () => {
    const router = useRouter();
    const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
    const [activeSessions, setActiveSessions] = useState<GameSession[]>([]);
    const [isWaitingForScan, setIsWaitingForScan] = useState(false);
    const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
    const [participantInfo, setParticipantInfo] = useState<ParticipantInfo | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [queuedParticipants, setQueuedParticipants] = useState<PendingCandidate[]>([]);
    const [pendingCandidate, setPendingCandidate] = useState<PendingCandidate | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isWaitingForStopScan, setIsWaitingForStopScan] = useState(false);
    const [selectedStopSessionId, setSelectedStopSessionId] = useState<number | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const startVideoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const startStreamRef = useRef<MediaStream | null>(null);
    const scanRafRef = useRef<number | null>(null);
    const startScanRafRef = useRef<number | null>(null);
    const [stopScanError, setStopScanError] = useState<string | null>(null);
    const [startScanError, setStartScanError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const startCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [participantMetaById, setParticipantMetaById] = useState<ParticipantMetaById>({});
    const [globalStartTime, setGlobalStartTime] = useState<Date | null>(null);

    // ゲーム開始
    const startGame = useCallback(async (participantId: number) => {
        try {
            const response = await fetch('/api/startGame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participantId }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('ゲーム開始:', result);
                const baseStart = globalStartTime ?? new Date();
                if (!globalStartTime) setGlobalStartTime(baseStart);
                setActiveSessions(prev => ([
                    ...prev,
                    {
                        id: result.sessionId,
                        startTime: baseStart,
                        endTime: null,
                        isActive: true,
                        timeTaken: null,
                        participantId,
                    }
                ]));
                setElapsedTime(0);
                setScanStatus('started');
            }
        } catch (error) {
            console.error('ゲーム開始エラー:', error);
        }
    }, [globalStartTime]);

    // ゲーム停止
    const stopGame = useCallback(async (targetSessionId?: number) => {
        const target = targetSessionId
            ? activeSessions.find(s => s.id === targetSessionId)
            : currentSession;
        if (!target) return;

        try {
            const response = await fetch('/api/stopGame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: target.id,
                    participantId: target.participantId,
                    timeTaken: target.startTime ? Math.floor((Date.now() - new Date(target.startTime).getTime()) / 1000) : elapsedTime,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                setCurrentSession(prev => prev && prev.id === target.id ? {
                    ...prev,
                    endTime: new Date(),
                    isActive: false,
                    timeTaken: result.timeTaken,
                } : prev);
                setActiveSessions(prev => prev.map(s => s.id === target.id ? ({
                    ...s,
                    endTime: new Date(),
                    isActive: false,
                    timeTaken: result.timeTaken,
                }) : s));
                // 他にアクティブが無ければ終了表示
                const anyActive = activeSessions.some(s => s.id !== target.id && s.isActive);
                if (!anyActive) setScanStatus('stopped');
                console.log('ゲーム停止完了 - タイム:', result.timeTaken, '秒');
            }
        } catch (error) {
            console.error('ゲーム停止エラー:', error);
        }
    }, [currentSession, activeSessions, elapsedTime]);

    // タイマー（全グループ共通のスタート時刻で計測）
    useEffect(() => {
        if (!globalStartTime || activeSessions.filter(s => s.isActive).length === 0) return;
        const interval = setInterval(() => {
            const now = Date.now();
            const start = new Date(globalStartTime).getTime();
            const elapsed = Math.floor((now - start) / 1000);
            setElapsedTime(elapsed);
            if (elapsed >= 600) {
                console.log('制限時間10分に達しました。自動リタイアします。');
                stopAllActive();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [globalStartTime, activeSessions]);

    // すべてのアクティブセッションを停止
    const stopAllActive = useCallback(async () => {
        const actives = activeSessions.filter(s => s.isActive);
        if (actives.length === 0) return;
        const baseStart = globalStartTime ?? new Date();
        const timeTaken = Math.floor((Date.now() - new Date(baseStart).getTime()) / 1000);
        try {
            await Promise.all(actives.map(async (s) => {
                const resp = await fetch('/api/stopGame', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: s.id,
                        participantId: s.participantId,
                        timeTaken,
                    }),
                });
                if (resp.ok) {
                    const result = await resp.json();
                    setActiveSessions(prev => prev.map(x => x.id === s.id ? ({
                        ...x,
                        endTime: new Date(),
                        isActive: false,
                        timeTaken: result.timeTaken,
                    }) : x));
                }
            }));
            setScanStatus('stopped');
        } catch (e) {
            console.error('一括停止エラー:', e);
        } finally {
            setGlobalStartTime(null);
        }
    }, [activeSessions, globalStartTime]);

    // QRコードスキャン監視（開始候補のPolling）: 待機中のみ実行。候補はQRスキャンでのみ出す
    useEffect(() => {
        if (!isWaitingForScan || showConfirmModal) return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch('/api/getReceptionList');
                const result = await response.json();

                const list = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : [];
                // ログ抑制: 件数のみ
                console.log('チェックイン済み参加者件数:', Array.isArray(list) ? list.length : 0);
            } catch (error) {
                console.error('参加者チェックエラー:', error);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [isWaitingForScan, showConfirmModal]);

    // 停止用QR("clear")スキャン開始
    const startWaitingForStopScan = async (sessionId?: number) => {
        if (sessionId) setSelectedStopSessionId(sessionId);
        setStopScanError(null);
        setIsWaitingForStopScan(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        } catch (e) {
            console.error(e);
            setStopScanError('カメラにアクセスできません。ブラウザの権限を確認してください。');
        }
    };

    // 停止用QRスキャンループ
    useEffect(() => {
        if (!isWaitingForStopScan) return;

        let cancelled = false;

        const loop = async () => {
            try {
                const BarcodeDetectorCtor: any = (globalThis as any).BarcodeDetector;
                if (BarcodeDetectorCtor) {
                    // BarcodeDetector が使える場合
                    const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
                    const detectOnce = async () => {
                        if (cancelled) return;
                        if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
                            const barcodes = await detector.detect(videoRef.current);
                            if (barcodes && barcodes.length > 0) {
                                const raw = (barcodes[0].rawValue || '').trim().toLowerCase();
                                if (raw === 'clear') {
                                    await stopAllActive();
                                    stopStopScan();
                                    return;
                                }
                            }
                        }
                        scanRafRef.current = requestAnimationFrame(detectOnce);
                    };
                    scanRafRef.current = requestAnimationFrame(detectOnce);
                } else {
                    // フォールバック: jsQR + Canvas
                    if (!canvasRef.current) {
                        canvasRef.current = document.createElement('canvas');
                    }
                    const detectOnce = () => {
                        if (cancelled) return;
                        const video = videoRef.current;
                        const canvas = canvasRef.current;
                        if (video && canvas && video.videoWidth && video.videoHeight) {
                            if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
                            if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                                    inversionAttempts: 'dontInvert'
                                });
                                if (code && code.data) {
                                    const raw = String(code.data).trim().toLowerCase();
                                    if (raw === 'clear') {
                                        stopAllActive().then(() => {
                                            stopStopScan();
                                        });
                                        return;
                                    }
                                }
                            }
                        }
                        scanRafRef.current = requestAnimationFrame(detectOnce);
                    };
                    scanRafRef.current = requestAnimationFrame(detectOnce);
                }
            } catch (e) {
                console.error('停止用QRスキャンエラー:', e);
                setStopScanError('スキャン中にエラーが発生しました。');
            }
        };

        loop();

        return () => {
            cancelled = true;
            if (scanRafRef.current) cancelAnimationFrame(scanRafRef.current);
        };
    }, [isWaitingForStopScan, stopGame]);

    const stopStopScan = () => {
        setIsWaitingForStopScan(false);
        setSelectedStopSessionId(null);
        if (scanRafRef.current) {
            cancelAnimationFrame(scanRafRef.current);
            scanRafRef.current = null;
        }
        if (videoRef.current) {
            try { videoRef.current.pause(); } catch { }
            videoRef.current.srcObject = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    const startWaitingForScan = () => {
        setIsWaitingForScan(true);
        setScanStatus('waiting');
        setParticipantInfo(null);
    };

    const resetSession = () => {
        setCurrentSession(null);
        setActiveSessions([]);
        setSelectedStopSessionId(null);
        setScanStatus('idle');
        setIsWaitingForScan(false);
        setParticipantInfo(null);
        setElapsedTime(0);
        setQueuedParticipants([]);
    };

    // 時刻表示は utils の formatTime を使用

    const confirmStart = async () => {
        if (!pendingCandidate) return;
        setShowConfirmModal(false);
        // 即時開始せず、キューに追加
        setQueuedParticipants(prev => {
            const exists = prev.some(p => p.id === pendingCandidate.id);
            return exists ? prev : [...prev, pendingCandidate];
        });
        setParticipantMetaById(prev => ({
            ...prev,
            [pendingCandidate.id]: {
                number: pendingCandidate.number,
                name: pendingCandidate.name,
                start: pendingCandidate.start,
            },
        }));
        setPendingCandidate(null);
        // 連続スキャンできるように戻す
        setIsWaitingForScan(true);
        setScanStatus('waiting');
    };

    const cancelStart = () => {
        setShowConfirmModal(false);
        setPendingCandidate(null);
        setIsWaitingForScan(true);
        setScanStatus('waiting');
    };

    const resetReceptionCandidates = () => {
        setPendingCandidate(null);
        setShowConfirmModal(false);
        setStartScanError(null);
        setIsWaitingForScan(true);
        setScanStatus('waiting');
        try { router.refresh(); } catch { }
    };

    // 開始用: 待機中にQRをスキャンしてIDを特定
    useEffect(() => {
        if (!isWaitingForScan) return;

        let cancelled = false;

        const startScanner = async () => {
            try {
                setStartScanError(null);
                // カメラ起動
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                startStreamRef.current = stream;
                if (startVideoRef.current) {
                    startVideoRef.current.srcObject = stream;
                    await startVideoRef.current.play();
                }

                const BarcodeDetectorCtor: any = (globalThis as any).BarcodeDetector;
                if (BarcodeDetectorCtor) {
                    const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
                    const detectOnce = async () => {
                        if (cancelled) return;
                        if (startVideoRef.current && !startVideoRef.current.paused && !startVideoRef.current.ended) {
                            const barcodes = await detector.detect(startVideoRef.current);
                            if (barcodes && barcodes.length > 0) {
                                const raw = (barcodes[0].rawValue || '').toString();
                                const id = extractParticipantId(raw);
                                if (id != null) {
                                    await handleScannedParticipantId(id);
                                    return;
                                }
                            }
                        }
                        startScanRafRef.current = requestAnimationFrame(detectOnce);
                    };
                    startScanRafRef.current = requestAnimationFrame(detectOnce);
                } else {
                    // フォールバック: jsQR + Canvas
                    if (!startCanvasRef.current) startCanvasRef.current = document.createElement('canvas');
                    const detectOnce = () => {
                        if (cancelled) return;
                        const video = startVideoRef.current;
                        const canvas = startCanvasRef.current;
                        if (video && canvas && video.videoWidth && video.videoHeight) {
                            if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
                            if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                                const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
                                if (code && code.data) {
                                    const raw = String(code.data);
                                    const id = extractParticipantId(raw);
                                    if (id != null) {
                                        handleScannedParticipantId(id);
                                        return;
                                    }
                                }
                            }
                        }
                        startScanRafRef.current = requestAnimationFrame(detectOnce);
                    };
                    startScanRafRef.current = requestAnimationFrame(detectOnce);
                }
            } catch (e) {
                console.error('開始用QRスキャンエラー:', e);
                setStartScanError('カメラにアクセスできません。権限やHTTPSを確認してください。');
            }
        };

        startScanner();

        return () => {
            cancelled = true;
            if (startScanRafRef.current) cancelAnimationFrame(startScanRafRef.current);
            if (startVideoRef.current) {
                try { startVideoRef.current.pause(); } catch { }
                startVideoRef.current.srcObject = null;
            }
            if (startStreamRef.current) {
                startStreamRef.current.getTracks().forEach(t => t.stop());
                startStreamRef.current = null;
            }
        };
    }, [isWaitingForScan]);

    // extractParticipantId は utils から利用

    const handleScannedParticipantId = async (id: number) => {
        try {
            // 重複チェック（アクティブ・キュー）
            const alreadyActive = activeSessions.some(s => s.participantId === id && s.isActive);
            const alreadyQueued = queuedParticipants.some(p => p.id === id);
            if (alreadyActive || alreadyQueued) {
                setStartScanError(alreadyQueued ? 'このIDは待機中です' : 'このIDはすでに計測中です');
                return;
            }

            // 受付リストでメタ情報を補完（見つからなくても続行）
            let candidate: PendingCandidate = { id, number: 0, start: '-', name: undefined };
            try {
                const response = await fetch('/api/getReceptionList');
                const result = await response.json();
                const list = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : [];
                const entry = Array.isArray(list) ? list.find((p: any) => p.id === id) : undefined;
                if (entry) {
                    const dt = new Date(entry.time);
                    const hh = dt.getHours().toString().padStart(2, '0');
                    const mm = dt.getMinutes().toString().padStart(2, '0');
                    candidate = { id: entry.id, number: entry.number ?? 0, start: `${hh}:${mm}`, name: entry.name };
                }
            } catch (err) {
                // ignore
            }

            setPendingCandidate(candidate);
            setShowConfirmModal(true);
            setIsWaitingForScan(false);
        } catch (e) {
            console.error(e);
            setStartScanError('候補の取得に失敗しました');
        }
    };

    // 待機キューを一括開始
    const startQueuedGroups = async () => {
        if (queuedParticipants.length === 0) return;
        for (const p of queuedParticipants) {
            await startGame(p.id);
        }
        setQueuedParticipants([]);
        setScanStatus('started');
    };

    return (
        <Container size="lg" py="xl">
            <Stack align="center" gap="xl">
                {/* ヘッダー */}
                <Stack align="center" gap="md">
                    <ThemeIcon size={80} radius="xl" color="blue" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                        <IconClock size={40} />
                    </ThemeIcon>
                    <Title order={1} ta="center" c="dark" size="3rem">
                        ゲーム管理
                    </Title>
                    <Text ta="center" c="dimmed" size="lg">
                        スマートフォンのQRコードをスキャンしてゲームを開始・停止
                    </Text>
                </Stack>

                {/* 現在の状態 */}
                <StatusCard scanStatus={scanStatus} elapsedTime={elapsedTime} queuedCount={queuedParticipants.length} />

                {/* 参加者情報（複数・行表示） */}
                <ActiveSessionsList activeSessions={activeSessions} participantMetaById={participantMetaById} />

                {/* 待機中はステータスカード表示に集約 */}

                {/* 操作ボタン */}
                <Card shadow="md" p="xl" radius="lg" withBorder style={{ width: '100%', maxWidth: 600 }}>
                    <Stack gap="lg">
                        {/* スキャン追加ボタン（常時表示） */}
                        <Button
                            size="xl"
                            color="green"
                            leftSection={<IconQrcode size={24} />}
                            onClick={startWaitingForScan}
                            style={{ fontSize: '1.5rem', fontWeight: 600, padding: '20px 40px', height: '80px' }}
                        >
                            新しいグループを追加（QRスキャン）
                        </Button>

                        {scanStatus === 'waiting' && (
                            <Stack align="center" gap="md">
                                <Alert
                                    icon={<IconQrcode size="1rem" />}
                                    title="スキャン待機中"
                                    color="orange"
                                    variant="light"
                                    style={{ width: '100%' }}
                                >
                                    スマートフォンのQRコードをスキャンしてください（IDを含むQRで自動選択）
                                </Alert>
                                {startScanError && (
                                    <Alert color="orange" variant="light" title="注意">{startScanError}</Alert>
                                )}
                                <video ref={startVideoRef} style={{ width: '100%', maxHeight: 280, background: '#000', borderRadius: 8 }} muted playsInline />
                                <Button size="lg" color="gray" variant="outline" onClick={resetSession}>キャンセル</Button>
                            </Stack>
                        )}

                        <Group gap="md" justify="center">
                            <Button size="md" color="blue" leftSection={<IconPlayerPlay size={18} />} onClick={startQueuedGroups} disabled={queuedParticipants.length === 0}>ゲーム開始（待機中 {queuedParticipants.length}）</Button>
                        </Group>

                        {scanStatus === 'stopped' && currentSession && (
                            <Stack align="center" gap="lg">
                                <Alert
                                    icon={<IconCheck size="1rem" />}
                                    title={currentSession.timeTaken && currentSession.timeTaken >= 600 ? "⏰ リタイア" : "🎉 ゲーム完了"}
                                    color={currentSession.timeTaken && currentSession.timeTaken >= 600 ? "orange" : "green"}
                                    variant="light"
                                    style={{ width: '100%' }}
                                >
                                    {currentSession.timeTaken && currentSession.timeTaken >= 600
                                        ? `制限時間10分に達したためリタイアとなりました。タイム: ${formatTime(currentSession.timeTaken)}`
                                        : `ゲームが正常に終了しました。タイム: ${formatTime(currentSession.timeTaken || 0)}`
                                    }
                                </Alert>
                                <Group gap="md">
                                    <Button size="lg" color="blue" onClick={resetSession}>新しいゲーム</Button>
                                </Group>
                            </Stack>
                        )}
                    </Stack>
                </Card>

                {/* 追加確認モーダル */}
                <ConfirmStartModal
                    opened={showConfirmModal}
                    pendingCandidate={pendingCandidate}
                    onConfirm={confirmStart}
                    onCancel={cancelStart}
                />


                {/* 戻るボタン */}
                <Button
                    variant="light"
                    color="blue"
                    leftSection={<IconArrowLeft size={16} />}
                    onClick={() => router.push('/admin')}
                    size="lg"
                >
                    管理画面に戻る
                </Button>
            </Stack>
            {/* 受付候補リセット（右上固定） */}
            <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
                <Button size="compact-sm" variant="light" onClick={resetReceptionCandidates}>受付候補をリセット</Button>
            </div>
        </Container>
    );
};

export default StartStopPage;
