"use client";

import React from "react";
import { Modal, Stack, Text, Group, Button } from "@mantine/core";
import type { PendingCandidate } from "./types";

interface Props {
    opened: boolean;
    pendingCandidate: PendingCandidate | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmStartModal: React.FC<Props> = ({ opened, pendingCandidate, onConfirm, onCancel }) => {
    return (
        <Modal opened={opened} onClose={onCancel} title="このグループを追加しますか？" centered>
            <Stack gap="sm">
                {pendingCandidate && (
                    <>
                        <Text size="sm">ID: <Text span fw={600}>{pendingCandidate.id}</Text></Text>
                        {pendingCandidate.name && <Text size="sm">名前: <Text span fw={600}>{pendingCandidate.name}</Text></Text>}
                        <Text size="sm">人数: <Text span fw={600}>{pendingCandidate.number}名</Text></Text>
                        <Text size="sm">受付時刻: <Text span fw={600}>{pendingCandidate.start}</Text></Text>
                    </>
                )}
                <Group justify="flex-end" gap="md" mt="sm">
                    <Button variant="default" onClick={onCancel}>キャンセル</Button>
                    <Button color="green" onClick={onConfirm}>追加</Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default ConfirmStartModal;
