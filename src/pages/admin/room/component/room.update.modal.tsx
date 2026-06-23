import React, { useEffect, useMemo, useState } from 'react';
import {
    Form,
    Input,
    Select,
    InputNumber,
    Button,
    Card,
    Typography,
    message,
    Row,
    Col,
    Space,
    Divider,
    Alert,
    Modal,
    Spin, notification,
} from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import {
    RoomStatus,
    RoomType,
    ROOM_STATUS_LABELS,
    ROOM_TYPE_LABELS,
    SEAT_TYPE_LABELS,
} from '@/types/room.types.ts';
import type { RoomDetailDTO, SeatDTO, SeatTypeType } from '@/types/room.types.ts';
import { roomService } from '@/services/room.service.ts';

const { Text } = Typography;
const { Option } = Select;

const MAX_ROWS = 10;
const MAX_COLS = 30;

const getDefaultSeatType = (
    rowLetter: string,
    seatNo: number,
    totalCols: number,
): SeatTypeType => {
    if (rowLetter >= 'D' && rowLetter <= 'H') return 'VIP';
    if (rowLetter === 'J') {
        if (seatNo === totalCols && totalCols % 2 !== 0) return 'STANDARD';
        return 'SWEETBOX';
    }
    return 'STANDARD';
};

const seatColor: Record<string, string> = {
    STANDARD: '#d9d9d9',
    VIP: '#ffd666',
    SWEETBOX: '#ff85c0',
};

const seatKey = (row: string, no: number) => `${row}-${no}`;
const pairSeatNo = (seatNo: number): number => (seatNo % 2 === 1 ? seatNo + 1 : seatNo - 1);

interface SeatCell {
    id?: number;
    type: SeatTypeType;
}

interface RoomUpdateModalProps {
    open: boolean;
    roomId: number | undefined;
    onClose: () => void;
    onSuccess: () => void;
}

