'use client';
import React, { useState } from "react";
import { Button, Group, Text, Space } from '@mantine/core';
import { useRouter, useSearchParams } from 'next/navigation';
import './ReceptionDisplayPage.css'; // CSSファイルをインポート
export const dynamic = 'force-dynamic';
export const runtime = 'edge'; // もしくは 'experimental-edge' でもOK
const ReceptionGuestCountPage = () => {
    const [selectedButton, setSelectedButton] = useState<number | null>(null);
    const [isNavigating, setIsNavigating] = useState(false); // 遷移中の状態を管理
    const router = useRouter();
    const searchParams = useSearchParams();
    const start = searchParams.get('start'); // startパラメータを取得
    const handleButtonClick = (buttonNumber: number) => {
        setSelectedButton(buttonNumber);
    };

    const handleConfirmClick = () => {
        if (isNavigating) return; // 連続遷移を防止
        if (selectedButton !== null) {
            setIsNavigating(true); // 遷移中に設定
            router.push(`/reception/result?count=${selectedButton}&start=${start}`); // 選択された人数に応じたページに遷移
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
                disabled={isNavigating} // 遷移中はボタンを無効化
            >
                決定
            </Button>
        </div>
    );
};

export default ReceptionGuestCountPage;