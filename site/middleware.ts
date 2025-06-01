import { withAuth } from 'next-auth/middleware';
console.log('Middleware loaded');
export default withAuth({
    pages: {
        signIn: '/admin-login', // ログインページにリダイレクト
    },
});

export const config = {
    matcher: ['/admin'], // 認証を適用するパス
};