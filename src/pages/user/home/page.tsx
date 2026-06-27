import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Spin, Modal, Empty, notification } from 'antd';
import { LeftOutlined, RightOutlined, PlayCircleOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '@/services/axiosClient';
import dayjs, { Dayjs } from 'dayjs';
import '@/styles/home.css'

export interface PublishMovieProjection {
    id: number;
    title: string;
    posterUrl: string;
    releaseDate: string;
    genre: string;
    sold: number;
    status: string;
}

interface ShowtimeSchedule {
    showtimeId: number;
    startDateTime: string;
    endDateTime: string;
    roomId: number;
}

interface ShowtimeResponseData {
    movieId: number;
    schedules: ShowtimeSchedule[];
}

const baseURL = axiosClient.defaults.baseURL ?? '';

const GENRE_COLOR: Record<string, string> = {
    ACTION: '#e63946',
    HORROR: '#6a0dad',
    COMEDY: '#f4a261',
    ROMANCE: '#e76f51',
    DRAMA: '#2a9d8f',
    CARTOON: '#48cae4',
    FAMILY: '#06d6a0',
    MUSICAL: '#ffb703',
    HISTORICAL: '#8d6748',
    TRAGEDY: '#6b6b6b',
};

const BANNERS = [
    {
        bg: 'linear-gradient(135deg, #1a0000 0%, #3d0000 50%, #1a0000 100%)',
        accent: '#ff0000',
        label: 'NOW SHOWING',
        title: 'BLOCKBUSTER\nSEASON 2026',
        sub: 'Experience cinema like never before',
    },
    {
        bg: 'linear-gradient(135deg, #000d1a 0%, #003366 50%, #000d1a 100%)',
        accent: '#0095ff',
        label: 'COMING SOON',
        title: 'SUMMER\nPREMIERES',
        sub: 'The biggest films of the year',
    },
    {
        bg: 'linear-gradient(135deg, #1a0d00 0%, #4d2600 50%, #1a0d00 100%)',
        accent: '#ff8c00',
        label: 'SPECIAL EVENT',
        title: 'SNEAK\nPREVIEWS',
        sub: 'Be the first to see it',
    },
];

// ──────────────────────────────────────────────────────────────
// Sinh danh sách ngày: từ hôm nay → đến thứ 7 của 2 tuần sau
// Logic: tìm thứ 7 gần nhất sắp tới (nextSaturday), rồi cộng thêm 14 ngày
// để ra "thứ 7 của 2 tuần sau" → đó là điểm kết thúc của range.
// ──────────────────────────────────────────────────────────────
const buildDateRange = (): Dayjs[] => {
    const today = dayjs().startOf('day');
    const dow = today.day(); // 0 = Sunday ... 6 = Saturday
    const daysUntilSaturday = (6 - dow + 7) % 7;
    const nextSaturday = today.add(daysUntilSaturday, 'day');
    const endDate = nextSaturday.add(14, 'day'); // Saturday của 2 tuần sau nextSaturday

    const dates: Dayjs[] = [];
    let cursor = today;
    while (cursor.isBefore(endDate) || cursor.isSame(endDate, 'day')) {
        dates.push(cursor);
        cursor = cursor.add(1, 'day');
    }
    return dates;
};

// ──────────────────────────────────────────────────────────────
// Showtime Modal: chọn ngày → chọn giờ chiếu
// ──────────────────────────────────────────────────────────────
const ShowtimeModal: React.FC<{
    movieId: number | null;
    movieTitle?: string;
    onClose: () => void;
}> = ({ movieId, movieTitle, onClose }) => {
    const navigate = useNavigate();
    const [api, contextHolder] = notification.useNotification();
    const dateList = useMemo(() => buildDateRange(), []);
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dateList[0]);
    const [schedules, setSchedules] = useState<ShowtimeSchedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedShowtimeId, setSelectedShowtimeId] = useState<number | null>(null);
    const dateScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (movieId == null) return;
        setSelectedDate(dateList[0]);
    }, [movieId]);

    useEffect(() => {
        if (movieId == null) return;

        setLoading(true);
        setSelectedShowtimeId(null);
        axiosClient
            .get<any>(`/api/v1/movies/${movieId}/showtimes`, {
                params: { date: selectedDate.format('YYYY-MM-DD') },
            })
            .then((res) => {
                const data: ShowtimeResponseData = res?.data ?? res;
                setSchedules(data?.schedules ?? []);
            })
            .catch(() => {
                setSchedules([]);
                api.error({ message: 'Failed to load showtimes', placement: 'topRight' });
            })
            .finally(() => setLoading(false));
    }, [movieId, selectedDate]);

    const scrollDates = (dir: 1 | -1) => {
        if (dateScrollRef.current) {
            dateScrollRef.current.scrollBy({ left: dir * 160, behavior: 'smooth' });
        }
    };

    const handleConfirm = () => {
        if (!selectedShowtimeId) return;
        navigate(`/booking/${selectedShowtimeId}`);
        onClose();
    };

    return (
        <Modal
            open={movieId != null}
            onCancel={onClose}
            footer={null}
            width={640}
            styles={{
                content: { background: '#111', border: '1px solid rgba(255,255,255,0.08)' },
                header: { background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)' },
                mask: { backdropFilter: 'blur(2px)' },
            }}
            title={
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1.5, color: '#f0ece3', fontSize: 16 }}>
                    {movieTitle ? movieTitle.toUpperCase() : 'SELECT SHOWTIME'}
                </span>
            }
            destroyOnClose
        >
            {contextHolder}

            {/* ── Date selector ── */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                    SELECT DATE
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                        onClick={() => scrollDates(-1)}
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 6,
                            color: '#f0ece3',
                            width: 28,
                            height: 28,
                            flexShrink: 0,
                            cursor: 'pointer',
                        }}
                    >
                        <LeftOutlined style={{ fontSize: 11 }} />
                    </button>

                    <div
                        ref={dateScrollRef}
                        style={{
                            display: 'flex',
                            gap: 8,
                            overflowX: 'auto',
                            scrollbarWidth: 'none',
                            padding: '2px 0',
                        }}
                    >
                        {dateList.map((d) => {
                            const isActive = d.isSame(selectedDate, 'day');
                            const isToday = d.isSame(dayjs(), 'day');
                            return (
                                <button
                                    key={d.format('YYYY-MM-DD')}
                                    onClick={() => setSelectedDate(d)}
                                    style={{
                                        flexShrink: 0,
                                        width: 58,
                                        padding: '8px 0',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        background: isActive ? '#e63946' : 'rgba(255,255,255,0.04)',
                                        border: isActive ? '1px solid #e63946' : '1px solid rgba(255,255,255,0.1)',
                                        color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <div style={{ fontSize: 10, letterSpacing: 1, opacity: 0.85 }}>
                                        {d.format('ddd').toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: 18, fontFamily: "'Bebas Neue', sans-serif", lineHeight: 1.2 }}>
                                        {d.format('DD')}
                                    </div>
                                    <div style={{ fontSize: 9, opacity: 0.7 }}>
                                        {isToday ? 'TODAY' : d.format('MMM')}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => scrollDates(1)}
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 6,
                            color: '#f0ece3',
                            width: 28,
                            height: 28,
                            flexShrink: 0,
                            cursor: 'pointer',
                        }}
                    >
                        <RightOutlined style={{ fontSize: 11 }} />
                    </button>
                </div>
            </div>

            {/* ── Showtime list ── */}
            <div>
                <div style={{ fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                    SELECT TIME
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                        <Spin />
                    </div>
                ) : schedules.length === 0 ? (
                    <Empty
                        description={<span style={{ color: 'rgba(255,255,255,0.4)' }}>No showtimes available for this date</span>}
                        style={{ padding: '20px 0' }}
                    />
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {schedules.map((s) => {
                            const isSelected = s.showtimeId === selectedShowtimeId;
                            return (
                                <button
                                    key={s.showtimeId}
                                    onClick={() => setSelectedShowtimeId(s.showtimeId)}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        background: isSelected ? '#e63946' : 'rgba(255,255,255,0.04)',
                                        border: isSelected ? '1px solid #e63946' : '1px solid rgba(255,255,255,0.1)',
                                        color: isSelected ? '#fff' : '#f0ece3',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        minWidth: 90,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <span style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <ClockCircleOutlined style={{ fontSize: 11 }} />
                                        {dayjs(s.startDateTime).format('HH:mm')}
                                    </span>
                                    <span style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
                                        Room {s.roomId}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Confirm ── */}
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    type="primary"
                    disabled={!selectedShowtimeId}
                    onClick={handleConfirm}
                    style={{
                        background: selectedShowtimeId ? '#e63946' : undefined,
                        border: 'none',
                        fontWeight: 600,
                        letterSpacing: 0.5,
                    }}
                >
                    Continue to Booking
                </Button>
            </div>
        </Modal>
    );
};

// ──────────────────────────────────────────────────────────────
// Movie Card
// ──────────────────────────────────────────────────────────────
const MovieCard: React.FC<{ movie: PublishMovieProjection; onBook: (id: number, title: string) => void }> = ({
                                                                                                                 movie,
                                                                                                                 onBook,
                                                                                                             }) => {
    const [hovered, setHovered] = useState(false);
    const src = `${baseURL}/api/v1/files/${movie.posterUrl}`;

    return (
        <div
            className={`movie-card ${hovered ? 'movie-card--hovered' : ''}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="movie-card__poster-wrap">
                <img className="movie-card__poster" src={src} alt={movie.title} loading="lazy" />
                <div className="movie-card__genre-badge" style={{ background: GENRE_COLOR[movie.genre] ?? '#444' }}>
                    {movie.genre}
                </div>
                {hovered && (
                    <div className="movie-card__overlay">
                        <p className="movie-card__overlay-title">{movie.title}</p>
                        <div className="movie-card__overlay-actions">
                            <Link to={`/movies/${movie.id}`}>
                                <Button type="default" ghost size="small" icon={<PlayCircleOutlined />}>
                                    View Details
                                </Button>
                            </Link>
                            <Button
                                type="primary"
                                size="small"
                                danger
                                onClick={() => onBook(movie.id, movie.title)}
                                style={{ background: '#e63946', border: 'none' }}
                            >
                                🎟 Booking
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            <div className="movie-card__info">
                <p className="movie-card__title">{movie.title}</p>
                <p className="movie-card__date">
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    {dayjs(movie.releaseDate).format('DD/MM/YYYY')}
                </p>
            </div>
        </div>
    );
};

const MovieSlider: React.FC<{
    movies: PublishMovieProjection[];
    onBook: (id: number, title: string) => void;
}> = ({ movies, onBook }) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [idx, setIdx] = useState(0);
    const VISIBLE = 4;
    const max = Math.max(0, movies.length - VISIBLE);

    const scroll = (dir: 1 | -1) => {
        const next = Math.min(Math.max(idx + dir, 0), max);
        setIdx(next);
        if (trackRef.current) {
            const cardW = trackRef.current.children[0]
                ? (trackRef.current.children[0] as HTMLElement).offsetWidth + 16
                : 240;
            trackRef.current.scrollTo({ left: next * cardW, behavior: 'smooth' });
        }
    };

    return (
        <div className="slider-wrap">
            {idx > 0 && (
                <button className="slider-arrow slider-arrow--left" onClick={() => scroll(-1)}>
                    <LeftOutlined />
                </button>
            )}
            <div className="slider-track" ref={trackRef}>
                {movies.map((m) => (
                    <MovieCard key={m.id} movie={m} onBook={onBook} />
                ))}
            </div>
            {idx < max && (
                <button className="slider-arrow slider-arrow--right" onClick={() => scroll(1)}>
                    <RightOutlined />
                </button>
            )}
        </div>
    );
};

const BannerSlider: React.FC = () => {
    const [active, setActive] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const start = () => {
        intervalRef.current = setInterval(() => setActive((p) => (p + 1) % BANNERS.length), 4500);
    };

    useEffect(() => {
        start();
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const go = (dir: 1 | -1) => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setActive((p) => (p + dir + BANNERS.length) % BANNERS.length);
        start();
    };

    const b = BANNERS[active];

    return (
        <div className="banner" style={{ background: b.bg }}>
            <div className="banner__noise" />
            <button className="banner__arrow banner__arrow--left" onClick={() => go(-1)}>
                <LeftOutlined />
            </button>

            <div className="banner__content">
        <span className="banner__label" style={{ color: b.accent, borderColor: b.accent }}>
          {b.label}
        </span>
                <h1 className="banner__title" style={{ '--accent': b.accent } as React.CSSProperties}>
                    {b.title.split('\n').map((line, i) => (
                        <span key={i} className="banner__title-line">{line}</span>
                    ))}
                </h1>
                <p className="banner__sub">{b.sub}</p>
                <Button
                    type="primary"
                    size="large"
                    style={{ background: b.accent, border: 'none', borderRadius: 2, fontWeight: 700, letterSpacing: 1 }}
                >
                    Book Tickets
                </Button>
            </div>

            <button className="banner__arrow banner__arrow--right" onClick={() => go(1)}>
                <RightOutlined />
            </button>

            <div className="banner__dots">
                {BANNERS.map((_, i) => (
                    <button
                        key={i}
                        className={`banner__dot ${i === active ? 'banner__dot--active' : ''}`}
                        style={i === active ? { background: b.accent } : {}}
                        onClick={() => { if (intervalRef.current) clearInterval(intervalRef.current); setActive(i); start(); }}
                    />
                ))}
            </div>
        </div>
    );
};

const HomePage: React.FC = () => {
    const [movies, setMovies] = useState<PublishMovieProjection[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingMovie, setBookingMovie] = useState<{ id: number; title: string } | null>(null);

    useEffect(() => {
        axiosClient
            .get<any>('/api/v1/home/movies')
            .then((res) => {
                const data = res?.data ?? res;
                setMovies(Array.isArray(data) ? data : data?.result ?? []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleBook = (id: number, title: string) => {
        setBookingMovie({ id, title });
    };

    return (
        <div className="home">
            {/* ── Banner ── */}
            <BannerSlider />

            {/* ── Film strip ── */}
            <div className="film-strip">
                {Array.from({ length: 30 }).map((_, i) => <span key={i} className="film-strip__hole" />)}
            </div>

            {/* ── Movie Selection ── */}
            <section className="section">
                <div className="section__heading">
                    <div className="section__line" />
                    <h2 className="section__title">MOVIE SELECTION</h2>
                    <div className="section__line" />
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <Spin size="large" />
                    </div>
                ) : movies.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '40px 0' }}>
                        No movies currently showing.
                    </p>
                ) : (
                    <MovieSlider movies={movies} onBook={handleBook} />
                )}
            </section>

            <ShowtimeModal
                movieId={bookingMovie?.id ?? null}
                movieTitle={bookingMovie?.title}
                onClose={() => setBookingMovie(null)}
            />
        </div>
    );
};

export default HomePage;