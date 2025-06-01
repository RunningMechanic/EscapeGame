// import { withAuth } from 'next-auth/middleware';
import { NextRequest, NextResponse } from 'next/server';
console.log('Middleware loaded');
// export default withAuth({
//     pages: {
//         signIn: '/admin-login', // ログインページにリダイレクト
//     },
// });

export default function middleware(req: NextRequest) {
    console.log('Simplified middleware executed for path:', req.nextUrl.pathname);
    return NextResponse.next();
}

export const config = {
    matcher: ['/admin'], // 認証を適用するパス
};