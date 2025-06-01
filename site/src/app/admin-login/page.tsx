'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Container, Title, TextInput, PasswordInput, Button, Stack, Center } from '@mantine/core';

const LoginPage = () => {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        const result = await signIn('credentials', {
            id,
            password,
            redirect: false, // Changed from true
            callbackUrl: '/admin', // This might be ignored with redirect: false, but kept for clarity
        });
        console.log('Client-side signIn result:', result);

        if (result?.ok) {
            console.log('Authentication successful on client, redirecting to /admin');
            // Assuming 'next/navigation' and router instance might not be readily available
            // in this script, using window.location.href for simplicity.
            // If a Next.js router instance (e.g., from useRouter) is already in use, prefer that.
            window.location.href = '/admin';
        } else {
            // Log the error if it exists, otherwise log a generic message.
            const errorMessage = result?.error || 'Unknown error during sign in.';
            console.error('Client-side signIn error:', errorMessage);
            alert('ログインに失敗しました。IDまたはパスワードを確認してください。 Error: ' + errorMessage);
        }
    };

    return (
        <Container size="xs" p="md">
            <Center h="80vh">
                <Stack align="center" gap="md">
                    <Title order={1} mb="lg">ログイン</Title>
                    <TextInput
                        placeholder="ID"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        w="100%" // Stack will manage the width, or set a specific width
                        maw={300} // Max width for the input
                    />
                    <PasswordInput
                        placeholder="パスワード"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        w="100%"
                        maw={300}
                    />
                    <Button onClick={handleLogin} mt="md" color="blue" fullWidth maw={300}>
                        ログイン
                    </Button>
                </Stack>
            </Center>
        </Container>
    );
};

export default LoginPage;