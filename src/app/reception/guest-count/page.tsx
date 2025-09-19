'use client';
import React, { useEffect, useMemo, useState } from "react";
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
    const start = searchParams.get('start'); // ISO形式の開始時刻
    const [remaining, setRemaining] = useState<number>(0);
    const maxGroupSize = useMemo(() => Number(process.env.NEXT_PUBLIC_MAX_GROUP_SIZE || 8), []);
    useEffect(() => {
        const load = async () => {
            if (!start) return;
            try {
                const res = await fetch(`/api/checkRoomAvailability?time=${encodeURIComponent(start)}`);
                const data = await res.json();
                setRemaining(Number(data.remaining || 0));
            } catch (e) {
                setRemaining(0);
            }
        };
        load();
    }, [start]);
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
                {Array.from({ length: Math.min(remaining, maxGroupSize) }, (_, i) => i + 1).map((number) => (
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