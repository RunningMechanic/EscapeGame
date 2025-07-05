'use client';

import React, { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import { Text, Box, Loader, Center } from '@mantine/core';
import { ReceptionData } from "../receptionDataInterface";

const CheckIdPage = () => {
    const searchParams = useSearchParams();
    const id = searchParams.get('id'); // URLパラメータからidを取得
    const [data, setData] = useState<ReceptionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/checkid?id=${id}`);
                if (!response.ok) {
                    throw new Error('データの取得に失敗しました');
                }
                const result = await response.json();
                setData(result);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('予期しないエラーが発生しました');
                }
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    if (loading) {
        return (
            <Center style={{ height: '100vh' }}>
                <Loader size="lg" />
            </Center>
        );
    }

    if (error) {
        return (
            <Center style={{ height: '100vh' }}>
                <Text color="red">{error}</Text>
            </Center>
        );
    }

    return (
        <Box className="checkid-container" style={{ textAlign: 'center', padding: '20px' }}>
            <Text size="xl" w={700} mb="lg">
                ID: {id} のデータ
            </Text>
            {data ? (
                <>
                    <Text size="lg" mb="md">開始時間: {data.start}</Text>
                    <Text size="lg" mb="md">人数: {data.count}</Text>
                    <Text size="lg" mb="md">チェック状態: {data.check ? '済み' : '未チェック'}</Text>
                </>
            ) : (
                <Text size="lg" color="red">
                    データが見つかりませんでした。
                </Text>
            )}
        </Box>
    );
};

export default CheckIdPage;