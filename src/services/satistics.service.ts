import axiosClient from '@/services/axiosClient';

export interface TopMovieProjection {
    movieId: number;
    movieTitle: string;
    posterUrl: string;
    totalRevenue: number;
    ticketsSold: number;
    totalShowtimes: number;
}

export const statisticsService = {
    getTopMovies: (params: {
        fromDate?: string;
        toDate?: string;
        limit?: number;
    }) =>
        axiosClient.get<TopMovieProjection[]>('/admin/statistics/top-movies', {
            params,
        }),
};