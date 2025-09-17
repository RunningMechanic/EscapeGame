'use client';
import React, { useEffect, useState } from "react";
import { Table, Text, Loader, Center, TextInput, Button, Tooltip, ActionIcon, Modal, Group, NumberInput } from '@mantine/core';
import { IconDeviceFloppy, IconRestore } from '@tabler/icons-react';
import { RxReload } from "react-icons/rx";
import { FaEyeSlash, FaEye } from "react-icons/fa";
import { IconTrash } from '@tabler/icons-react';
import './ReceptionControlPage.css';

interface ReceptionData {
    id: number;
    time: string;
    number: number;
    name?: string;
    alignment: boolean;
    gameStartTime?: string;
    gameStarted?: boolean;
    timeTaken?: number | null;
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
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('API Response:', result); // デバッグ用

            // 新しいAPIレスポンス形式に対応
            if (result.success && result.data && Array.isArray(result.data)) {
                setData(result.data);
            } else if (Array.isArray(result)) {
                // 後方互換性のため、直接配列が返される場合も対応
                setData(result);
            } else {
                console.error('Unexpected API response format:', result);
                setData([]);
            }
        } catch (error) {
            console.error('APIエラー:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // データが配列であることを確認してからフィルタリング
    const filteredData = Array.isArray(data) ? data.filter((row) =>
        Object.values(row).some((value) =>
            value?.toString().toLowerCase().includes(searchText.toLowerCase())
        ) && (!showUncheckedOnly || !row.alignment)
    ) : [];

    const handleSave = async (row: ReceptionData) => {
        try {
            const response = await fetch('/api/updateReception', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: row.id, name: row.name ?? null, timeTaken: row.timeTaken ?? null }),
            });
            if (!response.ok) {
                const err = await response.json();
                alert('保存に失敗しました: ' + (err.error || 'unknown'));
            } else {
                const result = await response.json();
                setData((prev) => prev.map((r) => r.id === row.id ? { ...r, ...result.participant } : r));
            }
        } catch (e) {
            console.error(e);
            alert('保存中にエラーが発生しました');
        }
    };

    const handleResetTimer = async (id: number) => {
        try {
            const response = await fetch('/api/resetTimer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participantId: id }),
            });
            if (!response.ok) {
                const err = await response.json();
                alert('リセットに失敗しました: ' + (err.error || 'unknown'));
            } else {
                const result = await response.json();
                setData((prev) => prev.map((r) => r.id === id ? { ...r, ...result.participant } : r));
            }
        } catch (e) {
            console.error(e);
            alert('リセット中にエラーが発生しました');
        }
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
                body: JSON.stringify({ id: deleteTarget.id }), // 管理画面なのでトークンなし
            });

            if (response.ok) {
                // 成功したらデータから削除
                setData((prev) => prev.filter((row) => row.id !== deleteTarget.id));
                setDeleteModalOpen(false);
                setDeleteTarget(null);
            } else {
                const errorData = await response.json();
                console.error('削除に失敗しました:', errorData.error);
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
                        <th>参加者名</th>
                        <th>来場済み</th>
                        <th>ゲーム開始時間</th>
                        <th>タイム</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(filteredData) && filteredData.length > 0 ? (
                        filteredData.map((row) => (
                            <tr
                                key={row.id}
                                className={row.alignment ? "checked-row" : ""}
                            >
                                <td className="table-cell">{row.id}</td>
                                <td className="table-cell">
                                    {(() => {
                                        const date = new Date(row.time);
                                        const hours = date.getHours().toString().padStart(2, '0');
                                        const minutes = date.getMinutes().toString().padStart(2, '0');
                                        return `${hours}:${minutes}`;
                                    })()}
                                </td>
                                <td className="table-cell">{row.number}</td>
                                <td className="table-cell">
                                    <TextInput
                                        value={row.name || ''}
                                        placeholder="名前"
                                        onChange={(e) => setData((prev) => prev.map((r) => r.id === row.id ? { ...r, name: e.target.value } : r))}
                                        size="xs"
                                    />
                                </td>
                                <td className="table-cell">{row.alignment ? '済' : '未'}</td>
                                <td className="table-cell">
                                    {row.gameStartTime
                                        ? (() => {
                                            const date = new Date(row.gameStartTime);
                                            const hours = date.getHours().toString().padStart(2, '0');
                                            const minutes = date.getMinutes().toString().padStart(2, '0');
                                            return `${hours}:${minutes}`;
                                        })()
                                        : '-'}
                                </td>
                                <td className="table-cell">
                                    <NumberInput
                                        value={row.timeTaken ?? undefined}
                                        placeholder="秒"
                                        min={0}
                                        step={1}
                                        size="xs"
                                        onChange={(val) => setData((prev) => prev.map((r) => r.id === row.id ? { ...r, timeTaken: Number(val) } : r))}
                                    />
                                </td>
                                <td className="table-cell">
                                    <Tooltip label="保存">
                                        <ActionIcon color="blue" size="sm" onClick={() => handleSave(row)}>
                                            <IconDeviceFloppy size="1rem" />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="タイマーリセット">
                                        <ActionIcon color="orange" size="sm" onClick={() => handleResetTimer(row.id)}>
                                            <IconRestore size="1rem" />
                                        </ActionIcon>
                                    </Tooltip>
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
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                                {loading ? 'データを読み込み中...' : 'データが見つかりません'}
                            </td>
                        </tr>
                    )}
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