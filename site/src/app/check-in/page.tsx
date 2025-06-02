'use client';

import React from "react";
import { Button, Text, Group } from '@mantine/core';
import { useRouter } from 'next/navigation';
import classes from '../modules/style.module.css';
const EntryPage = () => {
    const router = useRouter();

    return (
        <div>
            <Text size="xl" className="row-text">人数を選んでね</Text>

            <Group grow>
                <Button
                    className={classes.entryButton}
                    color="teal"
                    onClick={() => router.push('/camera')}
                >
                    カメラ
                </Button>

                <Button
                    className={classes.entryButton}
                    color="indigo"
                    onClick={() => router.push('/check2')}
                >
                    受付番号
                </Button>
            </Group>
        </div>
    );
};

export default EntryPage;
