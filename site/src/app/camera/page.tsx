'use client';
import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import io from 'socket.io-client';
import { config } from 'dotenv';
// .env ファイルの読み込み
config();
const socket = io(process.env.NEXT_PUBLIC_WS_URL); // サーバURL
const CameraPage = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null); // 列数＋1を格納するステート


  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }, // 背面カメラを優先
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        console.error('カメラの起動に失敗しました:', error);
      }
    };

    startCamera();
  }, []);

  useEffect(() => {
    const scanQRCode = () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // 動画が準備完了しているか確認
        if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data !== qrCodeData) {
            setQrCodeData(code.data);
            socket.emit('scan-qr', { count, qrCodeData });
          }
        }
      }
    };

    const interval = setInterval(scanQRCode, 500); // 500msごとにQRコードをスキャン
    return () => clearInterval(interval);
  }, [count, qrCodeData]);

  // qrCodeData が変更されたときにログを出力
  useEffect(() => {
    if (qrCodeData) {
      console.log('QRコードが変更されました:', qrCodeData);
    }
  }, [qrCodeData]);
  useEffect(() => {
    const fetchcount = async () => {
      try {
        const response = await fetch('/api/counter');
        if (!response.ok) {
          throw new Error('Failed to fetch column count');
        }
        const data = await response.json();
        setCount(data.count);
        console.log('APIレスポンス:', data); // レスポンスを確認
      } catch (error) {
        console.error('列数の取得中にエラーが発生しました:', error);
      }
    };

    fetchcount();
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#000', // 背景を黒に設定
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#fff',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          textShadow: '0 0 5px rgba(0, 0, 0, 0.5)',
        }}
      >
        QRコードをカメラに近づけてね
      </div>
      <div
        style={{
          position: 'relative',
          width: '70%',
          height: '70%',
          border: '3px solid green',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover', // 画面全体を埋めるように調整
          }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      {qrCodeData && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            textAlign: 'center',
            color: '#fff', // テキストを白に設定
          }}
        >
          <h2>読み取ったQRコード:</h2>
          <p>{qrCodeData}</p>
        </div>
      )}
      {/* 列数＋1を表示 */}
      {count !== null && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            textAlign: 'center',
            color: '#fff',
            fontSize: '3.0rem',
            fontWeight: 'bold',
          }}
        >
          <p>機器の番号：{count}</p>
        </div>
      )}
    </div>
  );
};

export default CameraPage;