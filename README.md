## Escape Game - Site

### セットアップ
- Node.js 18+ 推奨
- 依存関係: `npm ci` もしくは `npm install`

### スクリプト
- dev: `npm run dev`（Next.js、HTTPS/ターボパック）
- build: `npm run build`
- start: `npm run start`
- bs: `next build && next start -p 3000`
- lint: `npm run lint`

### 必須環境変数（.env.local）
- スケジュール（日程・時間）
  - `NEXT_PUBLIC_EVENT_DAY1`, `NEXT_PUBLIC_EVENT_DAY2`（例: 2025-09-20, 2025-09-21）
  - `NEXT_PUBLIC_DAY1_START`/`NEXT_PUBLIC_DAY1_END`（1日目 例: 09:30/14:30）
  - `NEXT_PUBLIC_DAY2_START`/`NEXT_PUBLIC_DAY2_END`（2日目 例: 10:00/14:00）
  - `NEXT_PUBLIC_INTERVAL_MINUTES`（例: 15）
- 収容人数
  - `NEXT_PUBLIC_MAX_GROUP_SIZE`（既定 8）
  - `MAX_GROUP_SIZE`（サーバー側検証、既定 8）
- トークン/公開URL
  - `SESSION_SECRET`（本番必須）
  - `NEXT_PUBLIC_APP_URL`（QR用のベースURL、例: https://example.com）

`.env.local` は `env.example` を参考に作成してください（ファイル名は .env.local）。

### 機能概要
- 受付スケジュール（`/reception/schedule`）
  - ENV設定に基づく時間枠生成
  - 残席バッジを強調表示、満席は選択不可
- 人数選択（`/reception/guest-count`）
  - 残席と `NEXT_PUBLIC_MAX_GROUP_SIZE` を反映したボタン表示
- 予約作成（`/reception/result` → `/api/createUrl`）
  - 同時刻の合計人数が `MAX_GROUP_SIZE` を超えない場合のみ予約
- 受付チェック（`/check-id`）
  - QRのトークン必須。到達して名前登録→`/api/updateAlignment` で来場済みに
- 受付管理（`/reception-control`）
  - 未保存ハイライト、保存（行/一括）、離脱警告
  - 操作列に「保存/リセット/QR/削除」アイコン（大きめ）
  - 「QR」から対象ID専用のチェック用QRを表示（`/api/getCheckUrl`）

### 主要API
- GET `/api/checkRoomAvailability?time=ISO` → `{ available, remaining, max }`
- GET `/api/createUrl?start=ISO&count=n`（残席超過で 409）
- GET `/api/getCheckUrl?id=ID`（`check-id` の直行URLを返す）
- GET `/api/checkid?id=ID&token=...`（予約詳細/チェック状態）
- GET `/api/updateAlignment?id=ID&name=...`（チェックイン）
- GET `/api/getReceptionList`（受付一覧）
- DELETE `/api/deleteReception`（管理用）

### 開発起動手順
1. `cd site`
2. 依存関係インストール: `npm install`
3. `env.example` を参考に `.env` を作成
4. 開発起動: `npm run dev`
5. ブラウザ: `https://localhost:3000`（自己署名証明書の警告は許可）

### 運用メモ
- ENVを変更したら再起動が必要（特に `NEXT_PUBLIC_`）。
- 1枠6〜8人目安。少人数班は同枠に追加予約して合計が上限以内なら可。
- `NEXT_PUBLIC_APP_URL` を設定するとQRの挙動が安定します。


