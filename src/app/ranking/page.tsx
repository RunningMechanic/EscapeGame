'use client';

import React, { useState, useEffect } from 'react';
import {
    Container,
    Title,
    Paper,
    Stack,
    Text,
    Badge,
    Group,
    Center,
    Loader,
    ThemeIcon,
    Card,
    Grid,
    SegmentedControl,
} from '@mantine/core';
import {
    IconTrophy,
    IconMedal,
    IconClock,
    IconUsers,
    IconBuildingStore,
    IconCalendar
} from '@tabler/icons-react';

interface RankingData {
    id: number;
    timeTaken: number;
    number: number;
    name?: string;
    time: string;
}

const RankingPage = () => {
    const [rankings, setRankings] = useState<RankingData[]>([]);
    const [loading, setLoading] = useState(true);
    const [difficulty, setDifficulty] = useState<string>("EASY")


    const fetchRankings = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/ranking?difficulty=${difficulty}`);
            const data = await response.json();
            setRankings(data.rankings || []);
        } catch (error) {
            console.error('ランキング取得エラー:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <IconTrophy size={32} color="#FFD700" />;
            case 2:
                return <IconMedal size={28} color="#C0C0C0" />;
            case 3:
                return <IconMedal size={28} color="#CD7F32" />;
            default:
                return <Text size="xl" fw={700} c="dimmed">#{rank}</Text>;
        }
    };

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1:
                return '#FFD700';
            case 2:
                return '#C0C0C0';
            case 3:
                return '#CD7F32';
            default:
                return '#868E96';
        }
    };

    const updateDifficulty = async (data: string) => {
        setDifficulty(data)
    }

    useEffect(() => {
        fetchRankings()
    }, [difficulty])

    useEffect(() => {
        updateDifficulty("EASY")
    }, [])


    if (loading) {
        return (
            <Container size="md" py="xl">
                <Center h={400}>
                    <Stack align="center">
                        <Loader size="lg" />
                        <Text>ランキングを読み込み中...</Text>
                    </Stack>
                </Center>
            </Container>
        );
    }


    return (
        <Container size="md" py="xl">
            <Stack align="center" gap="xl">
                {/* ヘッダー */}
                <Stack align="center" gap="sm">
                    <ThemeIcon size={60} radius="xl" color="yellow" variant="gradient" gradient={{ from: 'yellow', to: 'orange' }}>
                        <IconTrophy size={30} />
                    </ThemeIcon>
                    <Title order={1} ta="center" c="white">
                        脱出ゲーム ランキング
                    </Title>
                    <Text c="dimmed" ta="center" size="lg">
                        最速脱出タイム TOP 5
                    </Text>
                    <SegmentedControl fullWidth data={["EASY", "HARD"]} value={difficulty} onChange={updateDifficulty}></SegmentedControl>
                </Stack>

                {/* ランキング一覧 */}
                {rankings.length === 0 ? (
                    <Paper shadow="md" p="xl" radius="md" withBorder style={{ width: '100%', maxWidth: 500 }}>
                        <Center>
                            <Stack align="center" gap="md">
                                <IconTrophy size={48} color="#868E96" />
                                <Text size="lg" c="dimmed" ta="center">
                                    まだランキングデータがありません
                                </Text>
                                <Text size="sm" c="dimmed" ta="center">
                                    ゲームをプレイして記録を作りましょう！
                                </Text>
                            </Stack>
                        </Center>
                    </Paper>
                ) : (
                    <Stack gap="md" style={{ width: '100%', maxWidth: 600 }}>
                        {rankings.map((ranking, index) => (
                            <Card
                                key={ranking.id}
                                shadow="sm"
                                padding="lg"
                                radius="md"
                                withBorder
                                style={{
                                    background: index < 3 ?
                                        `linear-gradient(135deg, ${getRankColor(index + 1)}15, transparent)` :
                                        undefined
                                }}
                            >
                                <Grid align="center">
                                    <Grid.Col span={2}>
                                        <Center>
                                            {getRankIcon(index + 1)}
                                        </Center>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Stack gap="xs">
                                            <Text fw={500} size="md" c="dark">
                                                {ranking.name || '匿名'}
                                            </Text>
                                            <Group gap="sm">
                                                <ThemeIcon size="sm" color="blue" variant="light">
                                                    <IconClock size={14} />
                                                </ThemeIcon>
                                                <Text fw={600} size="lg">
                                                    {formatTime(ranking.timeTaken)}
                                                </Text>
                                            </Group>
                                            <Group gap="sm">
                                                <ThemeIcon size="sm" color="green" variant="light">
                                                    <IconUsers size={14} />
                                                </ThemeIcon>
                                                <Text size="sm" c="dimmed">
                                                    {ranking.number}名
                                                </Text>
                                            </Group>
                                        </Stack>
                                    </Grid.Col>
                                    <Grid.Col span={4}>
                                        <Stack gap="xs" align="flex-end">
                                            <Badge
                                                color="indigo"
                                                variant="light"
                                                leftSection={<IconBuildingStore size={12} />}
                                            >
                                                教室
                                            </Badge>
                                            <Group gap="xs">
                                                <IconCalendar size={12} color="#868E96" />
                                                <Text size="xs" c="dimmed">
                                                    {new Date(ranking.time).toLocaleDateString('ja-JP')}
                                                </Text>
                                            </Group>
                                        </Stack>
                                    </Grid.Col>
                                </Grid>
                            </Card>
                        ))}
                    </Stack>
                )}

                {/* フッター情報 */}
                <Paper shadow="xs" p="md" radius="md" withBorder style={{ width: '100%', maxWidth: 500 }}>
                    <Stack gap="xs" align="center">
                        <Text size="sm" c="dimmed" ta="center">
                            タイムは脱出にかかった時間です
                        </Text>
                        <Text size="xs" c="dimmed" ta="center">
                            記録はリアルタイムで更新されます
                        </Text>
                    </Stack>
                </Paper>
            </Stack>
        </Container>
    );
};

export default RankingPage;