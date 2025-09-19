'use client';

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { Text, Box, Loader, Center, Button, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useQRCode } from 'next-qrcode';

const ResultPage = () => {
    const { Canvas } = useQRCode();
    const router = useRouter();
    const searchParams = useSearchParams();
    const count = searchParams.get('count'); // URLパラメータから人数を取得
    const start = searchParams.get('start');
    const hasFetched = useRef(false); // API呼び出しを制御するフラグ
    const [id, setId] = useState<string | null>(null); // APIから取得したID
    const [token, setToken] = useState<string | null>(null); // APIから取得したトークン
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [qrUrl, setQrUrl] = useState<string | null>(null); // QRコードのURL
    const [isQRScanned, setIsQRScanned] = useState(false); // QRコードがスキャンされたかどうか


    // QRコードのURLを生成（クライアントサイドでのみ実行）
    useEffect(() => {
        if (id && token) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
            const url = `${baseUrl}/check-id?id=${id}&token=${token}`;
            setQrUrl(url);
            console.log('QR Code URL:', url); // デバッグ用
        }
    }, [id, token]);

    // QRコードがスキャンされたかどうかを監視（ポーリング）
    useEffect(() => {
        if (!id || !token) return;

        const checkScanStatus = async () => {
            try {
                console.log('スキャン状態チェック開始:', { id, token });
                const response = await fetch(`/api/checkid?id=${id}&token=${token}`);
                console.log('APIレスポンス:', response.status, response.ok);

                if (response.ok) {
                    const data = await response.json();
                    console.log('スキャン状態チェック:', {
                        id,
                        alignment: data.alignment,
                        checker: data.checker,
                        isQRScanned,
                        fullData: data
                    });

                    if (data.checker === true && !isQRScanned) {
                        // QRコードがスキャンされてチェックインが完了した場合
                        console.log('QRコードスキャン検出！entryページに遷移します');
                        setIsQRScanned(true);
                        // 少し待ってからentryページにリダイレクト
                        setTimeout(() => {
                            router.push('/entry');
                        }, 2000);
                    }
                } else {
                    const errorText = await response.text();
                    console.error('スキャン状態確認のAPIエラー:', response.status, errorText);
                }
            } catch (error) {
                console.error('スキャン状態の確認エラー:', error);
            }
        };

        // 2秒ごとにスキャン状態をチェック
        const interval = setInterval(checkScanStatus, 2000);

        // 初回チェック
        checkScanStatus();

        return () => clearInterval(interval);
    }, [id, token, isQRScanned, router]);

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/createUrl?count=${count}&start=${start}`, {
                    method: 'GET',
                });
                const result = await response.json();
                console.log('APIレスポンス:', result);

                if (!response.ok) {
                    if (response.status === 409) {
                        // 重複エラーの場合
                        setError(result.error || 'この時間帯は既に予約されています');
                    } else {
                        setError(result.error || 'API呼び出しに失敗しました');
                    }
                    return;
                }

                // 新しいAPIレスポンス形式に対応
                let data;
                if (result.success && result.data) {
                    data = result.data;
                } else if (result.id) {
                    // 後方互換性のため、直接データが返される場合も対応
                    data = result;
                } else {
                    console.error('Unexpected API response format:', result);
                    setError('予約データの形式が正しくありません');
                    return;
                }

                setId(data.id); // APIから取得したIDを保存
                setToken(data.token); // APIから取得したトークンを保存

                console.log('ID:', data.id, 'Token:', data.token); // デバッグ用
            } catch (error) {
                console.error('APIエラー:', error);
                setError('ネットワークエラーが発生しました');
            } finally {
                setLoading(false);
            }
        };

        if (count && start && !hasFetched.current) {
            hasFetched.current = true; // フラグを更新して二回目の呼び出しを防止
            fetchData(); // APIを呼び出す
        }
    }, [count, start]);

    const handleRetry = () => {
        setError(null);
        setLoading(true);
        hasFetched.current = false;
        router.push(`/reception/schedule`);
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
            <Center style={{ height: '100vh', flexDirection: 'column', gap: '20px' }}>
                <Alert
                    icon={<IconAlertCircle size="1rem" />}
                    title="予約エラー"
                    color="red"
                    style={{ maxWidth: '500px' }}
                >
                    {error}
                </Alert>
                <Button onClick={handleRetry} color="blue">
                    別の時間を選択する
                </Button>
            </Center>
        );
    }

    // QRコードがスキャンされた場合の表示
    if (isQRScanned) {
        return (
            <Center style={{ height: '100vh', flexDirection: 'column', gap: '20px' }}>
                <Text size="xl" c="green" fw={600}>
                    QRコードがスキャンされました！
                </Text>
                <Text size="lg" c="dimmed">
                    エントリーページに戻ります...
                </Text>
            </Center>
        );
    }

    return (
        <Box className="result-container" style={{ textAlign: 'center', padding: '20px' }}>
            <Text size="xl" w={700} mb="lg">
                選択された人数: {count}
            </Text>
            {id && token && qrUrl ? (
                <>
                    <Text size="lg" w={500} mb="md">
                        生成されたID: {id}
                    </Text>
                    <QRCode />
                    <Text size="md" c="dimmed" mt="md">
                        スマートフォンでQRコードをスキャンしてください
                    </Text>
                </>
            ) : (
                <Text size="lg" c="red">
                    QRコードの生成に失敗しました。
                </Text>
            )}
        </Box>
    );
};

export default ResultPage;