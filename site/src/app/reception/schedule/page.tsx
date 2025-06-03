'use client';

import React, { useState } from "react";
import { Button, Group, Select, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';
import './ReceptionSchedulePage.css'; // CSSファイルをインポート

const ReceptionSchedulePage = () => {
    const router = useRouter();
    const [startTime, setStartTime] = useState<string | null>(null);
    const [endTime, setEndTime] = useState<string | null>(null);

    const timeOptions = [
        "13:00", "13:10", "13:20", "13:30", "13:40", "13:50",
        "14:00", "14:10", "14:20", "14:30", "14:40", "14:50",
        "15:00", "15:10", "15:20", "15:30", "15:40", "15:50"
    ];

    const handleStartTimeChange = (value: string | null) => {
        setStartTime(value);

        if (value) {
            const [hours, minutes] = value.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + 10; // 10分後を計算
            const endHours = Math.floor(totalMinutes / 60) % 24; // 時間を24時間制に調整
            const endMinutes = totalMinutes % 60;
            setEndTime(`${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`);
        } else {
            setEndTime(null);
        }
    };

    const handleConfirm = () => {
        if (!startTime || !endTime) {
            alert('開始時刻を選択してください！');
            return;
        }
        router.push(`/reception/guest-count?start=${startTime}`);
    };

    return (
        <div className="schedule-container">
            <Text size="xl" w={700} className="schedule-title">
                スケジュールを選択してください
            </Text>
            <Group className="schedule-group">
                <Select
                    label="開始時刻"
                    placeholder="選択してください"
                    data={timeOptions}
                    value={startTime}
                    onChange={handleStartTimeChange}
                    className="schedule-select"
                />
                <Select
                    label="終了時刻"
                    placeholder="自動設定されます"
                    data={timeOptions}
                    value={endTime}
                    disabled
                    className="schedule-select"
                />
            </Group>
            <Group mt="lg">
                <Button color="blue" size="lg" onClick={handleConfirm} className="schedule-button">
                    確定
                </Button>
            </Group>
        </div>
    );
};

export default ReceptionSchedulePage;