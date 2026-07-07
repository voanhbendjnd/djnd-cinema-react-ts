// [2026-07-07 07:14] Thêm prop statusFilter để hỗ trợ Now Showing / Coming Soon
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, Select, Spin, Empty, Pagination } from 'antd';
import { CalendarOutlined, EyeOutlined, SearchOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import axiosClient from '@/services/axiosClient';
import type { PublishMovieProjection } from '@/pages/user/home/page';
import { MovieGenre } from '@/types/movie.types';
import { getMoviePosterSrc } from '@/utils/moviePoster';
import '@/styles/home.css';
import {generateMovieSlug} from "@/utils/generate.slug.ts";

const PAGE_SIZE = 12;

const GENRE_LABELS: Record<string, string> = {
    ACTION: 'Action',
    HORROR: 'Horror',
    COMEDY: 'Comedy',
    ROMANCE: 'Romance',
    DRAMA: 'Drama',
    CARTOON: 'Cartoon',
    FAMILY: 'Family',
    MUSICAL: 'Musical',
    HISTORICAL: 'Historical',
    TRAGEDY: 'Tragedy',
};
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

type SortOption = 'title_asc' | 'title_desc' | 'date_asc' | 'date_desc';

const SORT_OPTIONS = [
    { value: 'date_desc', label: 'Release date (newest)' },
    { value: 'date_asc', label: 'Release date (oldest)' },
    { value: 'title_asc', label: 'Title A → Z' },
    { value: 'title_desc', label: 'Title Z → A' },
];

const GENRE_OPTIONS = [
    { value: 'ALL', label: 'All genres' },
    ...Object.keys(MovieGenre).map((g) => ({ value: g, label: GENRE_LABELS[g] ?? g })),
];

// [2026-06-27] Thẻ phim — hiển thị poster + nút Detail
const ListMovieCard: React.FC<{ movie: PublishMovieProjection }> = ({ movie }) => {
    const navigate = useNavigate();
    const src = getMoviePosterSrc(movie.posterUrl);

    const goToDetail = () => {
        navigate(`/movies/${generateMovieSlug(movie.title, movie.id)}`);
    };

    return (
        <div className="movie-list-card">
            <div className="movie-card__poster-wrap">
                <img className="movie-card__poster" src={src} alt={movie.title} loading="lazy" />
                <div
                    className="movie-card__genre-badge"
                    style={{ background: GENRE_COLOR[movie.genre] ?? '#444' }}
                >
                    {GENRE_LABELS[movie.genre] ?? movie.genre}
                </div>
            </div>
            <div className="movie-list-card__body">
                <p className="movie-card__title">{movie.title}</p>
                <p className="movie-card__date">
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    {dayjs(movie.releaseDate).format('DD/MM/YYYY')}
                </p>
                <Button
                    type="primary"
                    ghost
                    size="small"
                    icon={<EyeOutlined />}
                    block
                    onClick={goToDetail}
                >
                    View
                </Button>
            </div>
        </div>
    );
};

// [2026-07-07 07:14] Thêm prop statusFilter: 'SHOWING' | 'UPCOMING' | undefined
// Khi statusFilter được truyền vào, danh sách phim sẽ được lọc theo status tương ứng
interface MovieListPageProps {
    statusFilter?: 'SHOWING' | 'UPCOMING';
}

const MovieListPage: React.FC<MovieListPageProps> = ({ statusFilter }) => {
    const [movies, setMovies] = useState<PublishMovieProjection[]>([]);
    const [loading, setLoading] = useState(true);
    const [genre, setGenre] = useState('ALL');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortOption>('date_desc');
    const [page, setPage] = useState(1);

    // [2026-06-27] Gọi API home movies có sẵn
    // [2026-07-07] Truyền status query param để lọc đúng SHOWING / UPCOMING từ backend
    useEffect(() => {
        const params = statusFilter ? `?status=${statusFilter}` : '';
        axiosClient
            .get<unknown>(`/api/v1/home/movies${params}`)
            .then((res) => {
                const data = (res as { data?: unknown })?.data ?? res;
                setMovies(Array.isArray(data) ? data : (data as { result?: PublishMovieProjection[] })?.result ?? []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [statusFilter]);

    // [2026-06-27] Lọc thể loại, tìm kiếm tên, sắp xếp
    // [2026-07-07 07:14] Bổ sung lọc theo statusFilter (SHOWING / UPCOMING)
    const filteredMovies = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        let result = movies.filter((m) => {
            if (statusFilter && m.status !== statusFilter) return false;
            if (genre !== 'ALL' && m.genre !== genre) return false;
            if (keyword && !m.title.toLowerCase().includes(keyword)) return false;
            return true;
        });

        result = [...result].sort((a, b) => {
            switch (sort) {
                case 'title_asc':
                    return a.title.localeCompare(b.title);
                case 'title_desc':
                    return b.title.localeCompare(a.title);
                case 'date_asc':
                    return dayjs(a.releaseDate).valueOf() - dayjs(b.releaseDate).valueOf();
                case 'date_desc':
                default:
                    return dayjs(b.releaseDate).valueOf() - dayjs(a.releaseDate).valueOf();
            }
        });

        return result;
        // [2026-07-07 07:14] Thêm statusFilter vào deps để re-filter khi chuyển tab
    }, [movies, genre, search, sort, statusFilter]);

    // [2026-06-27] Phân trang client-side (API home/movies chưa có pagination)
    const paginatedMovies = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredMovies.slice(start, start + PAGE_SIZE);
    }, [filteredMovies, page]);

    useEffect(() => {
        setPage(1);
    }, [genre, search, sort]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(filteredMovies.length / PAGE_SIZE));
        if (page > maxPage) setPage(maxPage);
    }, [filteredMovies.length, page]);

    // [2026-07-07 07:14] Xác định tiêu đề và link back tương ứng với statusFilter
    const pageTitle = statusFilter === 'SHOWING'
        ? 'NOW SHOWING'
        : statusFilter === 'UPCOMING'
            ? 'COMING SOON'
            : 'MOVIE LIST';

    const backLabel = statusFilter ? 'Back to Movies' : 'Back to Home';
    const backPath = statusFilter ? '/movies' : '/';

    return (
        <div className="home movie-list-page">
            <section className="section">
                <Link to={backPath} className="movie-list-back">
                    <Button
                        type="default"
                        icon={<ArrowLeftOutlined />}
                        className="movie-list-back__btn"
                    >
                        {backLabel}
                    </Button>
                </Link>

                <div className="section__heading">
                    <div className="section__line" />
                    <h2 className="section__title">{pageTitle}</h2>
                    <div className="section__line" />
                </div>

                {/* [2026-06-27] Bộ lọc: thể loại, tìm kiếm, sắp xếp */}
                <div className="movie-list-filters">
                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="Search by movie title..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="movie-list-filters__search"
                    />
                    <Select
                        value={genre}
                        onChange={setGenre}
                        options={GENRE_OPTIONS}
                        className="movie-list-filters__select"
                    />
                    <Select
                        value={sort}
                        onChange={setSort}
                        options={SORT_OPTIONS}
                        className="movie-list-filters__select"
                    />
                </div>

                {loading ? (
                    <div className="movie-list-loading">
                        <Spin size="large" tip="Loading movies..." />
                    </div>
                ) : filteredMovies.length === 0 ? (
                    <Empty
                        description="No movies found"
                        style={{ padding: '40px 0' }}
                    />
                ) : (
                    <>
                        <div className="movie-list-grid">
                            {paginatedMovies.map((movie) => (
                                <ListMovieCard key={movie.id} movie={movie} />
                            ))}
                        </div>
                        {filteredMovies.length > PAGE_SIZE && (
                            <div className="movie-list-pagination">
                                <Pagination
                                    current={page}
                                    pageSize={PAGE_SIZE}
                                    total={filteredMovies.length}
                                    onChange={setPage}
                                    showSizeChanger={false}
                                    showTotal={(total) => `Total ${total} movies`}
                                />
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
};

export default MovieListPage;