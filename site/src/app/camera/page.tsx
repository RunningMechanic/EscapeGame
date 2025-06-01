'use client';

import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import io from 'socket.io-client';
import { Box, Text } from '@mantine/core';
import './CameraPage.css'; // CSSファイルをインポート

const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'fallback_ws_url_if_needed'); // サーバURL

const CameraPage = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
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

    const interval = setInterval(scanQRCode, 500);
    return () => clearInterval(interval);
  }, [count, qrCodeData]);

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
        console.log('APIレスポンス:', data);
      } catch (error) {
        console.error('列数の取得中にエラーが発生しました:', error);
      }
    };

    fetchcount();
  }, []);

  return (
    <Box className="camera-page-container">
      <Text className="camera-page-header">QRコードをカメラに近づけてね</Text>
      <Box className="camera-page-video-container">
        <video ref={videoRef} className="camera-page-video" autoPlay playsInline muted />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </Box>
      {qrCodeData && (
        <Box className="camera-page-qr-data">
          <Text className="camera-page-qr-title">読み取ったQRコード:</Text>
          <Text>{qrCodeData}</Text>
        </Box>
      )}
      {count !== null && (
        <Box className="camera-page-device-number">
          <Text className="camera-page-device-text">機器の番号：{count}</Text>
        </Box>
      )}
    </Box>
  );
};

export default CameraPage;