'use client';

import React, { useEffect, useRef } from "react";
import { useSearchParams } from 'next/navigation';
import { Text, Box } from '@mantine/core';

const ResultPage = () => {
    const searchParams = useSearchParams();
    const count = searchParams.get('count'); // URLパラメータから人数を取得
    const hasFetched = useRef(false); // API呼び出しを制御するフラグ

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/createUrl?count=${count}`, {
                    method: 'GET',
                });
                if (!response.ok) {
                    throw new Error('API呼び出しに失敗しました');
                }
                const data = await response.json();
                console.log('APIレスポンス:', data);
            } catch (error) {
                console.error('APIエラー:', error);
            }
        };

        if (count && !hasFetched.current) {
            hasFetched.current = true; // フラグを更新して二回目の呼び出しを防止
            fetchData(); // APIを呼び出す
        }
    }, [count]);

    return (
        <Box className="result-container">
            <Text size="xl" w={700}>
                選択された人数: {count}
            </Text>
        </Box>
    );
};

export default ResultPage;