'use client';

import React from "react";
import {
    Container,
    Title,
    Text,
    Button,
    Stack,
    Card,
    ThemeIcon,
    Grid
} from '@mantine/core';
import {
    IconUsers,
    IconArrowRight,
    IconClock,
    IconMapPin
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

const EntryPage = () => {
    const router = useRouter();

    const handleReception = () => {
        router.push('/reception/precaution');
    };

    return (
        <Container size="lg" py="md" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
            <Stack align="center" gap="lg" w="100%">
                {/* ヘッダー */}
                <Stack align="center" gap="sm">
                    <ThemeIcon size={100} radius="xl" color="blue" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                        <IconUsers size={50} />
                    </ThemeIcon>
                    <Title order={1} ta="center" c="dark" size="3.5rem">
                        脱出ゲーム
                    </Title>
                    <Text ta="center" c="dimmed" size="lg" maw={700}>
                        謎解きの世界へようこそ！チームで協力して謎を解き、最速タイムを目指そう！
                    </Text>
                </Stack>

                {/* メインアクション */}
                <Card
                    shadow="xl"
                    padding="xl"
                    radius="lg"
                    withBorder
                    style={{
                        width: '100%',
                        maxWidth: '600px',
                        minHeight: '300px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                    }}
                    onClick={handleReception}
                    className="hover-card"
                >
                    <Stack align="center" gap="lg" h="100%" justify="center">
                        <ThemeIcon size={80} radius="xl" color="dark" variant="filled">
                            <IconUsers size={40} color="white" />
                        </ThemeIcon>
                        <Title order={2} ta="center" c="white" size="2.5rem">
                            受付する
                        </Title>
                        <Text ta="center" c="rgba(255,255,255,0.9)" size="xl">
                            新しいゲームを開始<br />チームで謎解きに挑戦
                        </Text>
                        <Button
                            size="xl"
                            variant="white"
                            color="dark"
                            rightSection={<IconArrowRight size={24} />}
                            style={{
                                marginTop: 'auto',
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                fontSize: '1.2rem',
                                padding: '12px 32px'
                            }}
                        >
                            受付開始
                        </Button>
                    </Stack>
                </Card>


                {/* ゲーム情報 */}
                <Grid gutter="lg" w="100%" maw={900}>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Card shadow="sm" padding="xl" radius="md" withBorder h="100%" style={{ minHeight: '120px' }}>
                            <Stack align="center" gap="md" h="100%" justify="center">
                                <ThemeIcon size={50} radius="xl" color="blue" variant="light">
                                    <IconClock size={25} />
                                </ThemeIcon>
                                <Text ta="center" fw={700} size="lg">
                                    制限時間
                                </Text>
                                <Text ta="center" c="dimmed" size="md">
                                    10分以内に脱出を目指そう<br />
                                    <Text span c="blue" size="sm">15分交代制</Text>
                                </Text>
                            </Stack>
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Card shadow="sm" padding="xl" radius="md" withBorder h="100%" style={{ minHeight: '120px' }}>
                            <Stack align="center" gap="md" h="100%" justify="center">
                                <ThemeIcon size={50} radius="xl" color="green" variant="light">
                                    <IconUsers size={25} />
                                </ThemeIcon>
                                <Text ta="center" fw={700} size="lg">
                                    チーム人数
                                </Text>
                                <Text ta="center" c="dimmed" size="md">
                                    6〜8名で協力プレイ<br />
                                    <Text span c="orange" size="sm">人数が少ない場合は班を合併</Text>
                                </Text>
                            </Stack>
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Card shadow="sm" padding="xl" radius="md" withBorder h="100%" style={{ minHeight: '120px' }}>
                            <Stack align="center" gap="md" h="100%" justify="center">
                                <ThemeIcon size={50} radius="xl" color="grape" variant="light">
                                    <IconMapPin size={25} />
                                </ThemeIcon>
                                <Text ta="center" fw={700} size="lg">
                                    ルーム
                                </Text>
                                <Text ta="center" c="dimmed" size="md">
                                    教室<br />
                                    <Text span c="grape" size="sm">集中して謎解き</Text>
                                </Text>
                            </Stack>
                        </Card>
                    </Grid.Col>
                </Grid>
            </Stack>

            <style jsx>{`
                .hover-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                }
                
                .hover-card:active {
                    transform: translateY(-4px);
                }
            `}</style>
        </Container>
    );
};

export default EntryPage;