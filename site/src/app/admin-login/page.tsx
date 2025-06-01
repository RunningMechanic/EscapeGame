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
            redirect: true,
            callbackUrl: '/admin', // 認証成功後にリダイレクトするページ
        });

        if (!result?.ok) {
            alert('ログインに失敗しました。IDまたはパスワードを確認してください。');
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