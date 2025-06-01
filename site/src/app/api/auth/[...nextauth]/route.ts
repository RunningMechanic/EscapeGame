import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Admin Login',
            credentials: {
                id: { label: 'ID', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                console.log(credentials);
                const matched =
                    credentials?.id === 'admin' && credentials?.password === 'securepassword';
                if (matched) {
                    console.log('login success');
                    return { id: 'admin', name: 'Admin User' }; // 認証成功時のユーザー情報
                } else {
                    console.log('login failed');
                    return null; // 認証失敗
                }
            },
        }),
    ],
    pages: {
        signIn: '/admin-login', // ログインページのパス
    },
    session: {
        strategy: 'jwt', // セッション管理にJWTを使用
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };