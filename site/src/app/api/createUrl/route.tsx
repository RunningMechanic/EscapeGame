import prisma from '@/lib/db';
import { errorResponse, successResponse } from '@/utils/apiUtils';
import { NextRequest } from 'next/server';
import { generateToken } from '@/utils/tokenUtils';

// GET メソッドのハンドラー
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const count = Number(searchParams.get('count'));

  if (!start || !count) {
    return errorResponse('パラメータが不足しています');
  }

  let timeObj: Date | null = null;

  if (start) {
    // ISO形式ならそのまま、時刻だけなら今日の日付を補完
    if (/^\d{2}:\d{2}$/.test(start)) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      timeObj = new Date(`${yyyy}-${mm}-${dd}T${start}`);
    } else {
      timeObj = new Date(start);
    }
  }

  if (!timeObj || isNaN(timeObj.getTime())) {
    return errorResponse('開始時間の形式が不正です');
  }

  // 既存の予約を取得して重複チェック（教室は1つだけ）
  const existingBookings = await prisma.reception.findMany({
    where: {
      time: timeObj,
    },
    select: { time: true },
    orderBy: { time: 'asc' },
  });

  if (existingBookings.length > 0) {
    return errorResponse('この時間はすでに予約されています');
  }

  // 予約を保存
  const newBooking = await prisma.reception.create({
    data: {
      time: timeObj,
      number: count,
      // 他のカラムも必要なら追加
    },
  });

  // 予約IDからトークンを生成
  const token = generateToken(newBooking.id.toString());

  // idとtokenを返す
  return successResponse({
    id: newBooking.id,
    token,
    // 必要なら他の情報も
  });
}