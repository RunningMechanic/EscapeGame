let counter = 0; // サーバー起動中は保持される（リロードするとリセットされる）

export async function GET() {
  counter += 1;
  return new Response(JSON.stringify({ count: counter }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}