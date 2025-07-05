'use client';
import React, { useEffect, useState } from "react";
import { Table, Text, Loader, Center, TextInput, Button, Tooltip, Switch, ActionIcon, Modal, Group } from '@mantine/core';
import { RxReload } from "react-icons/rx";
import { FaEyeSlash, FaEye } from "react-icons/fa";
import { IconTrash } from '@tabler/icons-react';
import './ReceptionControlPage.css';

interface ReceptionData {
    id: number;
    start: string;
    count: number;
    checker: boolean;
}

const ReceptionControlPage = () => {
    const [data, setData] = useState<ReceptionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [showUncheckedOnly, setShowUncheckedOnly] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<ReceptionData | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/getReceptionList');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('APIエラー:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filteredData = data.filter((row) =>
        Object.values(row).some((value) =>
            value.toString().toLowerCase().includes(searchText.toLowerCase())
        ) && (!showUncheckedOnly || !row.checker)
    );

    const handleToggle = async (id: number) => {
        const target = data.find((row) => row.id === id);
        if (!target) return;
        const newCheck = !target.checker;
        setData((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, checker: newCheck } : row
            )
        );
        // APIで保存
        await fetch('/api/updateCheck', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, check: newCheck }),
        });
    };

    const handleDeleteClick = (row: ReceptionData) => {
        setDeleteTarget(row);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;

        try {
            const response = await fetch('/api/deleteReception', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: deleteTarget.id }),
            });

            if (response.ok) {
                // 成功したらデータから削除
                setData((prev) => prev.filter((row) => row.id !== deleteTarget.id));
                setDeleteModalOpen(false);
                setDeleteTarget(null);
            } else {
                console.error('削除に失敗しました');
            }
        } catch (error) {
            console.error('削除エラー:', error);
        }
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
                <Tooltip label={showUncheckedOnly ? "全員表示" : "未チェックのみ表示"}>
                    <ActionIcon
                        color={showUncheckedOnly ? "orange" : "gray"}
                        size="lg"
                        onClick={() => setShowUncheckedOnly((v) => !v)}
                    >
                        {showUncheckedOnly ? <FaEye /> : <FaEyeSlash />}
                    </ActionIcon>
                </Tooltip>
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
                        <th>来場済み</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((row) => (
                        <tr
                            key={row.id}
                            className={row.checker ? "checked-row" : ""}
                        >
                            <td className="table-cell">{row.id}</td>
                            <td className="table-cell">{row.start}</td>
                            <td className="table-cell">{row.count}</td>
                            <td className="table-cell">
                                <Switch
                                    checked={row.checker}
                                    onChange={() => handleToggle(row.id)}
                                />
                            </td>
                            <td className="table-cell">
                                <Tooltip label="操作">
                                    <ActionIcon
                                        color="red"
                                        size="sm"
                                        onClick={() => handleDeleteClick(row)}
                                    >
                                        <IconTrash size="1rem" />
                                    </ActionIcon>
                                </Tooltip>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal
                opened={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setDeleteTarget(null);
                }}
                title="削除の確認"
                centered
            >
                <Text mb="lg">
                    ID: {deleteTarget?.id} の受付データを削除しますか？
                    <br />
                    この操作は取り消せません。
                </Text>
                <Group justify="flex-end">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setDeleteModalOpen(false);
                            setDeleteTarget(null);
                        }}
                    >
                        キャンセル
                    </Button>
                    <Button
                        color="red"
                        onClick={handleDeleteConfirm}
                    >
                        削除
                    </Button>
                </Group>
            </Modal>
        </div>
    );
};

export default ReceptionControlPage;