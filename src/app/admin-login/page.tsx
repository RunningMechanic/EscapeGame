'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import {
    Container, Title, TextInput, PasswordInput, Button, Stack, Paper, Group, Loader, Notification
} from '@mantine/core';
import { IconLock, IconUser, IconAlertCircle } from '@tabler/icons-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);
        const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
            callbackUrl: '/admin',
        });
        setLoading(false);
        if (result?.ok) {
            window.location.href = '/admin';
        } else {
            // 401やその他のエラー時は必ず同じ日本語メッセージを表示
            setError('メールアドレスまたはパスワードが違います');
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f6f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Container size="xs" p="md" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <Paper shadow="md" p="xl" radius="md" withBorder style={{ minWidth: 340, width: '100%', maxWidth: 400 }}>
                    <form onSubmit={handleLogin}>
                        <Stack align="center" gap="md">
                            <Group>
                                <IconLock size={32} color="#228be6" />
                                <Title order={2} mb="xs">管理者ログイン</Title>
                            </Group>
                            {error && (
                                <Notification
                                    color="red"
                                    icon={<IconAlertCircle size={18} />}
                                    withCloseButton={false}
                                    style={{
                                        width: '100%',
                                        maxWidth: 320,
                                        marginBottom: 12,
                                        textAlign: 'center',
                                        fontSize: '1.05rem',
                                        fontWeight: 500,
                                        letterSpacing: '0.02em',
                                        lineHeight: 1.6,
                                        padding: '12px 8px'
                                    }}
                                >
                                    メールアドレスまたは<br />パスワードが違います
                                </Notification>
                            )}
                            <TextInput
                                label="メールアドレス"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                leftSection={<IconUser size={18} />}
                                required
                                w="100%"
                                maw={300}
                                autoComplete="username"
                            />
                            <PasswordInput
                                label="パスワード"
                                placeholder="パスワード"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                leftSection={<IconLock size={18} />}
                                required
                                w="100%"
                                maw={300}
                                autoComplete="current-password"
                            />
                            <Button type="submit" mt="md" color="blue" fullWidth maw={300} disabled={loading} leftSection={loading ? <Loader size={18} color="white" /> : undefined}>
                                {loading ? 'ログイン中...' : 'ログイン'}
                            </Button>
                        </Stack>
                    </form>
                </Paper>
            </Container>
        </div>
    );
};

export default LoginPage;