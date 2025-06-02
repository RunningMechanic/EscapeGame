'use client';

import React from "react";
import { Button, Group } from '@mantine/core';
import { useRouter } from 'next/navigation';
import './EntryPage.css';

const EntryPage = () => {
    const router = useRouter();

    return (
        <div>
            <Group grow>
                <Button
                    className="button"
                    color="teal"
                    onClick={() => router.push('/reception/guest-count')}
                >
                    受付する
                </Button>

                <Button
                    className="button"
                    color="indigo"
                    onClick={() => router.push('/reservation')}
                >
                    予約を確認する
                </Button>
            </Group>
        </div>
    );
};

export default EntryPage;
