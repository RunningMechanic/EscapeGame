'use client';

import React, { useState, useEffect } from 'react';
import {
    Container,
    Title,
    Text,
    Button,
    Group,
    Stack,
    Card,
    ThemeIcon,
    Paper,
    TextInput,
    Grid,
    CopyButton,
    ActionIcon,
    Tooltip,
    Badge
} from '@mantine/core';
import {
    IconQrcode,
    IconCopy,
    IconCheck,
    IconRefresh,
    IconExternalLink,
    IconSettings
} from '@tabler/icons-react';
import QRCode from 'qrcode';

const QRGeneratorPage = () => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
    const [customId, setCustomId] = useState('12');
    const [customToken, setCustomToken] = useState('MTItNDg4MjYwLWRlZmF1bHQtc2VjcmV0');
    const [isGenerating, setIsGenerating] = useState(false);

    // デフォルトURLを生成
    useEffect(() => {
        generateQRCode(customId, customToken);
    }, []);

    const generateQRCode = async (id: string, token: string) => {
        if (!id || !token) return;

        setIsGenerating(true);
        try {
            const url = `https://localhost:3000/check-id?id=${id}&token=${token}`;
            setQrCodeUrl(url);

            // QRコードを生成
            const qrDataUrl = await QRCode.toDataURL(url, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            setQrCodeDataUrl(qrDataUrl);
        } catch (error) {
            console.error('QRコード生成エラー:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerate = () => {
        generateQRCode(customId, customToken);
    };

    const openInNewTab = () => {
        if (qrCodeUrl) {
            window.open(qrCodeUrl, '_blank');
        }
    };

    return (
        <Container size="lg" py="xl">
            <Stack align="center" gap="xl">
                {/* ヘッダー */}
                <Stack align="center" gap="md">
                    <ThemeIcon size={80} radius="xl" color="blue" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                        <IconQrcode size={40} />
                    </ThemeIcon>
                    <Title order={1} ta="center" c="dark" size="3rem">
                        QRコード生成器
                    </Title>
                    <Text ta="center" c="dimmed" size="lg">
                        チェックイン用のQRコードを生成・表示
                    </Text>
                </Stack>

                {/* 設定パネル */}
                <Card shadow="xl" p="xl" radius="lg" withBorder style={{ width: '100%', maxWidth: 600 }}>
                    <Stack gap="lg">
                        <Group gap="md">
                            <ThemeIcon size={40} radius="xl" color="blue" variant="light">
                                <IconSettings size={20} />
                            </ThemeIcon>
                            <Title order={3} c="dark">設定</Title>
                        </Group>

                        <Grid gutter="md">
                            <Grid.Col span={6}>
                                <TextInput
                                    label="ID"
                                    placeholder="例: 12"
                                    value={customId}
                                    onChange={(event) => setCustomId(event.currentTarget.value)}
                                    size="md"
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <TextInput
                                    label="トークン"
                                    placeholder="例: MTItNDg4MjYwLWRlZmF1bHQtc2VjcmV0"
                                    value={customToken}
                                    onChange={(event) => setCustomToken(event.currentTarget.value)}
                                    size="md"
                                />
                            </Grid.Col>
                        </Grid>

                        <Button
                            size="lg"
                            color="blue"
                            leftSection={<IconRefresh size={20} />}
                            onClick={handleGenerate}
                            loading={isGenerating}
                            style={{ width: '100%' }}
                        >
                            QRコードを生成
                        </Button>
                    </Stack>
                </Card>

                {/* QRコード表示 */}
                {qrCodeDataUrl && (
                    <Card shadow="xl" p="xl" radius="lg" withBorder style={{ width: '100%', maxWidth: 500 }}>
                        <Stack align="center" gap="lg">
                            <Group gap="md">
                                <ThemeIcon size={40} radius="xl" color="green" variant="light">
                                    <IconQrcode size={20} />
                                </ThemeIcon>
                                <Title order={3} c="dark">生成されたQRコード</Title>
                            </Group>

                            <Paper p="md" radius="md" withBorder style={{ background: '#f8f9fa' }}>
                                <img
                                    src={qrCodeDataUrl}
                                    alt="QR Code"
                                    style={{
                                        display: 'block',
                                        maxWidth: '100%',
                                        height: 'auto'
                                    }}
                                />
                            </Paper>

                            {/* URL表示とコピーボタン */}
                            <Paper p="md" radius="md" withBorder style={{ background: '#f8f9fa', width: '100%' }}>
                                <Stack gap="sm">
                                    <Text size="sm" c="dimmed" fw={500}>生成されたURL:</Text>
                                    <Group gap="sm" justify="space-between">
                                        <Text
                                            size="sm"
                                            c="dark"
                                            style={{
                                                wordBreak: 'break-all',
                                                flex: 1,
                                                fontFamily: 'monospace'
                                            }}
                                        >
                                            {qrCodeUrl}
                                        </Text>
                                        <Group gap="xs">
                                            <CopyButton value={qrCodeUrl}>
                                                {({ copied, copy }) => (
                                                    <Tooltip label={copied ? 'コピー済み' : 'コピー'} withArrow>
                                                        <ActionIcon
                                                            color={copied ? 'green' : 'blue'}
                                                            variant="light"
                                                            onClick={copy}
                                                        >
                                                            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                                        </ActionIcon>
                                                    </Tooltip>
                                                )}
                                            </CopyButton>
                                            <Tooltip label="新しいタブで開く" withArrow>
                                                <ActionIcon
                                                    color="blue"
                                                    variant="light"
                                                    onClick={openInNewTab}
                                                >
                                                    <IconExternalLink size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Group>
                                </Stack>
                            </Paper>

                            {/* ステータス表示 */}
                            <Badge size="lg" color="green" variant="light">
                                生成完了
                            </Badge>
                        </Stack>
                    </Card>
                )}

                {/* 使用方法 */}
                <Card shadow="md" p="lg" radius="lg" withBorder style={{ width: '100%', maxWidth: 600 }}>
                    <Stack gap="md">
                        <Title order={4} c="dark">使用方法</Title>
                        <Stack gap="sm">
                            <Text size="sm" c="dimmed">
                                1. 上記の設定でIDとトークンを入力
                            </Text>
                            <Text size="sm" c="dimmed">
                                2. 「QRコードを生成」ボタンをクリック
                            </Text>
                            <Text size="sm" c="dimmed">
                                3. 生成されたQRコードをスマートフォンでスキャン
                            </Text>
                            <Text size="sm" c="dimmed">
                                4. または、URLをコピーして直接アクセス
                            </Text>
                        </Stack>
                    </Stack>
                </Card>
            </Stack>
        </Container>
    );
};

export default QRGeneratorPage;
