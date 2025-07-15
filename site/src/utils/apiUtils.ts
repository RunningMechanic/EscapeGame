import { NextResponse } from 'next/server';

// 成功レスポンス
export function successResponse(data: unknown, message?: string) {
    return NextResponse.json({
        success: true,
        message: message || 'Operation completed successfully',
        data
    });
}

// エラーレスポンス
export function errorResponse(message: string, status: number = 500) {
    return NextResponse.json({
        success: false,
        error: message
    }, { status });
}

// バリデーションエラーレスポンス
export function validationErrorResponse(message: string) {
    return errorResponse(message, 400);
}

// 認証エラーレスポンス
export function authErrorResponse(message: string = 'Authentication failed') {
    return errorResponse(message, 401);
}

// 見つからないエラーレスポンス
export function notFoundErrorResponse(message: string = 'Resource not found') {
    return errorResponse(message, 404);
}

// 重複エラーレスポンス
export function conflictErrorResponse(message: string, conflictingData?: unknown) {
    return NextResponse.json({
        success: false,
        error: message,
        conflictingData
    }, { status: 409 });
} 