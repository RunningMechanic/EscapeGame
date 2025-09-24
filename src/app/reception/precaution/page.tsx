'use client';

import React, { useState } from "react";
import { Button, Text, Stack, Checkbox, Container, Title, Paper, Group } from '@mantine/core';
import { IconAlertTriangle, IconClock, IconUsers, IconShield, IconCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

// ★ラッパーコンポーネントを作る
const CheckIconWrapper = (props: { className?: string }) => {
    return <IconCheck {...props} />;
};

const PrecautionsPage = () => {
    const router = useRouter();
    const [agreed, setAgreed] = useState(false);

    const handleAgree = () => {
        if (agreed) {
            router.push('/reception/schedule');
        }
    };

    return (
        <Container size="md" py="xl">
            <Stack gap="xl">
                <Title order={1} ta="center" c="white">
                    注意事項
                </Title>

                <Paper p="xl" bg="#16213a" style={{ border: '1px solid #2c3e50' }}>
                    <Stack gap="lg">
                        <Text size="lg" c="white" fw={500}>
                            脱出ゲーム参加前に以下の注意事項をお読みください
                        </Text>

                        <Stack gap="md">
                            <Group gap="md">
                                <IconAlertTriangle size={24} color="#ff6b6b" />
                                <Text c="white">
                                    MCの指示に従ってください。
                                </Text>
                            </Group>

                            <Group gap="md">
                                <IconClock size={24} color="#4ecdc4" />
                                <Text c="white">制限時間：１０分</Text>
                            </Group>

                            <Group gap="md">
                                <IconUsers size={24} color="#74b9ff" />
                                <Text c="white">定員：６～８名</Text>
                            </Group>
                        </Stack>
                    </Stack>
                </Paper>

                <Paper p="xl" bg="#16213a" style={{ border: '1px solid #2c3e50' }}>
                    <Stack gap="md">
                        <Checkbox
                            checked={agreed}
                            onChange={(event) => setAgreed(event.currentTarget.checked)}
                            label="上記の注意事項を理解し、同意します"
                            color="blue"
                            size="lg"
                            icon={CheckIconWrapper} // ★ここをラッパーに変更
                            styles={{
                                label: { color: 'white', fontSize: '1.1rem' },
                                input: { backgroundColor: '#2c3e50', borderColor: '#4ecdc4' }
                            }}
                        />

                        <Button
                            onClick={handleAgree}
                            disabled={!agreed}
                            size="lg"
                            fullWidth
                            leftSection={<IconCheck size={20} />}
                            style={{
                                backgroundColor: agreed ? '#4ecdc4' : '#6c757d',
                                color: 'white',
                                fontSize: '1.1rem',
                                fontWeight: 'bold'
                            }}
                        >
                            ゲーム開始
                        </Button>
                    </Stack>
                </Paper>
            </Stack>
        </Container>
    );
};

export default PrecautionsPage;
