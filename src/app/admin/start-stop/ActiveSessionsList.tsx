"use client";

import React from "react";
import { Grid, Paper, Stack, Group, ThemeIcon, Text, Badge } from "@mantine/core";
import { IconUsers } from "@tabler/icons-react";
import type { GameSession, ParticipantMetaById } from "./types";

interface Props {
    activeSessions: GameSession[];
    participantMetaById: ParticipantMetaById;
}

export const ActiveSessionsList: React.FC<Props> = ({ activeSessions, participantMetaById }) => {
    const visible = activeSessions.filter(s => s.isActive);
    if (visible.length === 0) return null;

    return (
        <Grid>
            {visible.map(s => {
                const meta = s.participantId ? participantMetaById[s.participantId] : undefined;
                return (
                    <Grid.Col span={12} key={s.id}>
                        <Paper p="md" radius="md" withBorder style={{ background: '#e8f5e8' }}>
                            <Stack gap="sm">
                                <Group gap="sm">
                                    <ThemeIcon size={30} radius="xl" color="green" variant="light">
                                        <IconUsers size={15} />
                                    </ThemeIcon>
                                    <Text fw={600} c="dark">参加者情報</Text>
                                    <Badge variant="light">Session #{s.id}</Badge>
                                </Group>
                                <Group gap="lg">
                                    <Text size="sm" c="dimmed">ID: <Text span fw={600}>{s.participantId}</Text></Text>
                                    {meta?.name && <Text size="sm" c="dimmed">名前: <Text span fw={600}>{meta.name}</Text></Text>}
                                    <Text size="sm" c="dimmed">人数: <Text span fw={600}>{meta?.number ?? '-'}名</Text></Text>
                                    <Text size="sm" c="dimmed">受付時刻: <Text span fw={600}>{meta?.start ?? '-'}</Text></Text>
                                </Group>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                );
            })}
        </Grid>
    );
};

export default ActiveSessionsList;


