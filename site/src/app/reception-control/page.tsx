'use client';
import React, { useState } from 'react';

const ReceptionControl: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');

    const toggleReception = () => {
        setIsOpen(!isOpen);
        setMessage(isOpen ? '受付を閉じました。' : '受付を開きました。');
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>受付管理</h1>
            <button
                onClick={toggleReception}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    backgroundColor: isOpen ? '#f44336' : '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                }}
            >
                {isOpen ? '受付を閉じる' : '受付を開く'}
            </button>
            {message && <p style={{ marginTop: '20px', fontSize: '18px' }}>{message}</p>}
        </div>
    );
};

export default ReceptionControl;