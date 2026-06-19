import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Button,
    Card,
    Image,
    Tag,
    Typography,
    Spin,
    Empty,
    Space,
    Descriptions,
    Tabs,
    Badge,
    Tooltip,
    Divider,
} from 'antd';
import {
    ArrowLeftOutlined,
    ClockCircleOutlined,
    CalendarOutlined,
    UserOutlined,
    HomeOutlined,
    PlayCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import { movieService } from '@/services/movie.service';
import type { ComplexShowtimeRequestDTO, DayScheduleDTO } from '@/types/movie.types';
import { baseURL } from '@/services/axiosClient';

const { Title, Text, Paragraph } = Typography;

const statusColor: Record<string, string> = {
    SHOWING: 'green',
    UPCOMING: 'blue',
    ENDED: 'red',
};

const genreColor: Record<string, string> = {
    ACTION: 'volcano',
    CARTOON: 'lime',
    HORROR: 'purple',
    FAMILY: 'cyan',
    TRAGEDY: 'magenta',
    HISTORICAL: 'gold',
    DRAMA: 'geekblue',
    COMEDY: 'orange',
    MUSICAL: 'blue',
    ROMANCE: 'pink',
};

const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} minutes`;
    if (m === 0) return `${h} hour`;
    return `${h} hour ${m} minutes`;
};

// Format LocalTime from backend ("HH:mm:ss" or "HH:mm") to "HH:mm"
const fmtTime = (t: string) => t.slice(0, 5);

// ─── Showtime grid for one room ───────────────────────────────
const RoomShowtimeGrid: React.FC<{ days: DayScheduleDTO[] }> = ({ days }) => {
    const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length === 0)
        return <Text type="secondary">Not found schedule</Text>;
    dayjs.locale('en');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sorted.map((day) => (
                <div key={day.date}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <CalendarOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />
                        <Text strong style={{ fontSize: 13 }}>
                            {dayjs(day.date).format('dddd, DD/MM/YYYY')}
                        </Text>
                        <Badge
                            count={day.startTimes.length}
                            style={{ backgroundColor: '#1677ff' }}
                        />
                    </div>
                    <Space wrap size={[6, 6]}>
                        {[...day.startTimes]
                            .sort()
                            .map((t) => (
                                <Tooltip key={t} title="Giờ chiếu">
                                    <Tag
                                        icon={<ClockCircleOutlined />}
                                        color="blue"
                                        style={{ fontSize: 13, padding: '3px 10px', borderRadius: 20 }}
                                    >
                                        {fmtTime(t)}
                                    </Tag>
                                </Tooltip>
                            ))}
                    </Space>
                </div>
            ))}
        </div>
    );
};

// ─── Main page ────────────────────────────────────────────────
const MovieDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [movie, setMovie] = useState<ComplexShowtimeRequestDTO | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        movieService
            .fetchMovieById(Number(id))
            .then((res: any) => setMovie(res?.data ?? res))
            .catch(() => setMovie(null))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!movie) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                <Empty description="Movie not found!">
                    <Button type="primary" onClick={() => navigate(-1)}>Back</Button>
                </Empty>
            </div>
        );
    }

    const posterSrc = movie.posterUrl
        ? `${baseURL}/api/v1/files/${movie.posterUrl}`
        : undefined;

    const totalShowtimes = (movie.rooms ?? []).reduce(
        (acc, r) => acc + r.days.reduce((a, d) => a + d.startTimes.length, 0),
        0
    );

    const tabItems = (movie.rooms ?? []).map((room) => ({
        key: String(room.id),
        label: (
            <Space size={4}>
                <HomeOutlined />
                {room.name ?? `Phòng ${room.id}`}
                <Badge
                    count={room.days.reduce((a, d) => a + d.startTimes.length, 0)}
                    style={{ backgroundColor: '#1677ff' }}
                />
            </Space>
        ),
        children: <RoomShowtimeGrid days={room.days} />,
    }));

    return (
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: '24px 16px' }}>
            {/* Top navigation */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    flexWrap: 'wrap',
                    gap: 8,
                }}
            >
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ paddingLeft: 0 }}
                >
                    Back
                </Button>
            </div>

            {/* Hero card */}
            <Card styles={{ body: { padding: 0 } }} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {/* Poster */}
                    <div
                        style={{
                            flex: '0 0 220px',
                            maxWidth: 220,
                            minWidth: 160,
                            padding: 24,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'flex-start',
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                aspectRatio: '2 / 3',
                                borderRadius: 10,
                                overflow: 'hidden',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                            }}
                        >
                            {posterSrc ? (
                                <Image
                                    src={posterSrc}
                                    alt={movie.title}
                                    width="100%"
                                    height="100%"
                                    style={{ objectFit: 'cover', cursor: 'zoom-in' }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'rgba(255,255,255,0.06)',
                                        color: 'rgba(255,255,255,0.3)',
                                    }}
                                >
                                    No poster
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, padding: '24px 24px 24px 0', minWidth: 260 }}>
                        <Space size={[6, 6]} wrap style={{ marginBottom: 10 }}>
                            {movie.status && (
                                <Tag color={statusColor[movie.status] ?? 'default'} style={{ fontSize: 13 }}>
                                    {movie.status}
                                </Tag>
                            )}
                            {movie.genre && (
                                <Tag color={genreColor[movie.genre] ?? 'default'} style={{ fontSize: 13 }}>
                                    {movie.genre}
                                </Tag>
                            )}
                        </Space>

                        <Title level={2} style={{ margin: '4px 0 16px' }}>
                            {movie.title}
                        </Title>

                        <Descriptions
                            column={1}
                            size="small"
                            labelStyle={{ width: 140, color: 'rgba(255,255,255,0.45)' }}
                            contentStyle={{ color: 'rgba(255,255,255,0.92)' }}
                        >
                            <Descriptions.Item label={<><ClockCircleOutlined /> Duration minutes</>}>
                                {formatDuration(movie.durationMinutes)}
                            </Descriptions.Item>
                            <Descriptions.Item label={<><UserOutlined /> Director</>}>
                                {movie.director || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={<><CalendarOutlined /> Release date</>}>
                                {movie.releaseDate
                                    ? dayjs(movie.releaseDate).format('DD/MM/YYYY HH:mm')
                                    : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={<><PlayCircleOutlined /> Total screenings </>}>
                                <Text style={{ color: '#1677ff', fontWeight: 600 }}>
                                    {totalShowtimes} screenings
                                </Text>
                                {'-'}at{'-'}
                                <Text style={{ fontWeight: 600 }}>
                                    {(movie.rooms ?? []).length}  rooms
                                </Text>
                            </Descriptions.Item>
                        </Descriptions>

                        {movie.description && (
                            <>
                                <Divider style={{ margin: '12px 0' }} />
                                <Text
                                    strong
                                    style={{ display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.92)' }}
                                >
                                    Description
                                </Text>
                                <Paragraph
                                    style={{
                                        color: 'rgba(255,255,255,0.65)',
                                        whiteSpace: 'pre-line',
                                        marginBottom: 0,
                                    }}
                                >
                                    {movie.description}
                                </Paragraph>
                            </>
                        )}
                    </div>
                </div>
            </Card>

            {/* Showtime section */}
            <Card
                title={
                    <Space>
                        <PlayCircleOutlined />
                        <span>Schedule room</span>
                        <Badge
                            count={`${totalShowtimes} screenings`}
                            style={{ backgroundColor: '#1677ff' }}
                        />
                    </Space>
                }
            >
                {(movie.rooms ?? []).length === 0 ? (
                    <Empty description="Not found screeng this movie" />
                ) : (
                    <Tabs items={tabItems} type="card" />
                )}
            </Card>
        </div>
    );
};

export default MovieDetailPage;