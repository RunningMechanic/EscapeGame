import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const authOptions: NextAuthOptions = {
    session: { strategy: 'jwt' },
    providers: [
        CredentialsProvider({
            name: 'Ninjin Sirisiri',
            credentials: {
                id: { label: 'Id', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                // IDとパスワードを検証
                console.log(credentials);
                const matched =
                    credentials?.id === 'admin' && credentials?.password === 'securepassword';
                if (matched) {
                    console.log('login success');
                    return { id: 'admin' }; // 認証成功時のユーザー情報
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
    // callbacks: {
    //     async session({ session, token }) {
    //         if (token.sub) {
    //             session.user.id = token.sub;
    //         }
    //         return session;
    //     },
    //     async jwt({ token, user }) {
    //         if (user) {
    //             token.sub = user.id;
    //         }
    //         return token;
    //     },
    //     async signIn({ user, account, profile }) {
    //         if (user) {
    //             return true;
    //         } else {
    //             return false;
    //         }
    //     },
    // },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };