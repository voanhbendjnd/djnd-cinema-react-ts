import axiosClient from './axiosClient';

export interface MovieRoomTimeDTORequest {
  duration: number;
  date: string;
  time: string;
  roomName: string;
  roomId: number;
  movieId: number;
}

// Mirrors ShowtimeProjection from backend
export interface ShowtimeOccupied {
  title: string;
  startDateTime: string; // ISO datetime string
  endDateTime: string;
}

export const showtimeService = {
  checkConflict: async (data: MovieRoomTimeDTORequest): Promise<IBackendRes<void>> => {
    const response = await axiosClient.post('/api/v1/admin/showtimes/check', data);
    return response as unknown as IBackendRes<void>;
  },

  getAllTimeAtDateByRoom: async (
      roomId: number,
      date: string,
      movieId: number
  ): Promise<IBackendRes<ShowtimeOccupied[]>> => {
    const response = await axiosClient.post('/api/v1/admin/showtimes', { roomId, date, movieId });
    return response as unknown as IBackendRes<ShowtimeOccupied[]>;
  },
};