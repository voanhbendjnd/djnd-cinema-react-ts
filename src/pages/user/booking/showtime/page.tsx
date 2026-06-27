import React, { useEffect, useRef, useState } from 'react';
import { Button, Spin } from 'antd';
import { LeftOutlined, RightOutlined, PlayCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axiosClient from '@/services/axiosClient';
import dayjs from 'dayjs';
import '@/styles/home.css'
import 'dayjs/locale/en';

export interface PublishMovieProjection {
    id: number;
    title: string;
    posterUrl: string;
    releaseDate: string;
    genre: string;
    sold: number;
    status: string;
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


const MovieCard: React.FC<{ movie: PublishMovieProjection; onBook: (id: number) => void }> = ({
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
                                onClick={() => onBook(movie.id)}
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

const MovieSlider: React.FC<{ movies: PublishMovieProjection[] }> = ({ movies }) => {
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

    const handleBook = (id: number) => {
        window.location.href = `/booking/${id}`;
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
                    <MovieCard key={m.id} movie={m} onBook={handleBook} />
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
                    <MovieSlider movies={movies} />
                )}
            </section>


        </div>
    );
};

export default HomePage;