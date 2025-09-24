import prisma from '@/lib/db';
import { errorResponse, successResponse } from '@/utils/apiUtils';
import { NextRequest, NextResponse } from 'next/server';
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
      timeObj = new Date(`${yyyy}-${mm}-${dd}T${start}:00+09:00`);

    } else {
      timeObj = new Date(start+':00+09:00');
    }
  }

  if (!timeObj || isNaN(timeObj.getTime())) {
    return errorResponse('開始時間の形式が不正です');
  }

  const maxGroupSize = Number(process.env.MAX_GROUP_SIZE || 8);

  // 同時刻の合計人数を取得し残席確認
  const existingAtSlot = await prisma.reception.findMany({
    where: { time: timeObj },
    select: { number: true },
  });
  const used = existingAtSlot.reduce((sum, r) => sum + (r.number || 0), 0);
  const remaining = Math.max(0, maxGroupSize - used);
  if (count > remaining) {
    return NextResponse.json({ success: false, error: `残席が足りません（残り: ${remaining}）`, remaining, max: maxGroupSize }, { status: 409 });
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