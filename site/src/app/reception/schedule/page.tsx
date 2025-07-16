'use client';

import React, { useState, useEffect } from "react";
import { Button, Group, Select, Text, Alert } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import './ReceptionSchedulePage.css';

interface ReceptionData {
    id: number;
    time: string;
    room: number;
}

// Mantine v8: カスタムオプションコンポーネント

const ReceptionSchedulePage = () => {
    const router = useRouter();
    const [startTime, setStartTime] = useState<string | null>(null);
    const [endTime, setEndTime] = useState<string | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<string>('1');
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [receptions, setReceptions] = useState<ReceptionData[]>([]);
    const [loading, setLoading] = useState(true);

    const timeOptions = [
        "13:00", "13:10", "13:20", "13:30", "13:40", "13:50",
        "14:00", "14:10", "14:20", "14:30", "14:40", "14:50",
        "15:00", "15:10", "15:20", "15:30", "15:40", "15:50"
    ];

    // 予約データ取得
    useEffect(() => {
        fetch('/api/getReceptionList')
            .then(res => res.json())
            .then(result => {
                if (result.success && Array.isArray(result.data)) {
                    setReceptions(result.data);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (startTime && selectedRoom) {
            const today = new Date();
            const jst = new Date(today.getTime() + 9 * 60 * 60 * 1000);
            const yyyy = jst.getFullYear();
            const mm = String(jst.getMonth() + 1).padStart(2, '0');
            const dd = String(jst.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}T${startTime}:00`;
            fetch(`/api/checkRoomAvailability?time=${encodeURIComponent(dateStr)}&room=${selectedRoom}`)
                .then(res => res.json())
                .then(data => setIsAvailable(data.available));
        } else {
            setIsAvailable(null);
        }
    }, [startTime, selectedRoom]);

    const handleStartTimeChange = (value: string | null) => {
        setStartTime(value);
        if (value) {
            const [hours, minutes] = value.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + 10;
            const endHours = Math.floor(totalMinutes / 60) % 24;
            const endMinutes = totalMinutes % 60;
            setEndTime(`${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`);
        } else {
            setEndTime(null);
        }
    };

    const handleConfirm = () => {
        if (!startTime || !endTime || !selectedRoom) {
            alert('開始時刻と部屋を選択してください！');
            return;
        }
        router.push(`/reception/guest-count?start=${startTime}&room=${selectedRoom}`);
    };

    // 予約済みかどうか判定
    function isBooked(time: string, room: string) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const jst = new Date(today.getTime() + 9 * 60 * 60 * 1000);
        const mm = String(jst.getMonth() + 1).padStart(2, '0');
        const dd = String(jst.getDate());
        const dateStr = `${yyyy}-${mm}-${dd}T${time}:00`;
        return receptions.some(
            (r) =>
                r.room?.toString() === room &&
                new Date(r.time).toISOString().slice(0, 16) === new Date(dateStr).toISOString().slice(0, 16)
        );
    }

    // Select用データ生成
    const availableTimeOptions = timeOptions.map(time => {
        const booked = isBooked(time, selectedRoom);
        return {
            value: time,
            label: time,
            booked,
            disabled: booked,
        };
    });

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

            <Group>
                <Select
                    label="部屋"
                    data={[
                        { value: '1', label: '部屋1' },
                        { value: '2', label: '部屋2' }
                    ]}
                    value={selectedRoom}
                    onChange={(value) => setSelectedRoom(value ?? '')}
                    className="schedule-select"
                    style={{ minWidth: 120 }}
                />
            </Group>

            {isAvailable === false && (
                <Alert
                    icon={<IconAlertCircle size="1rem" />}
                    title="満席"
                    color="red"
                    style={{ marginBottom: '20px', maxWidth: '500px' }}
                >
                    この部屋・時間帯は満席です
                </Alert>
            )}
            {isAvailable === true && (
                <Alert
                    icon={<IconCheck size="1rem" />}
                    title="予約可能"
                    color="green"
                    style={{ marginBottom: '20px', maxWidth: '500px' }}
                >
                    この部屋・時間帯は予約できます
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
                    disabled={!startTime || !isAvailable}
                >
                    確定
                </Button>
            </Group>
        </div>
    );
};

export default ReceptionSchedulePage;