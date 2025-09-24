"use client";

import React from "react";
import { Grid, Paper, Stack, Group, ThemeIcon, Text, Badge, Button } from "@mantine/core";
import { IconUsers } from "@tabler/icons-react";
import type { GameSession, ParticipantMetaById } from "./types";

interface Props {
    activeSessions: GameSession[];
    participantMetaById: ParticipantMetaById;
    onStop: (targetSessionId: number) => Promise<void>;
}

export const ActiveSessionsList: React.FC<Props> = ({ activeSessions, participantMetaById, onStop }) => {
    const visible = activeSessions.filter((s) => s.isActive);
    if (visible.length === 0) return null;

    return (
        <Grid>
            {visible.map((s) => {
                if (s.participantId == null) return null; // nullを除外

                const metas = participantMetaById[s.participantId] ? [participantMetaById[s.participantId]] : [];
                const meta = metas[0];

                return (
                    <Grid.Col span={12} key={`${s.participantId}-${s.token ?? s.id}`}>
                        <Paper p="md" radius="md" withBorder style={{ background: "#e8f5e8" }}>
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
                                    <Text size="sm" c="dimmed">人数: <Text span fw={600}>{meta?.number ?? "-"}名</Text></Text>
                                    <Text size="sm" c="dimmed">受付時刻: <Text span fw={600}>{meta?.start ?? "-"}</Text></Text>
                                </Group>

                                <Button size="xs" color="red" variant="light" onClick={() => onStop(s.id)}>
                                    強制終了
                                </Button>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                );
            })}
        </Grid>
    );
};
