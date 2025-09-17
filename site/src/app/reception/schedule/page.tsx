'use client';

import React, { useState, useEffect } from "react";
import {
    Container,
    Title,
    Text,
    Button,
    Group,
    Stack,
    Card,
    ThemeIcon,
    Grid,
    Badge,
    Paper,
    Alert,
} from '@mantine/core';
import {
    IconClock,
    IconCalendarEvent,
    IconCheck,
    IconAlertCircle,
    IconArrowRight,
    IconMapPin,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

interface ReceptionData {
    id: number;
    time: string;
    room: number;
}

const ReceptionSchedulePage = () => {
    const router = useRouter();
    const [startTime, setStartTime] = useState<string | null>(null);
    const [endTime, setEndTime] = useState<string | null>(null);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [receptions, setReceptions] = useState<ReceptionData[]>([]);
    const [loading, setLoading] = useState(true);

    const timeOptions = [
        "13:00", "13:15", "13:30", "13:45",
        "14:00", "14:15", "14:30", "14:45",
        "15:00", "15:15", "15:30", "15:45"
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
        if (startTime) {
            const today = new Date();
            const jst = new Date(today.getTime() + 9 * 60 * 60 * 1000);
            const yyyy = jst.getFullYear();
            const mm = String(jst.getMonth() + 1).padStart(2, '0');
            const dd = String(jst.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}T${startTime}:00`;
            fetch(`/api/checkRoomAvailability?time=${encodeURIComponent(dateStr)}`)
                .then(res => res.json())
                .then(data => setIsAvailable(data.available));
        } else {
            setIsAvailable(null);
        }
    }, [startTime]);

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
        if (!startTime || !endTime) {
            alert('開始時刻を選択してください！');
            return;
        }
        router.push(`/reception/guest-count?start=${startTime}`);
    };

    // 予約済みかどうか判定
    function isBooked(time: string) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const jst = new Date(today.getTime() + 9 * 60 * 60 * 1000);
        const mm = String(jst.getMonth() + 1).padStart(2, '0');
        const dd = String(jst.getDate());
        const dateStr = `${yyyy}-${mm}-${dd}T${time}:00`;
        return receptions.some(
            (r) =>
                new Date(r.time).toISOString().slice(0, 16) === new Date(dateStr).toISOString().slice(0, 16)
        );
    }

    if (loading) {
        return (
            <Container size="lg" py="xl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stack align="center" gap="lg">
                    <ThemeIcon size={60} radius="xl" color="blue" variant="light">
                        <IconClock size={30} />
                    </ThemeIcon>
                    <Text size="xl" c="dimmed">読み込み中...</Text>
                </Stack>
            </Container>
        );
    }

    return (
        <Container size="lg" py="md" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
            <Stack align="center" gap="lg" w="100%">


                {/* 時間選択 */}
                <Paper
                    shadow="xl"
                    p="xl"
                    radius="xl"
                    withBorder
                    style={{
                        width: '100%',
                        maxWidth: 900,
                        background: 'linear-gradient(135deg,rgb(66, 155, 233) 0%, #e9ecef 100%)',
                        border: '2px solid #dee2e6'
                    }}
                >
                    <Stack gap="lg">
                        <Group gap="sm" justify="center">
                            <ThemeIcon size={50} radius="xl" color="blue" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                                <IconClock size={25} />
                            </ThemeIcon>
                            <Title order={3} c="dark" size="2rem">利用可能時間</Title>
                        </Group>

                        <Grid gutter="lg">
                            {timeOptions.map((time) => {
                                const booked = isBooked(time);
                                const isSelected = startTime === time;
                                const [hours, minutes] = time.split(':').map(Number);
                                const endMinutes = minutes + 10;
                                const endHours = hours + Math.floor(endMinutes / 60);
                                const finalMinutes = endMinutes % 60;
                                const endTimeStr = `${endHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;

                                return (
                                    <Grid.Col key={time} span={{ base: 6, sm: 4, md: 3 }}>
                                        <Card
                                            shadow={isSelected ? "xl" : "md"}
                                            p="xl"
                                            radius="lg"
                                            withBorder
                                            style={{
                                                cursor: booked ? 'not-allowed' : 'pointer',
                                                opacity: booked ? 0.6 : 1,
                                                background: isSelected
                                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                    : booked
                                                        ? '#f8f9fa'
                                                        : 'white',
                                                border: isSelected ? 'none' : '2px solid #e9ecef',
                                                transition: 'all 0.3s ease',
                                                transform: isSelected ? 'translateY(-4px)' : 'none',
                                                minHeight: '120px',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                            onClick={() => !booked && handleStartTimeChange(time)}
                                            className="time-card"
                                        >
                                            <Stack align="center" gap="sm" w="100%">
                                                <Text
                                                    fw={700}
                                                    size="xl"
                                                    c={isSelected ? "white" : booked ? "dimmed" : "dark"}
                                                >
                                                    {time}
                                                </Text>
                                                <Text
                                                    size="md"
                                                    c={isSelected ? "rgba(255,255,255,0.9)" : "dimmed"}
                                                    fw={500}
                                                >
                                                    〜 {endTimeStr}
                                                </Text>
                                                {booked && (
                                                    <Badge size="sm" color="red" variant="light" radius="md">
                                                        予約済み
                                                    </Badge>
                                                )}
                                                {isSelected && (
                                                    <Badge size="sm" color="white" variant="filled" c="dark" radius="md">
                                                        選択中
                                                    </Badge>
                                                )}
                                            </Stack>
                                        </Card>
                                    </Grid.Col>
                                );
                            })}
                        </Grid>
                    </Stack>
                </Paper>

                {/* 選択状況表示 */}
                {startTime && (
                    <Card
                        shadow="md"
                        p="lg"
                        radius="lg"
                        withBorder
                        style={{
                            width: '100%',
                            maxWidth: 600,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none'
                        }}
                    >
                        <Group justify="space-between" align="center">
                            <Group gap="md">
                                <ThemeIcon size={40} radius="xl" color="dark" variant="filled">
                                    <IconCalendarEvent size={20} color="white" />
                                </ThemeIcon>
                                <Stack gap={2}>
                                    <Text c="white" fw={600} size="lg">選択中のスケジュール</Text>
                                    <Group gap="lg">
                                        <Group gap="xs">
                                            <IconClock size={16} color="rgba(255,255,255,0.8)" />
                                            <Text c="rgba(255,255,255,0.9)" size="md" fw={500}>
                                                {startTime} 〜 {endTime}
                                            </Text>
                                        </Group>
                                        <Group gap="xs">
                                            <IconMapPin size={16} color="rgba(255,255,255,0.8)" />
                                            <Text c="rgba(255,255,255,0.9)" size="md" fw={500}>
                                                教室
                                            </Text>
                                        </Group>
                                    </Group>
                                </Stack>
                            </Group>
                            <Badge size="lg" color="white" variant="filled" c="dark" radius="md">
                                選択中
                            </Badge>
                        </Group>
                    </Card>
                )}

                {/* ステータス表示 */}
                {isAvailable === false && (
                    <Alert
                        icon={<IconAlertCircle size="1rem" />}
                        title="満席"
                        color="red"
                        variant="light"
                        style={{ width: '100%', maxWidth: 600 }}
                    >
                        この時間帯は満席です。別の時間を選択してください。
                    </Alert>
                )}
                {isAvailable === true && (
                    <Alert
                        icon={<IconCheck size="1rem" />}
                        title="予約可能"
                        color="green"
                        variant="light"
                        style={{ width: '100%', maxWidth: 600 }}
                    >
                        この時間帯は予約できます！
                    </Alert>
                )}

                {/* 確定ボタン */}
                <Button
                    size="lg"
                    color="blue"
                    rightSection={<IconArrowRight size={18} />}
                    onClick={handleConfirm}
                    disabled={!startTime || !isAvailable}
                    style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        padding: '10px 28px',
                        minWidth: 180,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                >
                    次のステップへ
                </Button>
            </Stack>

            <style jsx>{`
                .time-card:hover {
                    transform: translateY(-4px) !important;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
                }
            `}</style>
        </Container>
    );
};

export default ReceptionSchedulePage;