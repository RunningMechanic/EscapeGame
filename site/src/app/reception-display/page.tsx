'use client';
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Button, Text } from '@mantine/core';

const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'); // Fallback追加

const ReceptionDisplay: React.FC = () => {
    const [isNumberEntered, setIsNumberEntered] = useState(false);
    const [number, setNumber] = useState<string>('');

    const handleNumberSubmit = () => {
        if (number.trim() === '') {
            alert('番号を入力してください');
        } else if (!/^\d+$/.test(number)) {
            alert('番号は数字のみで入力してください');
        } else {
            socket.emit('register-number', number);
            setIsNumberEntered(true);
        }
    };

    useEffect(() => {
        socket.on("match-success", (qrCodeData) => {
            console.log("QRコードデータ:", qrCodeData);
        });
    }, []);

    return (
        <div>
            {!isNumberEntered ? (
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
                <div
                    style={{
                        textAlign: 'center',
                        paddingTop: '100px',
                    }}
                >
                    <Button
                        variant="filled"
                        color="blue"
                        size="md"
                        radius="xl"
                        // style={{
                        //     width: '300px',
                        //     margin: '20px auto',
                        //     fontSize: '1.5rem',
                        //     backgroundColor: '#4caf50',
                        //     display: 'block',
                        // }}
                        onClick={() => {
                            console.log('受付処理を実行しました');
                        }}
                    >
                        受付する
                    </Button>
                    <Text
                        style={{
                            position: 'fixed',
                            bottom: '20px',
                            right: '20px',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: 'gray',
                        }}
                    >
                        No.{number}
                    </Text>
                </div>
            )}
        </div>
    );
};

export default ReceptionDisplay;
