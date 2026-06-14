import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card,
    Image,
    Tag,
    Typography,
    Spin,
    Button,
    Descriptions,
    Empty,
    Space,
} from 'antd';
import {
    ArrowLeftOutlined,
    ClockCircleOutlined,
    CalendarOutlined,
    UserOutlined,
    TagsOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {type AdminMovieDTO, MovieStatus} from "@/types/movie.types.ts";
import {movieService} from "@/services/movie.service.ts";
import {baseURL} from "@/services/axiosClient.ts";

const { Title, Paragraph, Text } = Typography;

const statusColor: Record<string, string> = {
    [MovieStatus.SHOWING]: 'green',
    [MovieStatus.UPCOMING]: 'blue',
    [MovieStatus.ENDED]: 'red',
};

const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} phút`;
    if (m === 0) return `${h} giờ`;
    return `${h} giờ ${m} phút`;
};

const MovieDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [movie, setMovie] = useState<AdminMovieDTO | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovie = async () => {
            setLoading(true);
            try {
                const res = await movieService.fetchMovieById(Number(id));
                setMovie(res.data);
            } catch (error) {
                setMovie(null);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchMovie();
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
                    <Button type="primary" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </Empty>
            </div>
        );
    }

    const posterSrc = movie.posterUrl ? `${baseURL}/api/v1/files/${movie.posterUrl}` : undefined;

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
                style={{ marginBottom: 16, paddingLeft: 0 }}
            >
                Quay lại
            </Button>

            <Card bordered styles={{ body: { padding: 0 } }}>
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0,
                    }}
                >
                    {/* Poster */}
                    <div
                        style={{
                            flex: '0 0 280px',
                            maxWidth: 280,
                            minWidth: 220,
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
                                borderRadius: 8,
                                overflow: 'hidden',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                            }}
                        >
                            {posterSrc ? (
                                <Image
                                    src={posterSrc}
                                    alt={movie.title}
                                    width="100%"
                                    height="100%"
                                    style={{ objectFit: 'cover', cursor: 'zoom-in' }}
                                    preview={{
                                        maskClassName: 'poster-preview-mask',
                                    }}
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
                                        color: 'rgba(255,255,255,0.45)',
                                    }}
                                >
                                    No poster
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    <div style={{ flex: '1 1 360px', padding: '24px 24px 24px 0', minWidth: 280 }}>
                        <Space size={[8, 8]} wrap style={{ marginBottom: 8 }}>
                            {movie.status && (
                                <Tag color={statusColor[movie.status] ?? 'default'} style={{ fontSize: 13 }}>
                                    {movie.status}
                                </Tag>
                            )}
                            {movie.genre && (
                                <Tag icon={<TagsOutlined />} color="purple" style={{ fontSize: 13 }}>
                                    {movie.genre}
                                </Tag>
                            )}
                        </Space>

                        <Title level={2} style={{ margin: '4px 0 16px' }}>
                            {movie.title}
                        </Title>

                        <Descriptions
                            column={1}
                            size="middle"
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
                                {movie.releaseDate ? dayjs(movie.releaseDate).format('DD/MM/YYYY HH:mm') : '-'}
                            </Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginTop: 16 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8, color: 'rgba(255,255,255,0.92)' }}>
                                Mô tả
                            </Text>
                            <Paragraph style={{ color: 'rgba(255,255,255,0.65)', whiteSpace: 'pre-line' }}>
                                {movie.description || 'No description available'}
                            </Paragraph>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default MovieDetailPage;