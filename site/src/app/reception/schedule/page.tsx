'use client';

import React, { useState, useEffect } from "react";
import { Button, Group, Select, Text, Alert } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import './ReceptionSchedulePage.css'; // CSSファイルをインポート

interface ReceptionData {
    id: number;
    start: string;
    count: number;
    checker?: boolean;
}

const ReceptionSchedulePage = () => {
    const router = useRouter();
    const [startTime, setStartTime] = useState<string | null>(null);
    const [endTime, setEndTime] = useState<string | null>(null);
    const [bookedTimes, setBookedTimes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const timeOptions = [
        "13:00", "13:10", "13:20", "13:30", "13:40", "13:50",
        "14:00", "14:10", "14:20", "14:30", "14:40", "14:50",
        "15:00", "15:10", "15:20", "15:30", "15:40", "15:50"
    ];

    // 既存の予約を取得
    useEffect(() => {
        const fetchBookedTimes = async () => {
            try {
                const response = await fetch('/api/getReceptionList');
                if (response.ok) {
                    const data: ReceptionData[] = await response.json();
                    const booked = data.map((item: ReceptionData) => item.start);
                    setBookedTimes(booked);
                }
            } catch (error) {
                console.error('予約情報の取得に失敗しました:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookedTimes();
    }, []);

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

    // 利用可能な時間オプションをフィルタリング
    const availableTimeOptions = timeOptions.map(time => ({
        value: time,
        label: time,
        disabled: bookedTimes.includes(time)
    }));

    if (loading) {
        return (
            <div className="schedule-container">
                <Text size="xl" w={700} className="schedule-title">
                    読み込み中...
                </Text>
            </div>
        );
    }

    return (
        <div className="schedule-container">
            <Text size="xl" w={700} className="schedule-title">
                スケジュールを選択してください
            </Text>

            {bookedTimes.length > 0 && !startTime && (
                <Alert
                    icon={<IconAlertCircle size="1rem" />}
                    title="予約済み時間帯"
                    color="yellow"
                    style={{ marginBottom: '20px', maxWidth: '500px' }}
                >
                    予約済みの時間帯は選択できません
                </Alert>
            )}
            {bookedTimes.length > 0 && startTime && (
                <Alert
                    icon={<IconCheck size="1rem" />}
                    title="この時間帯は選択できます"
                    color="green"
                    style={{ marginBottom: '20px', maxWidth: '500px' }}
                >
                    この時間帯は選択できます
                </Alert>
            )}

            <Group className="schedule-group">
                <Select
                    label="開始時刻"
                    placeholder="選択してください"
                    data={availableTimeOptions}
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
                <Button
                    color="blue"
                    size="lg"
                    onClick={handleConfirm}
                    className="schedule-button"
                    disabled={!startTime || bookedTimes.includes(startTime || '')}
                >
                    確定
                </Button>
            </Group>
        </div>
    );
};

export default ReceptionSchedulePage;