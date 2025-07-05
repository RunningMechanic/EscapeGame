'use client';

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { Text, Box, Loader, Center, Button, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useQRCode } from 'next-qrcode';

const ResultPage = () => {
    const { Canvas } = useQRCode();
    const router = useRouter();
    const QRCode = () => {
        return <Canvas
            text={`${process.env.NEXT_PUBLIC_QR_URL}/check-id?id=${id}`}
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
    const searchParams = useSearchParams();
    const count = searchParams.get('count'); // URLパラメータから人数を取得
    const start = searchParams.get('start');
    const hasFetched = useRef(false); // API呼び出しを制御するフラグ
    const [id, setId] = useState<string | null>(null); // APIから取得したID
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/createUrl?count=${count}&start=${start}`, {
                    method: 'GET',
                });
                const data = await response.json();
                console.log('APIレスポンス:', data);

                if (!response.ok) {
                    if (response.status === 409) {
                        // 重複エラーの場合
                        setError(data.error || 'この時間帯は既に予約されています');
                    } else {
                        setError(data.error || 'API呼び出しに失敗しました');
                    }
                    return;
                }

                setId(data.id); // APIから取得したIDを保存
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

    return (
        <Box className="result-container" style={{ textAlign: 'center', padding: '20px' }}>
            <Text size="xl" w={700} mb="lg">
                選択された人数: {count}
            </Text>
            {id ? (
                <>
                    <Text size="lg" w={500} mb="md">
                        生成されたID: {id}
                    </Text>
                    <QRCode />
                </>
            ) : (
                <Text size="lg" color="red">
                    QRコードの生成に失敗しました。
                </Text>
            )}
        </Box>
    );
};

export default ResultPage;