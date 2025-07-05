import { NextResponse } from 'next/server';
import pool from '../db';

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

// トークン生成関数
function generateToken(id: string): string {
  const secret = process.env.SESSION_SECRET || 'default-secret';
  const timestamp = Math.floor(Date.now() / (1000 * 60 * 60)); // 1時間単位
  return btoa(`${id}-${timestamp}-${secret}`).replace(/[^a-zA-Z0-9]/g, '');
}

// GET メソッドのハンドラー
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tableName = process.env.TABLE_NAME || 'receptions';
  const count = searchParams.get('count'); // URLパラメータから人数を取得
  const start = searchParams.get('start'); // URLパラメータから開始時間を取得
  console.log('Received start time:', start);
  console.log('Received count:', count);
  if (!count) {
    return NextResponse.json({ error: '人数が指定されていません' }, { status: 400 });
  }
  if (!start) {
    return NextResponse.json({ error: '開始時間が指定されていません' }, { status: 400 });
  }

  try {
    // 終了時間を計算（開始時間から10分後）
    const [hours, minutes] = start.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + 10;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    const end = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

    // 既存の予約を取得して重複チェック
    const checkQuery = `
      SELECT start FROM ${tableName} 
      ORDER BY start ASC;
    `;

    const checkResult = await pool.query(checkQuery);
    const existingBookings = checkResult.rows;

    // 重複チェック
    for (const booking of existingBookings) {
      const existingStart = booking.start;
      const [existingHours, existingMinutes] = existingStart.split(':').map(Number);
      const existingTotalMinutes = existingHours * 60 + existingMinutes + 10;
      const existingEndHours = Math.floor(existingTotalMinutes / 60) % 24;
      const existingEndMinutes = existingTotalMinutes % 60;
      const existingEnd = `${existingEndHours.toString().padStart(2, '0')}:${existingEndMinutes.toString().padStart(2, '0')}`;

      if (isTimeOverlap(start, end, existingStart, existingEnd)) {
        return NextResponse.json({
          error: `この時間帯（${start}-${end}）は既に予約されています`,
          available: false,
          conflictingTime: `${existingStart}-${existingEnd}`
        }, { status: 409 });
      }
    }

    // IDと人数を保存
    const insertQuery = `
      INSERT INTO ${tableName} (count, start)
      VALUES ($1, $2)
      RETURNING id;
    `;
    let result;
    try {
      result = await pool.query(insertQuery, [parseInt(count), start]);
    } catch (dbError) {
      console.error('Database error during INSERT:', dbError);
      return NextResponse.json({ error: 'Database error during INSERT operation' }, { status: 500 });
    }

    const newId = result.rows[0]?.id;
    if (!newId) {
      console.error('Failed to retrieve new ID from database');
      return NextResponse.json({ error: 'Failed to retrieve new ID from database' }, { status: 500 });
    }

    // セッショントークンを生成
    const token = generateToken(newId.toString());

    return NextResponse.json({
      id: newId,
      count,
      start,
      end,
      token,
      available: true,
      message: '予約が正常に作成されました'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected internal server error' }, { status: 500 });
  }
}