'use client';
import { Button, Box } from '@mantine/core';
import Link from 'next/link';
import './AdminPage.css';

const AdminPage = () => {
  const buttonLabels = [
    { label: '受付画面', href: '/entry' },
    { label: '受付操作', href: '/reception-control' },
    { label: 'タイマー管理', href: '/admin/start-stop' },
    { label: 'ランキング', href: '/ranking' },
  ];

  return (
    <Box className="admin-page-container">
      {buttonLabels.map((button, index) => (
        <Button
          key={index}
          component={Link}
          href={button.href}
          variant="filled"
          w="600px"
          h="100px"
          m="30px 0"
          fz="5rem"
          fw="bold"
          ta="center"
          radius="1rem"
          className='button'
        >
          {button.label}
        </Button>
      ))}
    </Box>
  );
};

export default AdminPage;
