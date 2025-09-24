'use client';

import React, { useState, useEffect, useMemo } from "react";
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
    alignment: boolean;
}

const ReceptionSchedulePage = () => {
    const router = useRouter();
    const [startTime, setStartTime] = useState<string | null>(null);
    const [endTime, setEndTime] = useState<string | null>(null);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [receptions, setReceptions] = useState<ReceptionData[]>([]);
    const [loading, setLoading] = useState(true);
    const maxGroupSize = useMemo(() => Number(process.env.NEXT_PUBLIC_MAX_GROUP_SIZE || 8), []);

    // ENV からイベント日と時間帯設定を取得
    const eventDay1 = process.env.NEXT_PUBLIC_EVENT_DAY1 || '';
    const eventDay2 = process.env.NEXT_PUBLIC_EVENT_DAY2 || '';
    const day1Start = process.env.NEXT_PUBLIC_DAY1_START || '09:30';
    const day1End = process.env.NEXT_PUBLIC_DAY1_END || '14:30';
    const day2Start = process.env.NEXT_PUBLIC_DAY2_START || '10:00';
    const day2End = process.env.NEXT_PUBLIC_DAY2_END || '14:00';
    const intervalMinutes = Number(process.env.NEXT_PUBLIC_INTERVAL_MINUTES || 15);

    const todayDateStr = useMemo(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    // 今日がイベント1日目 or 2日目かを判定
    const activeDay: 1 | 2 = (todayDateStr === eventDay2) ? 2 : 1;

    const slotRange = activeDay === 1 ? { start: day1Start, end: day1End } : { start: day2Start, end: day2End };

    const timeOptions = useMemo(() => {
        const options: string[] = [];
        const [sh, sm] = slotRange.start.split(':').map(Number);
        const [eh, em] = slotRange.end.split(':').map(Number);
        let cur = sh * 60 + sm;
        const end = eh * 60 + em;
        while (cur <= end) {
            const h = Math.floor(cur / 60).toString().padStart(2, '0');
            const m = (cur % 60).toString().padStart(2, '0');
            options.push(`${h}:${m}`);
            cur += intervalMinutes;
        }
        return options;
    }, [slotRange.start, slotRange.end, intervalMinutes]);

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
            const dateStr = `${activeDay === 1 ? eventDay1 || todayDateStr : eventDay2 || todayDateStr}T${startTime}:00`;
            fetch(`/api/checkRoomAvailability?time=${encodeURIComponent(dateStr)}`)
                .then(res => res.json())
                .then(data => setIsAvailable(Boolean(data.available)));
        } else {
            setIsAvailable(null);
        }
    }, [startTime, activeDay, eventDay1, eventDay2, todayDateStr]);

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
        const dateStr = `${activeDay === 1 ? eventDay1 || todayDateStr : eventDay2 || todayDateStr}T${startTime}:00`;
        router.push(`/reception/guest-count?start=${encodeURIComponent(dateStr)}`);
    };

    function remainingAt(time: string) {
    const targetDateStr = activeDay === 1 ? eventDay1 || todayDateStr : eventDay2 || todayDateStr;
    const [hourStr, minuteStr] = time.split(':');

    // JST を UTC に変換（-9時間）
    const targetUTC = new Date(`${targetDateStr}T${time}:00`);
    console.log('targetUTC:', targetUTC.toISOString());

    const used = receptions
        .filter(r => r.alignment)
        .filter(r => {
            const rTime = new Date(r.time);
            console.log('rTime UTC:', rTime.toString());
            console.log('Target:', rTime.toString());
            // UTC で時刻を比較
            return (
                rTime.getUTCFullYear() === targetUTC.getUTCFullYear() &&
                rTime.getUTCMonth() === targetUTC.getUTCMonth() &&
                rTime.getUTCDate() === targetUTC.getUTCDate() &&
                rTime.getUTCHours() === targetUTC.getUTCHours() &&
                rTime.getUTCMinutes() === targetUTC.getUTCMinutes()
            );
        })
        .reduce((sum, r) => sum + ((r as any).number || 0), 0);

    const remaining = Math.max(0, maxGroupSize - used);
    console.log('remaining seats:', remaining);
    return remaining;
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
                                const remaining = remainingAt(time);
                                const booked = remaining === 0;
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
{!booked && (
  <Badge
    size="lg"
    color="green"
    variant="light"
    radius="md"
    styles={{
      root: {
        fontWeight: 800,
        letterSpacing: 0.5,
        fontSize: '1.25rem',  // フォントサイズを大きく
        padding: '0.75rem 1.5rem',  // 高さと横幅を大きく
      },
    }}
  >
    残席 {remaining}
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