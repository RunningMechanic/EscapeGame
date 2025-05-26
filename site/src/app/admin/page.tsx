'use client';
import React, { useState } from 'react';
import Link from 'next/link'; // Next.js の Link コンポーネントをインポート

const AdminPage = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const buttonLabels = [
    { label: 'カメラ', href: '/camera' },
    { label: '受付表示', href: '/reception-display' },
    { label: '受付操作', href: '/reception-control' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        margin: 0,
      }}
    >
      {buttonLabels.map((button, index) => (
        <Link key={index} href={button.href} passHref>
          <button
            style={{
              width: '200px',
              height: '50px',
              margin: '10px 0',
              color: '#333',
              fontWeight: 'bold',
              fontSize: '1.5rem',
              border: '1px solid',
              borderRadius: '5px',
              boxSizing: 'border-box',
              cursor: 'pointer',
              backgroundColor: hoveredIndex === index ? 'green' : 'white',
              borderColor: hoveredIndex === index ? '#888' : '#ccc',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {button.label}
          </button>
        </Link>
      ))}
    </div>
  );
};

export default AdminPage;