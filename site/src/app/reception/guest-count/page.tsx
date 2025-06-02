'use client';

import React, { useState } from "react";
import { Button, Group, Text, Space } from '@mantine/core';
import { useRouter } from 'next/navigation';
import './ReceptionDisplayPage.css'; // CSSファイルをインポート

const ReceptionGuestCountPage = () => {
    const [selectedButton, setSelectedButton] = useState<number | null>(null);
    const router = useRouter();

    const handleButtonClick = (buttonNumber: number) => {
        setSelectedButton(buttonNumber);
    };

    const handleConfirmClick = () => {
        if (selectedButton !== null) {
            router.push(`/reception/result?count=${selectedButton}`); // 選択された人数に応じたページに遷移
        } else {
            alert('人数を選択してください！'); // 未選択の場合は警告を表示
        }
    };

    return (
        <div className="guest-count-container">
            <Text size="xl" className="row-text">人数を選んでね</Text>
            <Group grow>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                    <Button
                        key={number}
                        color="teal"
                        className={`square-button ${selectedButton === number ? 'selected' : ''}`}
                        onClick={() => handleButtonClick(number)}
                    >
                        {number}
                    </Button>
                ))}
            </Group>
            <Space h="xl" />
            <Button
                className="square-button"
                w={500}
                color="pink"
                onClick={handleConfirmClick} // 決定ボタンのクリックイベント
            >
                決定
            </Button>
        </div>
    );
};

export default ReceptionGuestCountPage;