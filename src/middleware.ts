import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = ['/', '/checkid', '/api/checkid', '/admin-login', '/ranking'];

export async function middleware(request: NextRequest) {
    // 完全一致またはサブパス一致で除外
    if (PUBLIC_PATHS.some(path =>
        request.nextUrl.pathname === path ||
        (path !== '/' && request.nextUrl.pathname.startsWith(path + '/'))
    )) {
        return NextResponse.next();
    }

    // 認証判定無効化
    if (request.nextUrl.pathname === '/admin') { 
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (token) {
        const loginUrl = new URL('/admin-login', request.url);
        return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
}

// 適用範囲を指定
export const config = {
    matcher: [
        // すべてのパスに適用。ただし、middleware内で除外判定
        '/((?!_next/|api/|check-id|admin-login$|$).*)',
    ],
};