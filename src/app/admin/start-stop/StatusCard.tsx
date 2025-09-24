"use client";

import React from "react";
import { Card, Stack, Group, ThemeIcon, Title, Grid, Paper, Text, Badge } from "@mantine/core";
import { IconQrcode } from "@tabler/icons-react";
import { formatTime } from "./utils";
import type { ScanStatus } from "./types";

interface Props {
    scanStatus: ScanStatus;
    elapsedTime: number;
    queuedCount?: number;
}

export const StatusCard: React.FC<Props> = ({ scanStatus, elapsedTime, queuedCount = 0 }) => {
    return (
        <Card shadow="xl" p="xl" radius="lg" withBorder style={{ width: '100%', maxWidth: 800 }}>
            <Stack gap="lg">
                <Group justify="center" gap="md">
                    <ThemeIcon size={50} radius="xl" color="blue" variant="light">
                        <IconQrcode size={25} />
                    </ThemeIcon>
                    <Title order={2} c="dark">現在の状態</Title>
                </Group>

                <Grid>
                    <Grid.Col span={6}>
                        <Paper p="md" radius="md" withBorder style={{ background: '#f8f9fa' }}>
                            <Stack align="center" gap="sm">
                                <Text size="sm" c="dimmed" fw={500}>ゲーム状態</Text>
                                <Badge
                                    size="xl"
                                    color={
                                        scanStatus === 'idle' ? 'dark' :
                                            scanStatus === 'waiting' ? 'orange' :
                                                scanStatus === 'started' ? 'green' : 'red'
                                    }
                                    variant="light"
                                    radius="md"
                                >
                                    <Text style={{
                                        color: 
                                            scanStatus === 'idle' ? 'dark' :
                                                scanStatus === 'waiting' ? 'orange' :
                                                    scanStatus === 'started' ? 'green' : 'red'
                                    }}>
                                        {scanStatus === 'idle' && '待機中'}
                                        {scanStatus === 'waiting' && '開始待ち'}
                                        {scanStatus === 'started' && 'ゲーム中'}
                                        {scanStatus === 'stopped' && '終了'}
                                    </Text>
                                </Badge>
                                {queuedCount > 0 && (
                                    <Badge size="sm" color="yellow" variant="light">
                                        待機中 {queuedCount}
                                    </Badge>
                                )}
                            </Stack>
                        </Paper>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Paper
                            p="md"
                            radius="md"
                            withBorder
                            style={{
                                background: elapsedTime >= 540 ? '#fff5f5' : '#f8f9fa',
                                borderColor: elapsedTime >= 540 ? '#ff6b6b' : undefined
                            }}
                        >
                            <Stack align="center" gap="sm">
                                <Text size="sm" c="dimmed" fw={500}>経過時間</Text>
                                <Text size="xl" fw={700} c={elapsedTime >= 540 ? "red" : "dark"}>
                                    {formatTime(elapsedTime)}
                                </Text>
                                {elapsedTime >= 540 && (
                                    <Badge size="sm" color="red" variant="light">
                                        残り {formatTime(600 - elapsedTime)}
                                    </Badge>
                                )}
                            </Stack>
                        </Paper>
                    </Grid.Col>
                </Grid>
            </Stack>
        </Card>
    );
};

export default StatusCard;


