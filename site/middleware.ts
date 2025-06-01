import { withAuth } from 'next-auth/middleware';

export default withAuth({
    pages: {
        signIn: '/admin-login', // ログインページにリダイレクト
    },
});

export const config = {
    matcher: ['/admin'], // 認証を適用するパス
};