const RoomUpdateForm: React.FC<RoomUpdateModalProps> = ({ open, roomId, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    const totalRows = Form.useWatch('totalRows', form);
    const totalCols = Form.useWatch('totalCols', form);

    const [activeType, setActiveType] = useState<SeatTypeType>('STANDARD');
    const [seatTypes, setSeatTypes] = useState<Record<string, SeatCell>>({});
    const [api, contextHolder] = notification.useNotification();

    const rows = Number(totalRows) || 0;
    const cols = Number(totalCols) || 0;

    const rowLetters = useMemo(
        () => Array.from({ length: rows }, (_, i) => String.fromCharCode('A'.charCodeAt(0) + i)),
        [rows],
    );

    // Load room detail whenever the modal opens with a room id
    useEffect(() => {
        if (!open || roomId == null) return;

        const load = async () => {
            setFetching(true);
            try {
                const res = await roomService.fetchRoomDetail(roomId);
                const detail = res.data;

                const seats = detail.seats ?? [];

                // Backend doesn't return totalRows/totalCols directly — derive from seat list
                const derivedRows = seats.length
                    ? Math.max(...seats.map((s) => s.seatRow.charCodeAt(0) - 'A'.charCodeAt(0) + 1))
                    : 0;
                const derivedCols = seats.length ? Math.max(...seats.map((s) => s.seatNo)) : 0;

                form.setFieldsValue({
                    name: detail.name,
                    status: detail.status,
                    type: detail.type,
                    totalRows: derivedRows || undefined,
                    totalCols: derivedCols || undefined,
                });

                const map: Record<string, SeatCell> = {};
                seats.forEach((s) => {
                    map[seatKey(s.seatRow, s.seatNo)] = { id: s.id, type: s.type as SeatTypeType };
                });
                setSeatTypes(map);
            } catch (error: any) {
                message.error('No loading data for room, try again later');
                onClose?.();
            } finally {
                setFetching(false);
            }
        };

        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, roomId]);

    // Reset everything when the modal closes
    useEffect(() => {
        if (!open) {
            form.resetFields();
            setSeatTypes({});
            setActiveType('STANDARD');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Whenever rows/cols change (e.g. user resizes the grid), fill in any
    // newly-added seats with the default rule while keeping existing ones (incl. their id).
    useEffect(() => {
        if (rows <= 0 || cols <= 0) return;
        setSeatTypes((prev) => {
            const next: Record<string, SeatCell> = {};
            rowLetters.forEach((rowLetter) => {
                for (let no = 1; no <= cols; no++) {
                    const key = seatKey(rowLetter, no);
                    next[key] = prev[key] ?? { type: getDefaultSeatType(rowLetter, no, cols) };
                }
            });
            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, cols]);

    const totalSeats = rows * cols;

    const handleSeatClick = (rowLetter: string, seatNo: number) => {
        const key = seatKey(rowLetter, seatNo);
        const current = seatTypes[key] ?? { type: getDefaultSeatType(rowLetter, seatNo, cols) };

        const isLastSeatOfOddRow = cols % 2 !== 0 && seatNo === cols;
        if (activeType === 'SWEETBOX' && isLastSeatOfOddRow) {
            message.warning(
                `A seat ${rowLetter}${seatNo} is last seat in row, cannot set this seat is sweetbox!`,
            );
            return;
        }

        setSeatTypes((prev) => {
            const next = { ...prev };
            const partnerNo = pairSeatNo(seatNo);
            const hasValidPartner = partnerNo >= 1 && partnerNo <= cols;
            const partnerKey = hasValidPartner ? seatKey(rowLetter, partnerNo) : null;
            const partnerCurrent = partnerKey
                ? prev[partnerKey] ?? { type: getDefaultSeatType(rowLetter, partnerNo, cols) }
                : null;

            next[key] = { ...current, type: activeType };

            if (activeType === 'SWEETBOX') {
                if (partnerKey && partnerCurrent) {
                    next[partnerKey] = { ...partnerCurrent, type: activeType };
                }
            } else if (
                current.type === 'SWEETBOX' &&
                partnerKey &&
                partnerCurrent?.type === 'SWEETBOX'
            ) {
                next[partnerKey] = { ...partnerCurrent, type: activeType };
            }

            return next;
        });
    };

    const handleResetDefaults = () => {
        const next: Record<string, SeatCell> = {};
        rowLetters.forEach((rowLetter) => {
            for (let no = 1; no <= cols; no++) {
                const key = seatKey(rowLetter, no);
                next[key] = { id: seatTypes[key]?.id, type: getDefaultSeatType(rowLetter, no, cols) };
            }
        });
        setSeatTypes(next);
        message.success('Reset seat defaults successfully');
    };

    const onFinish = async (values: any) => {
        if (roomId == null) return;
        if (rows <= 0 || cols <= 0) {
            message.error('Input number of row and seat/row');
            return;
        }

        const seats: SeatDTO[] = [];
        rowLetters.forEach((rowLetter) => {
            for (let no = 1; no <= cols; no++) {
                const cell = seatTypes[seatKey(rowLetter, no)];
                seats.push({
                    id: cell?.id,
                    seatRow: rowLetter,
                    seatNo: no,
                    type: cell?.type ?? getDefaultSeatType(rowLetter, no, cols),
                });
            }
        });

        setLoading(true);
        try {
            const payload: RoomDetailDTO = {
                id: roomId,
                name: values.name.trim(),
                status: values.status,
                type: values.type,
                totalRows: values.totalRows,
                totalCols: values.totalCols,

                seats,
            };

            const res = await roomService.updateRoom(payload);
            const updated = res.data;
            api.success({
                message: `Update room "${updated.name}" success!`,
                placement: 'topRight',
            });
            onSuccess?.();
            onClose?.();
        } catch (error: any) {
            api.error({ message: 'Update failure!', placement: 'topRight', description: error.response?.data?.message });

        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {contextHolder}
            <Modal
                title="Update room"
                open={open}
                onCancel={onClose}
                footer={null}
                width={1200}
                destroyOnClose
            >
                <Spin spinning={fetching}>
                    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                            Update room information and seating chart. Click on a seat to assign the selected seat type.
                            Sweetboxes are automatically paired (A1 ↔ A2, A3 ↔ A4, …).
                        </Text>

                        <Row gutter={24}>
                            {/* ── Left: form ── */}
                            <Col xs={24} md={11}>
                                <Card title="Room information">
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        onFinish={onFinish}
                                        requiredMark="optional"
                                        validateTrigger={['onBlur', 'onChange']}
                                    >
                                        <Form.Item
                                            name="name"
                                            label="Name"
                                            rules={[
                                                { required: true, message: 'Please input room name!' },
                                                { max: 50, message: 'Room name max 50 characters!' },
                                            ]}
                                        >
                                            <Input placeholder="VD: Room 01" />
                                        </Form.Item>

                                        <Form.Item
                                            name="type"
                                            label="Room type"
                                            rules={[{ required: true, message: 'Please select room type!' }]}
                                        >
                                            <Select placeholder="Select room type">
                                                {Object.values(RoomType).map((t) => (
                                                    <Option key={t} value={t}>
                                                        {ROOM_TYPE_LABELS[t] ?? t}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>

                                        <Form.Item
                                            name="status"
                                            label="Status"
                                            rules={[{ required: true, message: 'Please select room status!' }]}
                                        >
                                            <Select placeholder="Select status">
                                                {Object.values(RoomStatus).map((s) => (
                                                    <Option key={s} value={s}>
                                                        {ROOM_STATUS_LABELS[s] ?? s}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>

                                        <Divider />

                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="totalRows"
                                                    label="Row of seat"
                                                    rules={[
                                                        { required: true, message: 'Please input row of seat!' },
                                                        {
                                                            type: 'number',
                                                            min: 1,
                                                            max: MAX_ROWS,
                                                            message: `From 1 to ${MAX_ROWS} row!`,
                                                        },
                                                    ]}
                                                >
                                                    <InputNumber
                                                        min={1}
                                                        max={MAX_ROWS}
                                                        style={{ width: '100%' }}
                                                        placeholder="VD: 10"
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="totalCols"
                                                    label="Seat / col"
                                                    rules={[
                                                        { required: true, message: 'Please input seat on col' },
                                                        {
                                                            type: 'number',
                                                            min: 1,
                                                            max: MAX_COLS,
                                                            message: `From 1 to ${MAX_COLS} seat!`,
                                                        },
                                                    ]}
                                                >
                                                    <InputNumber
                                                        min={1}
                                                        max={MAX_COLS}
                                                        style={{ width: '100%' }}
                                                        placeholder="VD: 12"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        {totalSeats > 0 && (
                                            <Alert
                                                type="info"
                                                showIcon
                                                style={{ marginBottom: 16 }}
                                                message={`Total seats: ${totalSeats}`}
                                            />
                                        )}

                                        {totalRows && totalCols && (
                                            <Alert
                                                type="warning"
                                                showIcon
                                                style={{ marginBottom: 16 }}
                                                message="Changing the row/seat numbers may create new seats or remove old ones. Please double-check the floor plan before saving."
                                            />
                                        )}

                                        <Form.Item shouldUpdate style={{ marginTop: 8, marginBottom: 0 }}>
                                            {() => {
                                                const hasErrors = form
                                                    .getFieldsError()
                                                    .some(({ errors }) => errors.length > 0);
                                                const required = ['name', 'type', 'status', 'totalRows', 'totalCols'];
                                                const allFilled = required.every((f) => {
                                                    const v = form.getFieldValue(f);
                                                    return v !== undefined && v !== null && v !== '';
                                                });

                                                return (
                                                    <Button
                                                        type="primary"
                                                        htmlType="submit"
                                                        icon={<SaveOutlined />}
                                                        loading={loading}
                                                        disabled={hasErrors || !allFilled || fetching}
                                                        block
                                                    >
                                                        Save changes
                                                    </Button>
                                                );
                                            }}
                                        </Form.Item>
                                    </Form>
                                </Card>
                            </Col>

                            {/* ── Right: seating chart ── */}
                            <Col xs={24} md={13}>
                                <Card
                                    title="Seating chart"
                                    extra={
                                        <Button
                                            size="small"
                                            icon={<ReloadOutlined />}
                                            onClick={handleResetDefaults}
                                            disabled={rows <= 0 || cols <= 0}
                                        >
                                            Reset
                                        </Button>
                                    }
                                >
                                    {rows <= 0 || cols <= 0 ? (
                                        <Text type="secondary">Loading seating chart...</Text>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                    marginBottom: 16,
                                                }}
                                            >
                                                <Text style={{ whiteSpace: 'nowrap' }}>Seat type choosing:</Text>
                                                <Select
                                                    value={activeType}
                                                    onChange={(value: SeatTypeType) => setActiveType(value)}
                                                    style={{ minWidth: 180 }}
                                                >
                                                    {Object.entries(SEAT_TYPE_LABELS).map(([key, label]) => (
                                                        <Option key={key} value={key}>
                                                            <Space size={6}>
                                                            <span
                                                                style={{
                                                                    display: 'inline-block',
                                                                    width: 10,
                                                                    height: 10,
                                                                    borderRadius: 2,
                                                                    background: seatColor[key],
                                                                }}
                                                            />
                                                                {label}
                                                            </Space>
                                                        </Option>
                                                    ))}
                                                </Select>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    Click seat for this type
                                                </Text>
                                            </div>

                                            <div
                                                style={{
                                                    textAlign: 'center',
                                                    padding: '8px 0 20px',
                                                    color: '#999',
                                                    letterSpacing: 4,
                                                    fontWeight: 600,
                                                    borderBottom: '2px solid #444',
                                                    marginBottom: 16,
                                                }}
                                            >
                                                SCREEN
                                            </div>

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 6,
                                                    alignItems: 'center',
                                                }}
                                            >
                                                {rowLetters.map((rowLetter) => (
                                                    <div
                                                        key={rowLetter}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                                    >
                                                        <Text style={{ width: 20, textAlign: 'center', fontWeight: 600 }}>
                                                            {rowLetter}
                                                        </Text>

                                                        {Array.from({ length: cols }).map((_, i) => {
                                                            const seatNo = i + 1;
                                                            const key = seatKey(rowLetter, seatNo);
                                                            const cellType =
                                                                seatTypes[key]?.type ??
                                                                getDefaultSeatType(rowLetter, seatNo, cols);
                                                            const isNewSeat = seatTypes[key]?.id == null;

                                                            return (
                                                                <div
                                                                    key={i}
                                                                    onClick={() => handleSeatClick(rowLetter, seatNo)}
                                                                    title={`${rowLetter}${seatNo} - ${SEAT_TYPE_LABELS[cellType]}${isNewSeat ? ' (new seat)' : ''}`}
                                                                    style={{
                                                                        width: 24,
                                                                        height: 24,
                                                                        borderRadius: 4,
                                                                        background: seatColor[cellType],
                                                                        fontSize: 9,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        color: '#333',
                                                                        cursor: 'pointer',
                                                                        userSelect: 'none',
                                                                        border: isNewSeat
                                                                            ? '1px dashed #1677ff'
                                                                            : '1px solid rgba(0,0,0,0.15)',
                                                                    }}
                                                                >
                                                                    {seatNo}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>

                                            <Divider />

                                            <Space size="large" wrap>
                                                {Object.entries(SEAT_TYPE_LABELS).map(([key, label]) => (
                                                    <Space key={key} size={6}>
                                                        <div
                                                            style={{
                                                                width: 16,
                                                                height: 16,
                                                                borderRadius: 4,
                                                                background: seatColor[key],
                                                            }}
                                                        />
                                                        <Text>{label}</Text>
                                                    </Space>
                                                ))}
                                                {/*<Space size={6}>*/}
                                                {/*    <div*/}
                                                {/*        style={{*/}
                                                {/*            width: 16,*/}
                                                {/*            height: 16,*/}
                                                {/*            borderRadius: 4,*/}
                                                {/*            border: '1px dashed #1677ff',*/}
                                                {/*        }}*/}
                                                {/*    />*/}
                                                {/*    <Text>New seat</Text>*/}
                                                {/*</Space>*/}
                                            </Space>
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </Spin>
            </Modal>
        </>

    );
};

export default RoomUpdateForm;