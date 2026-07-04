import axiosClient from '@/services/axiosClient';
import type { AdminMovieDTO, ComplexShowtimeRequestDTO, MovieDetails } from '@/types/movie.types';
import type { RoomDTO } from "@/types/room.types.ts";

export const movieService = {
  uploadTempFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    // The backend returns a plain string for this endpoint, not wrapped in IBackendRes
    const response = await axiosClient.post('/api/v1/admin/movies/upload-temp', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response as unknown as string;
  },

  createMovie: async (data: AdminMovieDTO): Promise<IBackendRes<AdminMovieDTO>> => {
    const response = await axiosClient.post('/api/v1/admin/movies', data);
    return response as unknown as IBackendRes<AdminMovieDTO>;
  },
  updateMovie: async (data: AdminMovieDTO): Promise<IBackendRes<AdminMovieDTO>> => {
    const response = await axiosClient.put('/api/v1/admin/movies', data);
    return response as unknown as IBackendRes<AdminMovieDTO>;
  },
  fetchMovieById: async (id: number): Promise<IBackendRes<ComplexShowtimeRequestDTO>> => {
    const response = await axiosClient.get(`/api/v1/admin/movies/${id}`);
    return response as unknown as IBackendRes<ComplexShowtimeRequestDTO>;
  },
  getRoomsForMovie: async (): Promise<IBackendRes<RoomDTO>> => {
    const response = await axiosClient.get('/api/v1/admin/movies/rooms');

    return response as unknown as IBackendRes<RoomDTO>;
  },

  fetchAllMovieWithPagination: async (q: string, page: number, size: number, sort: string): Promise<IBackendRes<IModelPaginate<ComplexShowtimeRequestDTO>>> => {
    const response = await axiosClient.get('/api/v1/admin/movies', {
      params: { q, page, size, sort },
    });
    return response as unknown as IBackendRes<IModelPaginate<ComplexShowtimeRequestDTO>>;
  },

  getMovieDetail: async (
    movieId: number
  ): Promise<MovieDetails> => {
    const response = await axiosClient.get(
      `/api/v1/movies/${movieId}`
    );

    const payload = (response as { data?: unknown } | undefined)?.data ?? response;
    const movieDetail = (payload as { data?: unknown } | undefined)?.data ?? payload;

    return movieDetail as MovieDetails;
  },

};
