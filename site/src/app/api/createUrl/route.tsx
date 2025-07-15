import prisma from '@/lib/db';
import { generateToken } from '@/utils/tokenUtils';
import { validationErrorResponse, conflictErrorResponse, errorResponse, successResponse } from '@/utils/apiUtils';

// 時間を分に変換する関数
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// 時間帯が重複するかチェックする関数
function isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);

  return start1Min < end2Min && start2Min < end1Min;
}

// GET メソッドのハンドラー
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const count = searchParams.get('count'); // URLパラメータから人数を取得
  const start = searchParams.get('start'); // URLパラメータから開始時間を取得

  console.log('Received start time:', start);
  console.log('Received count:', count);

  if (!count) {
    return validationErrorResponse('人数が指定されていません');
  }
  if (!start) {
    return validationErrorResponse('開始時間が指定されていません');
  }

  try {
    // 終了時間を計算（開始時間から10分後）
    const [hours, minutes] = start.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + 10;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    const end = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

    // 既存の予約を取得して重複チェック
    const existingBookings = await prisma.receptionData.findMany({
      select: { start: true },
      orderBy: { start: 'asc' },
    });

    // 重複チェック
    for (const booking of existingBookings) {
      const existingStart = booking.start;
      const [existingHours, existingMinutes] = existingStart.split(':').map(Number);
      const existingTotalMinutes = existingHours * 60 + existingMinutes + 10;
      const existingEndHours = Math.floor(existingTotalMinutes / 60) % 24;
      const existingEndMinutes = existingTotalMinutes % 60;
      const existingEnd = `${existingEndHours.toString().padStart(2, '0')}:${existingEndMinutes.toString().padStart(2, '0')}`;

      if (isTimeOverlap(start, end, existingStart, existingEnd)) {
        return conflictErrorResponse(
          `この時間帯（${start}-${end}）は既に予約されています`,
          { conflictingTime: `${existingStart}-${existingEnd}` }
        );
      }
    }

    // IDと人数を保存
    const newReception = await prisma.receptionData.create({
      data: {
        count: parseInt(count),
        start,
        checker: false,
        alignment: false,
      },
    });

    const newId = newReception.id;

    if (!newId) {
      return errorResponse('Failed to retrieve new ID from database');
    }

    // セッショントークンを生成
    const token = generateToken(newId.toString());

    return successResponse({
      id: newId,
      count,
      start,
      end,
      token,
      available: true
    }, '予約が正常に作成されました');

  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Unexpected internal server error');
  }
}