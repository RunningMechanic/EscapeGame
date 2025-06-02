'use client';

import React from "react";
import { useSearchParams } from 'next/navigation';
import { Text, Box } from '@mantine/core';

const ResultPage = () => {
    const searchParams = useSearchParams();
    const count = searchParams.get('count'); // URLパラメータから人数を取得

    return (
        <Box className="result-container">
            <Text size="xl" w={700}>
                選択された人数: {count}
            </Text>
        </Box>
    );
};

export default ResultPage;