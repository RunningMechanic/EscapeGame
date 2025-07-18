'use client';

import React from "react";
import { Button, Group } from '@mantine/core';
import { useRouter } from 'next/navigation';
import classes from '../modules/style.module.css';
const EntryPage = () => {
    const router = useRouter();

    return (
        <div>
            <Group grow>
                <Button
                    className={classes.entryButton}
                    color="teal"
                    onClick={() => router.push('/reception/precaution')}
                >
                    受付する
                </Button>

                <Button
                    className={classes.entryButton}
                    color="indigo"
                    onClick={() => router.push('/check-in')}
                >
                    予約を確認する
                </Button>
            </Group>
        </div>
    );
};

export default EntryPage;
