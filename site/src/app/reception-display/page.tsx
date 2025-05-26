'use client';
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { config } from 'dotenv';
// .env ファイルの読み込み
config();
const socket = io(process.env.NEXT_PUBLIC_WS_URL); // サーバURL
const ReceptionDisplay: React.FC = () => {
    const [isNumberEntered, setIsNumberEntered] = useState(false); // 番号入力が完了したかどうかの状態
    const [number, setNumber] = useState<string>(''); // 入力された番号
    const handleNumberSubmit = () => {
        if (number.trim() === '') {
            alert('番号を入力してください');
        } else if (!/^\d+$/.test(number)) {
            alert('番号は数字のみで入力してください');
        } else {
            socket.emit('register-number', number);
            setIsNumberEntered(true); // 番号入力が完了したらメインコンテンツを表示
        }
    };
    useEffect(() => {
        socket.on("match-success", (qrCodeData) => { console.log("QRコードデータ:", qrCodeData);})
    }, []);
    return (
        <div>
            {!isNumberEntered ? (
                // 番号入力ウィンドウ
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                    }}
                >
                    <h2>ペアとなる機器の番号を入力してください</h2>
                    <input
                        type="text"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="番号を入力"
                        style={{
                            padding: '10px',
                            fontSize: '16px',
                            marginBottom: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                        }}
                    />
                    <button
                        onClick={handleNumberSubmit}
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            backgroundColor: '#007bff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                        }}
                    >
                        確定
                    </button>
                </div>
            ) : (
                // メインコンテンツ
                <div>
                    <h1>受付ディスプレイ</h1>
                    <p>ここに受付情報を表示します。</p>
                    <p>入力された番号: {number}</p>
                </div>
            )}
        </div>
    );
};

export default ReceptionDisplay;