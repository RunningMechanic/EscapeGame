'use client';

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { Text, Box, Loader, Center, Alert, Container, Button, Modal, Group } from '@mantine/core';
import { IconCheck, IconAlertCircle, IconTrash } from '@tabler/icons-react';
import { ReceptionData } from "../receptionDataInterface";

const CheckIdPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id'); // URLパラメータからidを取得
    const token = searchParams.get('token'); // URLパラメータからtokenを取得
    const [data, setData] = useState<ReceptionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checkInStatus, setCheckInStatus] = useState<'pending' | 'success' | 'error'>('pending');
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);

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
                if (existingId && existingId !== id) {
                    try {
                        const existingResponse = await fetch(`/api/checkid?id=${existingId}&token=${existingToken}`);
                        if (existingResponse.ok) {
                            const existingData = await existingResponse.json();
                            // 既存のIDのcheckerがfalseの場合（来場未済）
                            if (existingData.checker === false) {
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
                setData(result);

                // 次にチェックイン状態を更新
                const checkInResponse = await fetch(`/api/updateAlignment?id=${id}`);
                if (checkInResponse.ok) {
                    setCheckInStatus('success');
                    // localStorageにIDとトークンを保存（クライアントサイドでのみ実行）
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('currentId', id || '');
                        localStorage.setItem('currentToken', token || '');
                        localStorage.setItem('checkInStatus', 'success');
                    }
                } else {
                    setCheckInStatus('error');
                    // エラーの場合もIDとトークンを保存（クライアントサイドでのみ実行）
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('currentId', id || '');
                        localStorage.setItem('currentToken', token || '');
                        localStorage.setItem('checkInStatus', 'error');
                    }
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
            <Center style={{ height: '100vh' }}>
                <Loader size="lg" />
            </Center>
        );
    }

    if (error) {
        return (
            <Center style={{ height: '100vh', padding: '20px' }}>
                <Box style={{ textAlign: 'center' }}>
                    {error.includes('一度目の受付が終わらないと二度目の受付はできません') ? (
                        <>
                            <Text c="red" size="md" ta="center" mb="sm">
                                一度目の受付が終わらないと二度目の受付はできません。
                            </Text>
                            <Text
                                c="blue"
                                size="md"
                                ta="center"
                                style={{
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    wordBreak: 'break-all'
                                }}
                                onClick={() => {
                                    if (typeof window !== 'undefined') {
                                        const existingToken = localStorage.getItem('currentToken');
                                        const url = `check-id?id=${error.split('既存のID: ')[1]}&token=${existingToken}`;
                                        if (url) {
                                            window.location.href = url;
                                        }
                                    }
                                }}
                            >
                                既存のID: {error.split('既存のID: ')[1]}
                            </Text>
                        </>
                    ) : (
                        <Text c="red" size="md" ta="center">
                            {error}
                        </Text>
                    )}
                </Box>
            </Center>
        );
    }

    return (
        <Container size="sm" py="xl">
            <Box className="checkid-container" style={{ textAlign: 'center' }}>
                <Text
                    size="lg"
                    fw={600}
                    mb="lg"
                    style={{ wordBreak: 'break-all' }}
                    visibleFrom="sm"
                >
                    ID: {id} のデータ
                </Text>
                <Text
                    size="md"
                    fw={600}
                    mb="lg"
                    style={{ wordBreak: 'break-all' }}
                    hiddenFrom="sm"
                >
                    ID: {id} のデータ
                </Text>

                {/* チェックイン状態の表示 */}
                {checkInStatus === 'success' && (
                    <Alert
                        icon={<IconCheck size="1rem" />}
                        title="チェックイン完了"
                        color="green"
                        mb="lg"
                        style={{ maxWidth: '100%' }}
                    >
                        チェックインが正常に完了しました
                    </Alert>
                )}

                {checkInStatus === 'error' && (
                    <Alert
                        icon={<IconAlertCircle size="1rem" />}
                        title="チェックインエラー"
                        color="red"
                        mb="lg"
                        style={{ maxWidth: '100%' }}
                    >
                        チェックインの処理中にエラーが発生しました
                    </Alert>
                )}

                {data ? (
                    <Box style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <Text size="md" fw={500} visibleFrom="sm">
                            開始時間: {data.start}
                        </Text>
                        <Text size="sm" fw={500} hiddenFrom="sm">
                            開始時間: {data.start}
                        </Text>
                        <Text size="md" fw={500} visibleFrom="sm">
                            人数: {data.count}
                        </Text>
                        <Text size="sm" fw={500} hiddenFrom="sm">
                            人数: {data.count}
                        </Text>
                        <Text
                            size="md"
                            fw={500}
                            c={data.checker ? "green" : "red"}
                            visibleFrom="sm"
                        >
                            来場: {data.checker ? '済み' : '未'}
                        </Text>
                        <Text
                            size="sm"
                            fw={500}
                            c={data.checker ? "green" : "red"}
                            hiddenFrom="sm"
                        >
                            来場: {data.checker ? '済み' : '未'}
                        </Text>

                        {/* キャンセルボタン */}
                        <Button
                            color="red"
                            leftSection={<IconTrash size="1rem" />}
                            onClick={() => setCancelModalOpen(true)}
                            mt="lg"
                        >
                            予約をキャンセル
                        </Button>
                    </Box>
                ) : (
                    <>
                        <Text size="md" c="red" ta="center" visibleFrom="sm">
                            データが見つかりませんでした。
                        </Text>
                        <Text size="sm" c="red" ta="center" hiddenFrom="sm">
                            データが見つかりませんでした。
                        </Text>
                    </>
                )}
            </Box>

            {/* キャンセル確認モーダル */}
            <Modal
                opened={cancelModalOpen}
                onClose={() => setCancelModalOpen(false)}
                title="予約キャンセルの確認"
                centered
            >
                <Text mb="lg">
                    ID: {id} の予約をキャンセルしますか？
                    <br />
                    この操作は取り消せません。
                </Text>
                <Group justify="flex-end">
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
                    >
                        予約をキャンセル
                    </Button>
                </Group>
            </Modal>
        </Container>
    );
};

export default CheckIdPage;