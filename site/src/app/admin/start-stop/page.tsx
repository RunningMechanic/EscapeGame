"use client";  // ← 必須: React Hooks を使うため

import React, { useState, useEffect, useCallback } from "react";
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

interface GameSession {
    id: number;
    startTime: Date | null;
    endTime: Date | null;
    isActive: boolean;
    timeTaken: number | null;
    participantId: number | null;
}

const StartStopPage = () => {
    const router = useRouter();
    const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
    const [isWaitingForScan, setIsWaitingForScan] = useState(false);
    const [scanStatus, setScanStatus] = useState<'idle' | 'waiting' | 'started' | 'stopped'>('idle');
    const [participantInfo, setParticipantInfo] = useState<{
        id: number;
        number: number;
        start: string;
        alignment: boolean;
        gameStarted: boolean;
    } | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);

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
                setCurrentSession({
                    id: result.sessionId,
                    startTime: new Date(),
                    endTime: null,
                    isActive: true,
                    timeTaken: null,
                    participantId,
                });
                setElapsedTime(0);
            }
        } catch (error) {
            console.error('ゲーム開始エラー:', error);
        }
    }, []);

    // ゲーム停止
    const stopGame = useCallback(async () => {
        if (!currentSession) return;

        try {
            const response = await fetch('/api/stopGame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: currentSession.id,
                    participantId: currentSession.participantId,
                    timeTaken: elapsedTime,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                setCurrentSession(prev => prev ? {
                    ...prev,
                    endTime: new Date(),
                    isActive: false,
                    timeTaken: result.timeTaken,
                } : null);
                setScanStatus('stopped');
                console.log('ゲーム停止完了 - タイム:', result.timeTaken, '秒');
            }
        } catch (error) {
            console.error('ゲーム停止エラー:', error);
        }
    }, [currentSession, elapsedTime]);

    // タイマー
    useEffect(() => {
        if (!currentSession?.isActive || !currentSession.startTime) return;

        const interval = setInterval(() => {
            const now = new Date();
            const start = new Date(currentSession.startTime!);
            const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
            setElapsedTime(elapsed);

            if (elapsed >= 600) {
                console.log('制限時間10分に達しました。自動リタイアします。');
                stopGame();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currentSession, stopGame]);

    // QRコードスキャン監視
    useEffect(() => {
        if (!isWaitingForScan) return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch('/api/getReceptionList');
                const result = await response.json();

                console.log('チェックイン済み参加者:', result.data);

                if (result.success && Array.isArray(result.data)) {
                    const candidates = result.data.filter((p: {
                        id: number;
                        number: number;
                        time: string;
                        alignment: boolean;
                        gameStarted: boolean;
                    }) => p.alignment === true && !p.gameStarted);

                    if (candidates.length > 0) {
                        const activeParticipant = [...candidates].sort((a, b) => b.id - a.id)[0];

                        const dt = new Date(activeParticipant.time);
                        const hh = dt.getHours().toString().padStart(2, '0');
                        const mm = dt.getMinutes().toString().padStart(2, '0');

                        console.log('スキャンされた参加者(選択):', activeParticipant);
                        setParticipantInfo({
                            id: activeParticipant.id,
                            number: activeParticipant.number,
                            start: `${hh}:${mm}`,
                            alignment: activeParticipant.alignment,
                            gameStarted: activeParticipant.gameStarted,
                        });
                        setScanStatus('started');
                        setIsWaitingForScan(false);
                        startGame(activeParticipant.id);
                    }
                }
            } catch (error) {
                console.error('参加者チェックエラー:', error);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [isWaitingForScan, startGame]);

    const startWaitingForScan = () => {
        setIsWaitingForScan(true);
        setScanStatus('waiting');
        setParticipantInfo(null);
    };

    const resetSession = () => {
        setCurrentSession(null);
        setScanStatus('idle');
        setIsWaitingForScan(false);
        setParticipantInfo(null);
        setElapsedTime(0);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
                <Card shadow="xl" p="xl" radius="lg" withBorder style={{ width: '100%', maxWidth: 800 }}>
                    <Stack gap="lg">
                        <Group justify="center" gap="md">
                            <ThemeIcon size={50} radius="xl" color="blue" variant="light">
                                <IconQrcode size={25} />
                            </ThemeIcon>
                            <Title order={2} c="dark">現在の状態</Title>
                        </Group>

                        <Grid>
                            <Grid.Col span={6}>
                                <Paper p="md" radius="md" withBorder style={{ background: '#f8f9fa' }}>
                                    <Stack align="center" gap="sm">
                                        <Text size="sm" c="dimmed" fw={500}>ゲーム状態</Text>
                                        <Badge
                                            size="xl"
                                            color={
                                                scanStatus === 'idle' ? 'gray' :
                                                    scanStatus === 'waiting' ? 'orange' :
                                                        scanStatus === 'started' ? 'green' : 'red'
                                            }
                                            variant="light"
                                            radius="md"
                                        >
                                            {scanStatus === 'idle' && '待機中'}
                                            {scanStatus === 'waiting' && 'スキャン待機中'}
                                            {scanStatus === 'started' && 'ゲーム中'}
                                            {scanStatus === 'stopped' && '終了'}
                                        </Badge>
                                    </Stack>
                                </Paper>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Paper
                                    p="md"
                                    radius="md"
                                    withBorder
                                    style={{
                                        background: elapsedTime >= 540 ? '#fff5f5' : '#f8f9fa',
                                        borderColor: elapsedTime >= 540 ? '#ff6b6b' : undefined
                                    }}
                                >
                                    <Stack align="center" gap="sm">
                                        <Text size="sm" c="dimmed" fw={500}>経過時間</Text>
                                        <Text size="xl" fw={700} c={elapsedTime >= 540 ? "red" : "dark"}>
                                            {formatTime(elapsedTime)}
                                        </Text>
                                        {elapsedTime >= 540 && (
                                            <Badge size="sm" color="red" variant="light">
                                                残り {formatTime(600 - elapsedTime)}
                                            </Badge>
                                        )}
                                    </Stack>
                                </Paper>
                            </Grid.Col>
                        </Grid>

                        {/* 参加者情報 */}
                        {participantInfo && (
                            <Paper p="md" radius="md" withBorder style={{ background: '#e8f5e8' }}>
                                <Stack gap="sm">
                                    <Group gap="sm">
                                        <ThemeIcon size={30} radius="xl" color="green" variant="light">
                                            <IconUsers size={15} />
                                        </ThemeIcon>
                                        <Text fw={600} c="dark">参加者情報</Text>
                                    </Group>
                                    <Group gap="lg">
                                        <Text size="sm" c="dimmed">ID: <Text span fw={600}>{participantInfo.id}</Text></Text>
                                        <Text size="sm" c="dimmed">人数: <Text span fw={600}>{participantInfo.number}名</Text></Text>
                                        <Text size="sm" c="dimmed">時間: <Text span fw={600}>{participantInfo.start}</Text></Text>
                                    </Group>
                                </Stack>
                            </Paper>
                        )}
                    </Stack>
                </Card>

                {/* 操作ボタン */}
                <Card shadow="md" p="xl" radius="lg" withBorder style={{ width: '100%', maxWidth: 600 }}>
                    <Stack gap="lg">
                        {scanStatus === 'idle' && (
                            <Button
                                size="xl"
                                color="green"
                                leftSection={<IconPlayerPlay size={24} />}
                                onClick={startWaitingForScan}
                                style={{ fontSize: '1.5rem', fontWeight: 600, padding: '20px 40px', height: '80px' }}
                            >
                                ゲーム開始（QRスキャン待機）
                            </Button>
                        )}

                        {scanStatus === 'waiting' && (
                            <Stack align="center" gap="md">
                                <Alert
                                    icon={<IconQrcode size="1rem" />}
                                    title="スキャン待機中"
                                    color="orange"
                                    variant="light"
                                    style={{ width: '100%' }}
                                >
                                    スマートフォンのQRコードをスキャンしてください
                                </Alert>
                                <Button size="lg" color="gray" variant="outline" onClick={resetSession}>キャンセル</Button>
                            </Stack>
                        )}

                        {scanStatus === 'started' && (
                            <Stack gap="md">
                                {elapsedTime >= 540 && (
                                    <Alert
                                        icon={<IconClock size="1rem" />}
                                        title="⚠️ 制限時間まで残り1分！"
                                        color="red"
                                        variant="light"
                                        style={{ width: '100%' }}
                                    >
                                        制限時間10分に達すると自動的にリタイアとなります
                                    </Alert>
                                )}
                                <Button
                                    size="xl"
                                    color="red"
                                    leftSection={<IconSquare size={24} />}
                                    onClick={stopGame}
                                    style={{ fontSize: '1.5rem', fontWeight: 600, padding: '20px 40px', height: '80px' }}
                                >
                                    ゲーム停止（QRスキャン）
                                </Button>
                            </Stack>
                        )}

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
        </Container>
    );
};

export default StartStopPage;
