import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/utils/tokenUtils';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        const token = generateToken(id);

        // 推奨: NEXT_PUBLIC_APP_URL があればそれをベースURLに使用
        const configuredBase = process.env.NEXT_PUBLIC_APP_URL;
        let baseUrl = configuredBase;
        if (!baseUrl) {
            const proto = request.headers.get('x-forwarded-proto') || 'https';
            const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
            baseUrl = `${proto}://${host}`;
        }

        const url = `${baseUrl}/check-id?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;
        return NextResponse.json({ success: true, url });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
    }
}


