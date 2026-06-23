import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Button,
    Card,
    Typography,
    Spin,
    Empty,
    Tag,
    Space,
    Divider,
} from 'antd';
import { ArrowLeftOutlined} from '@ant-design/icons';
import {
    ROOM_STATUS_LABELS,
    ROOM_TYPE_LABELS, type RoomDetailDTO,
    SEAT_TYPE_LABELS, type SeatDTO,
} from '@/types/room.types';
import {roomService} from "@/services/room.service.ts";

const { Title, Text } = Typography;

const statusColor: Record<string, string> = {
    ACTIVE: 'green',
    MAINTENANCE: 'orange',
    INACTIVE: 'default',
};

const seatColor: Record<string, string> = {
    STANDARD: '#d9d9d9',
    VIP: '#ffd666',
    SWEETBOX: '#ff85c0',
};

const RoomDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [room, setRoom] = useState<RoomDetailDTO | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoom = async () => {
            setLoading(true);
            try {
                const res = await roomService.fetchRoomDetail(Number(id));
                setRoom(res.data);
            } catch (error) {
                setRoom(null);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchRoom();
    }, [id]);

    // Group seats by row letter -> sorted by seatNo, and collect the max column count
    const { groupedRows, maxCols } = useMemo(() => {
        if (!room?.seats || room.seats.length === 0) {
            return { groupedRows: [] as { rowLetter: string; seats: SeatDTO[] }[], maxCols: 0 };
        }

        const map = new Map<string, SeatDTO[]>();
        let max = 0;

        room.seats.forEach((seat) => {
            const list = map.get(seat.seatRow) || [];
            list.push(seat);
            map.set(seat.seatRow, list);
            if (seat.seatNo > max) max = seat.seatNo;
        });

        const rows = Array.from(map.entries())
            .map(([rowLetter, seats]) => ({
                rowLetter,
                seats: seats.sort((a, b) => a.seatNo - b.seatNo),
            }))
            .sort((a, b) => a.rowLetter.localeCompare(b.rowLetter));

        return { groupedRows: rows, maxCols: max };
    }, [room]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!room) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                <Empty description="Không tìm thấy phòng chiếu">
                    <Button type="primary" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </Empty>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
                style={{ marginBottom: 8, paddingLeft: 0 }}
            >
                Back
            </Button>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 12,
                    marginBottom: 16,
                }}
            >
                <div>
                    <Space size={[8, 8]} wrap style={{ marginBottom: 8 }}>
                        <Tag color={statusColor[room.status] ?? 'default'}>
                            {ROOM_STATUS_LABELS[room.status] ?? room.status}
                        </Tag>
                        <Tag color="blue">{ROOM_TYPE_LABELS[room.type] ?? room.type}</Tag>
                    </Space>
                    <Title level={2} style={{ margin: 0 }}>
                        {room.name}
                    </Title>
                    <Text type="secondary">
                        Total seats: {room.seats?.length ?? 0}
                    </Text>
                </div>

                {/*<Button*/}
                {/*    icon={<EditOutlined />}*/}
                {/*    onClick={() => navigate(`/admin/rooms/${room.id}/edit`)}*/}
                {/*>*/}
                {/*    Edit seating chart*/}
                {/*</Button>*/}
            </div>

            <Card>
                {groupedRows.length === 0 ? (
                    <Empty description="Phòng chưa có sơ đồ ghế" />
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '8px 0 24px',
                                color: '#999',
                                letterSpacing: 6,
                                fontWeight: 600,
                                borderBottom: '3px solid #444',
                                marginBottom: 24,
                                fontSize: 13,
                            }}
                        >
                            MAIN SCREEN
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', minWidth: maxCols * 32 + 40 }}>
                            {groupedRows.map((row) => (
                                <div key={row.rowLetter} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Text style={{ width: 24, textAlign: 'center', fontWeight: 600 }}>
                                        {row.rowLetter}
                                    </Text>
                                    {row.seats.map((seat) => (
                                        <div
                                            key={seat.id ?? `${row.rowLetter}${seat.seatNo}`}
                                            title={`${row.rowLetter}${seat.seatNo} - ${SEAT_TYPE_LABELS[seat.type] ?? seat.type}`}
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: 6,
                                                background: seatColor[seat.type] ?? '#d9d9d9',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#333',
                                            }}
                                        >
                                            {seat.seatNo}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <Divider />

                        <Space size="large" wrap style={{ justifyContent: 'center', width: '100%', display: 'flex' }}>
                            {Object.entries(SEAT_TYPE_LABELS).map(([key, label]) => (
                                <Space key={key} size={6}>
                                    <div
                                        style={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: 4,
                                            background: seatColor[key],
                                        }}
                                    />
                                    <Text>{label}</Text>
                                </Space>
                            ))}
                        </Space>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default RoomDetailPage;