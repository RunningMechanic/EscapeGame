'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@mantine/core';

const AdminPage = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const buttonLabels = [
    { label: 'カメラ', href: '/camera' },
    { label: '受付表示', href: '/reception-display' },
    { label: '受付操作', href: '/reception-control' },
  ];

  const getBackgroundColor = (index: number) => {
    return hoveredIndex === index ? 'teal' : 'white';
  };

  const getTextColor = (index: number) => {
    return hoveredIndex === index ? 'white' : 'black';
  };

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
        <Button
          key={index}
          size="xl"
          variant="filled"
          component={Link}
          href={button.href}
          style={{
            width: '600px',
            margin: '30px 0',
            fontSize: '5rem',
            backgroundColor: getBackgroundColor(index),
            color: getTextColor(index),
            transition: 'all 0.3s ease',
            fontWeight: 'bold',
            textAlign: 'center',
            borderRadius: '1rem'
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {button.label}
        </Button>
      ))}
    </div>
  );
};

export default AdminPage;
