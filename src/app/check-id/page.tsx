'use client';

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { useQRCode } from 'next-qrcode';
import {
    Container,
    Text,
    Loader,
    Alert,
    Button,
    Modal,
    Group,
    Stack,
    Card,
    ThemeIcon,
    Title,
    Badge,
    Grid,
    Paper,
    TextInput
} from '@mantine/core';
import {
    IconCheck,
    IconAlertCircle,
    IconTrash,
    IconCalendarEvent,
    IconUsers,
    IconClock,
    IconMapPin,
    IconX,
    IconQrcode
} from '@tabler/icons-react';
import { ReceptionData } from "../receptionDataInterface";

const CheckIdPage = () => {
    const { Canvas } = useQRCode();
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const token = searchParams.get('token');
    const [data, setData] = useState<ReceptionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checkInStatus, setCheckInStatus] = useState<'pending' | 'success' | 'error'>('pending');
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [participantName, setParticipantName] = useState('');
    const [nameModalOpen, setNameModalOpen] = useState(false);
    const [editNameModalOpen, setEditNameModalOpen] = useState(false);
    const [editingName, setEditingName] = useState('');
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrUrl, setQrUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // トークンがない場合は直打ちとみなして拒否
                if (!token) {
                    setError('セッショントークンが無効です。正しいQRコードからアクセスしてください。');
                    setLoading(false);
                    return;
                }


                // localStorageから既存のIDを確認（クライアントサイドでのみ実行）
                let existingId = null;
                let existingToken = null;

                if (typeof window !== 'undefined') {
                    existingId = localStorage.getItem('currentId');
                    existingToken = localStorage.getItem('currentToken');
                }

                // 既存のIDがある場合、そのIDのデータを取得してchecker状態を確認
                console.log('既存のID:', existingId);
                console.log('現在のID:', id);
                if (existingId != id) {
                    console.log("重複予約")
                    try {
                        const existingResponse = await fetch(`/api/checkid?id=${existingId}&token=${existingToken}`);
                        if (existingResponse.ok) {
                            const existingData = await existingResponse.json();
                            console.log('既存のIDのデータ:', existingData.checker);
                            // 既存のIDのcheckerがfalseの場合（来場未）
                            if (existingData.checker === true) {
                                setError(`一度目の受付が終わらないと二度目の受付はできません。既存のID: ${existingId}`);
                                setLoading(false);
                                return;
                            }
                        }
                    } catch {
                        // 既存IDのデータ取得に失敗した場合は続行
                        console.log('既存IDのデータ取得に失敗しました');
                    }
                }

                // まずデータを取得（トークン付き）
                const response = await fetch(`/api/checkid?id=${id}&token=${token}`);
                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('セッショントークンが無効です。正しいQRコードからアクセスしてください。');
                    }
                    throw new Error('データの取得に失敗しました');
                }
                const result = await response.json();
                console.log('取得したデータ:', result);
                setData(result);

                // 既に名前が設定されている場合はモーダルを表示しない
                if (!result.name || result.name === '未入力') {
                    setNameModalOpen(true);
                } else {
                    // 既に名前がある場合は自動的にチェックイン状態にする
                    setCheckInStatus('success');
                }
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('予期しないエラーが発生しました');
                }
                setCheckInStatus('error');
                // エラーの場合もIDとトークンを保存（クライアントサイドでのみ実行）
                if (typeof window !== 'undefined') {
                    localStorage.setItem('currentId', id || '');
                    localStorage.setItem('currentToken', token || '');
                    localStorage.setItem('checkInStatus', 'error');
                }
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        } else {
            setError('IDが指定されていません');
            setLoading(false);
        }
    }, [id, token]);

    const handleCheckIn = async () => {
        if (!id) {
            alert('IDが指定されていません');
            return;
        }

        try {
            // 名前が入力されていない場合は「名無し」として保存
            const nameToSave = participantName.trim() || '名無し';
            console.log('updateAlignment呼び出し:', { id, name: nameToSave });
            const checkInResponse = await fetch(`/api/updateAlignment?id=${id}&name=${encodeURIComponent(nameToSave)}`);
            console.log('updateAlignmentレスポンス:', checkInResponse.status, checkInResponse.ok);

            if (checkInResponse.ok) {
                const updateData = await checkInResponse.json();
                console.log('updateAlignment成功:', updateData);

                setCheckInStatus('success');
                setNameModalOpen(false);

                // 🔽 dataを更新してUIに反映
                setData(prev => prev ? { ...prev, name: nameToSave, checker: true } : { ...updateData });

                // localStorageにIDとトークンを保存
                if (typeof window !== 'undefined') {
                    localStorage.setItem('currentId', id || '');
                    localStorage.setItem('currentToken', token || '');
                    localStorage.setItem('checkInStatus', 'success');
                }

                // ゲーム開始の準備完了を通知（初回チェックイン時のみ）
                if (checkInStatus === 'pending') {
                    setTimeout(() => {
                        alert('チェックイン完了！管理画面でゲーム開始の準備ができました。');
                    }, 1000);
                }
            } else {
                const errorData = await checkInResponse.json();
                console.error('updateAlignment失敗:', errorData);
                setCheckInStatus('error');
                alert('チェックインに失敗しました');
            }
        } catch (error) {
            console.error('チェックインエラー:', error);
            setCheckInStatus('error');
            alert('チェックイン中にエラーが発生しました');
        }
    };

    const handleNameCancel = () => {
        // 名前をキャンセルした場合も「名無し」としてチェックイン
        setParticipantName('');
        handleCheckIn();
    };

    const handleEditName = () => {
        setEditingName(data?.name || '');
        setEditNameModalOpen(true);
    };

    const handleUpdateName = async () => {
        if (!id || !editingName.trim()) {
            alert('名前を入力してください');
            return;
        }

        try {
            console.log('名前更新呼び出し:', { id, name: editingName });
            const updateResponse = await fetch(`/api/updateAlignment?id=${id}&name=${encodeURIComponent(editingName)}`);
            console.log('名前更新レスポンス:', updateResponse.status, updateResponse.ok);

            if (updateResponse.ok) {
                const updateData = await updateResponse.json();
                console.log('名前更新成功:', updateData);

                // データを更新
                setData(prev => prev ? { ...prev, name: editingName } : null);
                setEditNameModalOpen(false);
                // アラートを削除（静かに更新）
            } else {
                const errorData = await updateResponse.json();
                console.error('名前更新失敗:', errorData);
                alert('名前の更新に失敗しました');
            }
        } catch (error) {
            console.error('名前更新エラー:', error);
            alert('名前更新中にエラーが発生しました');
        }
    };

    // QRコードのURLを生成
    useEffect(() => {
        if (id && token) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
            const url = `${baseUrl}/check-id?id=${id}&token=${token}`;
            setQrUrl(url);
            console.log('QR Code URL:', url);
        }
    }, [id, token]);

    const generateQRCode = () => {
        if (!id || !token) {
            alert('IDまたはトークンが不足しています');
            return;
        }
        setQrModalOpen(true);
    };

    const QRCode = () => {
        if (!qrUrl) return null;

        return <Canvas
            text={qrUrl}
            options={{
                errorCorrectionLevel: 'M',
                margin: 3,
                scale: 4,
                width: 200,
                color: {
                    dark: '#010599FF',
                    light: '#FFBF60FF',
                },
            }}
        />;
    };

    const handleCancel = async () => {
        if (!id || !token) return;

        setCancelling(true);
        try {
            const response = await fetch('/api/cancelReception', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, token }),
            });

            if (response.ok) {
                // キャンセル成功
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('currentId');
                    localStorage.removeItem('currentToken');
                    localStorage.removeItem('checkInStatus');
                }
                router.push('/');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'キャンセルに失敗しました');
            }
        } catch {
            setError('キャンセル中にエラーが発生しました');
        } finally {
            setCancelling(false);
            setCancelModalOpen(false);
        }
    };

    if (loading) {
        return (
            <Container size="sm" py="xl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stack align="center" gap="lg">
                    <ThemeIcon size={60} radius="xl" color="blue" variant="light">
                        <Loader size={30} />
                    </ThemeIcon>
                    <Text size="lg" c="dimmed">データを読み込み中...</Text>
                </Stack>
            </Container>
        );
    }

    if (error) {
        return (
            <Container size="sm" py="xl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stack align="center" gap="lg">
                    <ThemeIcon size={60} radius="xl" color="red" variant="light">
                        <IconAlertCircle size={30} />
                    </ThemeIcon>
                    <Stack align="center" gap="md">
                        {error.includes('一度目の受付が終わらないと二度目の受付はできません') ? (
                            <>
                                <Text c="red" size="lg" ta="center" fw={600}>
                                    一度目の受付が終わらないと二度目の受付はできません\nURLを忘れた場合はI2受付まで。
                                </Text>
                                <Card shadow="md" p="lg" radius="lg" withBorder style={{ maxWidth: 400 }}>
                                    <Stack gap="md">
                                        <Text c="dimmed" size="sm" ta="center">
                                            既存のIDからアクセスしてください
                                        </Text>
                                        <Button
                                            variant="light"
                                            color="blue"
                                            onClick={() => {
                                                if (typeof window !== 'undefined') {
                                                    const existingToken = localStorage.getItem('currentToken');
                                                    const url = `check-id?id=${error.split('既存のID: ')[1]}&token=${existingToken}`;
                                                    if (url) {
                                                        window.location.href = url;
                                                    }
                                                }
                                            }}
                                            style={{ wordBreak: 'break-all' }}
                                        >
                                            ID: {error.split('既存のID: ')[1]}
                                        </Button>
                                    </Stack>
                                </Card>
                            </>
                        ) : (
                            <Text c="red" size="lg" ta="center" fw={600}>
                                {error}
                            </Text>
                        )}
                    </Stack>
                </Stack>
            </Container>
        );
    }

    return (
        <Container size="sm" py="xl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
            <Stack align="center" gap="xl" w="100%">
                {/* ヘッダー */}
                <Stack align="center" gap="md">
                    <ThemeIcon size={80} radius="xl" color="green" variant="gradient" gradient={{ from: 'green', to: 'teal' }}>
                        <IconCalendarEvent size={40} />
                    </ThemeIcon>
                    <Title order={1} ta="center" c="dark" size="2.5rem">
                        予約確認
                    </Title>
                    <Stack align="center" gap="md">
                        <Paper p="md" radius="md" withBorder style={{ background: '#f8f9fa' }}>
                            <Text ta="center" c="dark" size="lg" fw={700}>
                                予約ID: {id}
                            </Text>
                        </Paper>
                        <Button
                            size="lg"
                            color="blue"
                            variant="light"
                            leftSection={<IconQrcode size={20} />}
                            onClick={generateQRCode}
                            radius="md"
                            style={{ fontWeight: 600 }}
                        >
                            QRコードを表示
                        </Button>
                    </Stack>
                </Stack>

                {/* チェックイン状態の表示 */}
                {checkInStatus === 'success' && (
                    <Alert
                        icon={<IconCheck size="1rem" />}
                        title="チェックイン完了"
                        color="green"
                        variant="light"
                        radius="lg"
                        style={{ width: '100%', maxWidth: 500 }}
                    >
                        チェックインが正常に完了しました
                    </Alert>
                )}

                {checkInStatus === 'error' && (
                    <Alert
                        icon={<IconAlertCircle size="1rem" />}
                        title="チェックインエラー"
                        color="red"
                        variant="light"
                        radius="lg"
                        style={{ width: '100%', maxWidth: 500 }}
                    >
                        チェックインの処理中にエラーが発生しました
                    </Alert>
                )}

                {/* 予約詳細 */}
                {data ? (
                    <Card shadow="xl" p="xl" radius="lg" withBorder style={{ width: '100%', maxWidth: 500 }}>
                        <Stack gap="lg">
                            <Title order={3} c="dark" ta="center">
                                予約詳細
                            </Title>

                            <Grid gutter="md">
                                <Grid.Col span={12}>
                                    <Paper p="md" radius="md" withBorder style={{ background: '#f8f9fa' }}>
                                        <Group gap="md">
                                            <ThemeIcon size={40} radius="xl" color="blue" variant="light">
                                                <IconClock size={20} />
                                            </ThemeIcon>
                                            <Stack gap={2}>
                                                <Text size="sm" c="dimmed" fw={500}>開始時間</Text>
                                                <Text size="lg" fw={700} c="dark">{data.start}</Text>
                                            </Stack>
                                        </Group>
                                    </Paper>
                                </Grid.Col>

                                <Grid.Col span={12}>
                                    <Paper p="md" radius="md" withBorder style={{ background: '#f8f9fa' }}>
                                        <Group gap="md">
                                            <ThemeIcon size={40} radius="xl" color="green" variant="light">
                                                <IconUsers size={20} />
                                            </ThemeIcon>
                                            <Stack gap={2}>
                                                <Text size="sm" c="dimmed" fw={500}>参加人数</Text>
                                                <Text size="lg" fw={700} c="dark">{data.count}名</Text>
                                            </Stack>
                                        </Group>
                                    </Paper>
                                </Grid.Col>

                                <Grid.Col span={12}>
                                    <Paper p="md" radius="md" withBorder style={{ background: '#f8f9fa' }}>
                                        <Group gap="md" justify="space-between">
                                            <Group gap="md">
                                                <ThemeIcon size={40} radius="xl" color="grape" variant="light">
                                                    <IconMapPin size={20} />
                                                </ThemeIcon>
                                                <Stack gap={2}>
                                                    <Text size="sm" c="dimmed" fw={500}>参加者名</Text>
                                                    <Text size="lg" fw={700} c="dark">{data.name}</Text>
                                                </Stack>
                                            </Group>
                                            {data.checker && (
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    color="blue"
                                                    onClick={handleEditName}
                                                    style={{ fontSize: '0.8rem' }}
                                                >
                                                    編集
                                                </Button>
                                            )}
                                        </Group>
                                    </Paper>
                                </Grid.Col>

                                <Grid.Col span={12}>
                                    <Paper p="md" radius="md" withBorder style={{ background: '#f8f9fa' }}>
                                        <Group gap="md" justify="space-between">
                                            <Group gap="md">
                                                <ThemeIcon size={40} radius="xl" color={data.checker ? "green" : "orange"} variant="light">
                                                    <IconCheck size={20} />
                                                </ThemeIcon>
                                                <Stack gap={2}>
                                                    <Text size="sm" c="dimmed" fw={500}>スマホ連携状況</Text>
                                                    <Text size="lg" fw={700} c="dark">
                                                        {data.checker ? '済み' : '未'}
                                                    </Text>
                                                </Stack>
                                            </Group>
                                            <Badge
                                                size="lg"
                                                color={data.checker ? "green" : "orange"}
                                                variant="light"
                                                radius="md"
                                            >
                                                {data.checker ? '完了' : '待機中'}
                                            </Badge>
                                        </Group>
                                    </Paper>
                                </Grid.Col>
                            </Grid>

                            {/* キャンセルボタン */}
                            <Button
                                color="red"
                                variant="light"
                                leftSection={<IconTrash size={18} />}
                                onClick={() => setCancelModalOpen(true)}
                                size="lg"
                                style={{ fontWeight: 600 }}
                            >
                                予約をキャンセル
                            </Button>
                        </Stack>
                    </Card>
                ) : (
                    <Card shadow="md" p="xl" radius="lg" withBorder style={{ width: '100%', maxWidth: 500 }}>
                        <Stack align="center" gap="md">
                            <ThemeIcon size={60} radius="xl" color="red" variant="light">
                                <IconX size={30} />
                            </ThemeIcon>
                            <Text size="lg" c="red" ta="center" fw={600}>
                                データが見つかりませんでした
                            </Text>
                        </Stack>
                    </Card>
                )}
            </Stack>

            {/* キャンセル確認モーダル */}
            <Modal
                opened={cancelModalOpen}
                onClose={() => setCancelModalOpen(false)}
                title="予約キャンセルの確認"
                centered
                radius="lg"
            >
                <Stack gap="lg">
                    <Text size="lg" ta="center">
                        ID: <Text span fw={700} c="red">{id}</Text> の予約をキャンセルしますか？
                    </Text>
                    <Alert
                        icon={<IconAlertCircle size="1rem" />}
                        title="注意"
                        color="orange"
                        variant="light"
                    >
                        この操作は取り消せません。キャンセル後は再度予約が必要になります。
                    </Alert>
                    <Group justify="flex-end" gap="md">
                        <Button
                            variant="outline"
                            onClick={() => setCancelModalOpen(false)}
                        >
                            キャンセルしない
                        </Button>
                        <Button
                            color="red"
                            onClick={handleCancel}
                            loading={cancelling}
                            leftSection={<IconTrash size={16} />}
                        >
                            予約をキャンセル
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* 名前入力モーダル */}
            <Modal
                opened={nameModalOpen}
                onClose={() => setNameModalOpen(false)}
                title="チェックイン"
                centered
                size="md"
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        ゲームに参加する代表者の名前を入力してください
                    </Text>
                    <TextInput
                        label="参加者名"
                        placeholder="例: 田中太郎"
                        value={participantName}
                        onChange={(event) => setParticipantName(event.currentTarget.value)}
                        required
                        size="lg"
                    />
                    <Group justify="flex-end" gap="md">
                        <Button
                            variant="outline"
                            onClick={handleNameCancel}
                        >
                            名無しでチェックイン
                        </Button>
                        <Button
                            color="blue"
                            onClick={handleCheckIn}
                            leftSection={<IconCheck size={16} />}
                        >
                            チェックイン
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* 名前編集モーダル */}
            <Modal
                opened={editNameModalOpen}
                onClose={() => setEditNameModalOpen(false)}
                title="参加者名を編集"
                centered
                size="md"
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        参加者名を変更できます
                    </Text>
                    <TextInput
                        label="参加者名"
                        placeholder="例: 田中太郎"
                        value={editingName}
                        onChange={(event) => setEditingName(event.currentTarget.value)}
                        required
                        size="lg"
                    />
                    <Group justify="flex-end" gap="md">
                        <Button
                            variant="outline"
                            onClick={() => setEditNameModalOpen(false)}
                        >
                            キャンセル
                        </Button>
                        <Button
                            color="blue"
                            onClick={handleUpdateName}
                            disabled={!editingName.trim()}
                            leftSection={<IconCheck size={16} />}
                        >
                            更新
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* QRコード表示モーダル */}
            <Modal
                opened={qrModalOpen}
                onClose={() => setQrModalOpen(false)}
                title="QRコード"
                centered
                size="sm"
            >
                <Stack align="center" gap="lg">
                    <Text size="sm" c="dimmed" ta="center">
                        このQRコードをスキャンしてチェックイン
                    </Text>
                    {qrUrl && (
                        <Paper p="md" radius="md" withBorder style={{ background: '#f8f9fa' }}>
                            <QRCode />
                        </Paper>
                    )}
                    <Text size="xs" c="dimmed" ta="center" style={{ fontFamily: 'monospace' }}>
                        ID: {id}
                    </Text>
                </Stack>
            </Modal>
        </Container>
    );
};

export default CheckIdPage;