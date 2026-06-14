import axiosClient from '@/services/axiosClient';
import type { AdminMovieDTO } from '@/types/movie.types';

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
  fetchMovieById: async (id:number): Promise<IBackendRes<AdminMovieDTO>> => {
    const response = await axiosClient.get(`/api/v1/admin/movies/${id}`);
    return response as unknown as IBackendRes<AdminMovieDTO>;
  },

  fetchAllMovieWithPagination: async (q: string, page: number, size: number, sort:string): Promise<IBackendRes<IModelPaginate<AdminMovieDTO>>> => {
    const response = await axiosClient.get('/api/v1/admin/movies', {
      params: { q, page, size, sort },
    });
    return response as unknown as IBackendRes<IModelPaginate<AdminMovieDTO>>;
  },
};
