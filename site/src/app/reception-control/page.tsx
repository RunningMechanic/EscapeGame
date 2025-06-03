'use client';

import React, { useEffect, useState } from "react";
import { Table, Text, Loader, Center, TextInput, Button, Tooltip, Switch } from '@mantine/core';
import './ReceptionControlPage.css'; // CSSファイルをインポート
import { RxReload } from "react-icons/rx";
interface ReceptionData {
    id: number;
    start: string;
    count: number;
    check: boolean;
}

const ReceptionControlPage = () => {
    const [data, setData] = useState<ReceptionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/getReceptionList', {
                method: 'GET',
            });
            if (!response.ok) {
                throw new Error('API呼び出しに失敗しました');
            }
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('APIエラー:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = data.filter((row) =>
        Object.values(row).some((value) =>
            value.toString().toLowerCase().includes(searchText.toLowerCase())
        )
    );

    const handleToggle = (id: number) => {
        setData((prevData) =>
            prevData.map((row) =>
                row.id === id ? { ...row, check: !row.check } : row
            )
        );
    };

    if (loading) {
        return (
            <Center className="loading-container">
                <Loader size="lg" />
            </Center>
        );
    }

    return (
        <div className="reception-control-container">
            <Text size="xl" mb="lg">
                Reception Control
            </Text>
            <div className="toolbar">
                <TextInput
                    placeholder="Search..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="search-input"
                />
                <Tooltip label="Reload Data">
                    <Button className="toolbar-button" onClick={fetchData}>
                        <RxReload />
                    </Button>
                </Tooltip>
            </div>
            <Table striped highlightOnHover className="data-table">
                <thead>
                    <tr>
                        <th>受付ID</th>
                        <th>開始希望時間</th>
                        <th>人数</th>
                        <th>受付チェック</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((row) => (
                        <tr key={row.id}>
                            <td className="table-cell">{row.id}</td>
                            <td className="table-cell">{row.start}</td>
                            <td className="table-cell">{row.count}</td>
                            <td className="table-cell">
                                <Switch
                                    checked={row.check}
                                    onChange={() => handleToggle(row.id)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default ReceptionControlPage;