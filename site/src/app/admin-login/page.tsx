'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
            <h1>ログイン</h1>
            <input
                type="text"
                placeholder="ID"
                value={id}
                onChange={(e) => setId(e.target.value)}
                style={{ marginBottom: '10px', padding: '8px', width: '200px' }}
            />
            <input
                type="password"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ marginBottom: '10px', padding: '8px', width: '200px' }}
            />
            <button onClick={handleLogin} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px' }}>
                ログイン
            </button>
        </div>
    );
};

export default LoginPage;