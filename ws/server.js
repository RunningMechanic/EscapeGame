const path = require("path");
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
// CORS 設定を追加
const io = new Server(server, {
  cors: {
    origin: "*", // クライアントのURLを指定
    methods: ["GET", "POST"], // 許可するHTTPメソッド
  },
});
app.use(express.static(path.join(__dirname, 'public')));
const numberToSocketMap = new Map(); // {番号: socket.id}

io.on('connection', (socket) => {
  console.log('接続:', socket.id);

  socket.on('register-number', (number) => {
    console.log('番号登録:', number);
    numberToSocketMap.set(number, socket.id);
  });

  socket.on('scan-qr', ({ Count, qrCodeData }) => {
    console.log('スキャンされた: count=', Count, 'qr=', qrCodeData);
    console.log('現在のマップ:', numberToSocketMap);
    const targetSocketId = numberToSocketMap.get(Count.toString());
    console.log('一致するソケットID:', targetSocketId);
    if (numberToSocketMap.has(Count.toString())) {
      io.to(targetSocketId).emit('match-success', qrCodeData);
      console.log('一致！送信しました');
    } else {
      console.log('一致する番号なし');
    }
  });

  socket.on('disconnect', () => {
    console.log('切断:', socket.id);
    // 切れたソケットIDを削除
    for (const [number, id] of numberToSocketMap.entries()) {
      if (id === socket.id) {
        numberToSocketMap.delete(number);
        break;
      }
    }
  });
});
// ポート3000番でサーバを起動します。
server.listen(3001, () => {
  console.log('listening on *:3001');
});