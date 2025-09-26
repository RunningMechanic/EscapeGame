'use client';
import React, { useEffect, useState } from "react";
import { Table, Text, Loader, Center, TextInput, Button, Tooltip, ActionIcon, Modal, Group, NumberInput, Badge, Notification, NativeSelect, LoadingOverlay } from '@mantine/core';
import { IconDeviceFloppy, IconRestore, IconQrcode, IconX } from '@tabler/icons-react';
import { RxReload } from "react-icons/rx";
import { FaEyeSlash, FaEye } from "react-icons/fa";
import { IconTrash } from '@tabler/icons-react';
import { useQRCode } from 'next-qrcode';
import './ReceptionControlPage.css';
import { DateTime } from "luxon";
import SearchBox from "./SearchBox";

interface ReceptionData {
    id: number;
    time: string;
    number: number;
    name?: string;
    alignment: boolean;
    gameStartTime?: string;
    gameStarted?: boolean;
    timeTaken?: number | null;
    cancelled?: boolean
    difficulty: string
}

const difficulties = process.env.NEXT_PUBLIC_DIFFICULTY?.split(",") || []

const ReceptionControlPage = () => {
    const [data, setData] = useState<ReceptionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUncheckedOnly, setShowUncheckedOnly] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<ReceptionData | null>(null);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrTarget, setQrTarget] = useState<ReceptionData | null>(null);
    const { Canvas } = useQRCode();
    const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());
    const [savingIds, setSavingIds] = useState<Set<number>>(new Set());

    const [searchText, setSearchText] = useState<string[]>([]);
    const [filteredData, setFilteredData] = useState<ReceptionData[]>()

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/getReceptionList');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('API Response:', result); // デバッグ用

            // 新しいAPIレスポンス形式に対応
            if (result.success && result.data && Array.isArray(result.data)) {
                setData(result.data);
                setFilteredData(result.data)
            } else if (Array.isArray(result)) {
                // 後方互換性のため、直接配列が返される場合も対応
                setData(result);
                setFilteredData(result)
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

    useEffect(() => {
        fetchData();
    }, []);

    // 未保存データがある場合の離脱警告
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (dirtyIds.size > 0) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirtyIds]);

    function matchTime(iso: string, time: string, includeSecond: boolean = true) {
        const a = DateTime.fromISO(iso).setZone("Asia/Tokyo")
        const b = DateTime.fromFormat(time, "H:m")
        return a.hour == b.hour && a.minute == b.minute && (
            includeSecond || a.second == b.second
        )
    }

    function isMatched(reception: ReceptionData, filters: Map<string, string>, filter: string): boolean {
        
        let required = 0
        let include = 0
        // console.log(filters)
        for (const key of Array.from(filters.keys())) {
            const param = filters.get(key)!
            switch (key) {
                case "id":
                    if (!Number.isNaN(param) && reception.id == Number.parseInt(param)) required++
                    break;
                case "time":
                    if (matchTime(reception.time, param)) required++
                    break;
                case "started":
                    if (reception.gameStarted) required++
                    break;
                case "game":
                    if (reception.gameStartTime && matchTime(reception.gameStartTime, param)) required++
                    break;
                case "person":
                    if (!Number.isNaN(param) && reception.number == Number.parseInt(param)) required++
                    break
                default:
                    if (reception.id.toString() == filter) include++
                    if (reception.name?.startsWith(filter)) include++
                    if (DateTime.fromFormat(filter, "H:m").isValid) {
                        if (reception.gameStartTime && matchTime(reception.gameStartTime, filter)) include++
                        if (matchTime(reception.time, filter)) include++
                    }
            }
        }
        // console.log("in:", filters, ", in2:", filter)
        // console.log("reception:", reception)
        // console.log("id: %d, req: %d, inc: %d", reception.id, required, include)
        return (filters.size > 0 && filters.size <= required) || include >= 1
    }

    const searchUpdate = (values: Map<string, string>, raw: string) => {
        if (values.size == 0 && raw == "") {
            setFilteredData(data)
            return
        }
        setFilteredData(data.filter(p => isMatched(p, values, raw)))
    }

    const handleSave = async (row: ReceptionData) => {
        try {
            setSavingIds((prev) => new Set(prev).add(row.id));
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
                // 保存完了した行の未保存フラグを解除
                setDirtyIds((prev) => {
                    const next = new Set(prev);
                    next.delete(row.id);
                    return next;
                });
            }
        } catch (e) {
            console.error(e);
            alert('保存中にエラーが発生しました');
        } finally {
            setSavingIds((prev) => {
                const next = new Set(prev);
                next.delete(row.id);
                return next;
            });
        }
    };

    const handleBulkSave = async () => {
        // 変更のあるIDを固定化
        const targetIds = Array.from(dirtyIds);
        for (const id of targetIds) {
            const row = data.find((r) => r.id === id);
            if (row) {
                // 個別保存を順次実行
                // eslint-disable-next-line no-await-in-loop
                await handleSave(row);
            }
        }
        if (targetIds.length > 0) {
            alert('すべての変更を保存しました');
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
                setDeleteModalOpen(false);
                setDeleteTarget(null);
                await fetchData()
            } else {
                const errorData = await response.json();
                console.error('削除に失敗しました:', errorData.error);
            }
        } catch (error) {
            console.error('削除エラー:', error);
        }
    };

    async function handleCancel(row: ReceptionData) {
        try {
            const response = await fetch('/api/updateReception', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: row.id, cancelled: true }),
            });
            if (!response.ok) {
                const err = await response.json();
                alert('予約キャンセルに失敗しました: ' + (err.error || 'unknown'));
            }
        } catch (e) {
            console.error(e);
            alert('予約キャンセル中にエラーが発生しました');
        } finally {
            await fetchData()
        }
    }

    async function handleChangeDifficulty(row: ReceptionData, difficulty: string) {
        try {
            const response = await fetch('/api/updateReception', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: row.id, difficulty: difficulty }),
            });
            if (!response.ok) {
                const err = await response.json();
                alert('難易度の変更に失敗しました: ' + (err.error || 'unknown'));
            } else {
                setData((prev) => prev.map((r) => r.id === row.id ? { ...r, ...{cancelled: true} } : r));
            }
        } catch (e) {
            console.error(e);
            alert('難易度の変更に失敗しました');
        } finally {
            await fetchData()
        }
    }


    return (
        <div className="reception-control-container">
            <LoadingOverlay visible={loading}></LoadingOverlay>
            <Text size="xl" mb="lg">
                Reception Control
            </Text>
            <div className="guidance-banner">
                <Text size="sm">
                    入力すると行がハイライトされ、フロッピーボタンが有効になります。行の保存、または右上の「変更をすべて保存」で確定できます。
                </Text>
            </div>
            <div className="toolbar">
                <SearchBox onUpdate={searchUpdate} />
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
                <div className="toolbar-right">
                    {dirtyIds.size > 0 && (
                        <Badge color="yellow" variant="filled">未保存: {dirtyIds.size}</Badge>
                    )}
                    <Button
                        variant="filled"
                        color="blue"
                        disabled={dirtyIds.size === 0}
                        onClick={handleBulkSave}
                    >
                        変更をすべて保存
                    </Button>
                </div>
            </div>
            <Table striped highlightOnHover className="data-table">
                <thead>
                    <tr>
                        <th>受付ID</th>
                        <th>開始希望時間</th>
                        <th>人数</th>
                        <th>参加者名</th>
                        <th>スマホ連携</th>
                        <th>難易度</th>
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
                                className={`${row.alignment ? 'checked-row' : ''} ${dirtyIds.has(row.id) ? 'dirty-row' : ''}`.trim()}
                            >
                                <td className="table-cell">
                                    <Group>
                                        {row.id}
                                        {row.cancelled && (<Badge color="red">キャンセル済み</Badge>)}
                                    </Group>
                                </td>
                                <td className="table-cell">
                                    {(() => DateTime.fromISO(row.time).setZone("Asia/Tokyo").toFormat("HH:mm"))()}
                                </td>
                                <td className="table-cell">{row.number}</td>
                                <td className="table-cell">
                                    <TextInput
                                        value={row.name || ''}
                                        placeholder="名前"
                                        onChange={(e) => {
                                            setData((prev) => prev.map((r) => r.id === row.id ? { ...r, name: e.target.value } : r));
                                            setDirtyIds((prev) => new Set(prev).add(row.id));
                                        }}
                                        size="xs"
                                    />
                                </td>
                                <td className="table-cell">{row.alignment ? '済' : '未'}</td>
                                <td className="table-cell">
                                    <NativeSelect onChange={(v) => handleChangeDifficulty(row, v.currentTarget.value)} value={row.difficulty} data={difficulties} />
                                </td>
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
                                        onChange={(val) => {
                                            setData((prev) => prev.map((r) => r.id === row.id ? { ...r, timeTaken: Number(val) } : r));
                                            setDirtyIds((prev) => new Set(prev).add(row.id));
                                        }}
                                    />
                                </td>
                                <td className="table-cell">
                                    <Tooltip label={dirtyIds.has(row.id) ? "保存" : "変更なし"}>
                                        <ActionIcon
                                            color="blue"
                                            size="md"
                                            disabled={!dirtyIds.has(row.id) || savingIds.has(row.id)}
                                            onClick={() => handleSave(row)}
                                            mr={4}
                                        >
                                            <IconDeviceFloppy size="1.25rem" />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="タイマーリセット">
                                        <ActionIcon color="orange" size="md" onClick={() => handleResetTimer(row.id)} mr={4}>
                                            <IconRestore size="1.25rem" />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="QR表示">
                                        <ActionIcon color="grape" size="md" onClick={() => { setQrTarget(row); setQrModalOpen(true); }} mr={4}>
                                            <IconQrcode size="1.25rem" />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="キャンセル">
                                        <ActionIcon color="yellow" size="md" onClick={() => { handleCancel(row) }} mr={4}>
                                            <IconX size="1.25rem" />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="削除">
                                        <ActionIcon
                                            color="red"
                                            size="md"
                                            onClick={() => handleDeleteClick(row)}
                                        >
                                            <IconTrash size="1.25rem" />
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
                opened={qrModalOpen}
                onClose={() => setQrModalOpen(false)}
                title={qrTarget ? `チェック用QR（ID: ${qrTarget.id}）` : 'チェック用QR'}
                centered
            >
                {qrTarget ? (
                    <QRForId id={qrTarget.id} Canvas={Canvas} />
                ) : (
                    <Text>行をクリックして対象を選択してください。</Text>
                )}
            </Modal>

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

const QRForId = ({ id, Canvas }: { id: number; Canvas: any }) => {
    const [url, setUrl] = React.useState<string | null>(null);
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch(`/api/getCheckUrl?id=${id}`);
                const data = await res.json();
                if (mounted) setUrl(data?.url || null);
            } catch {
                if (mounted) setUrl(null);
            }
        })();
        return () => { mounted = false; };
    }, [id]);
    if (!url) return <Text>読み込み中...</Text>;
    return <Canvas text={url} options={{ width: 220 }} />;
};