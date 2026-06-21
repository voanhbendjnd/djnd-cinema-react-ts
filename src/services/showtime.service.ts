import axiosClient from './axiosClient';

export interface MovieRoomTimeDTORequest {
  duration: number;
  date: string;
  time: string;
  roomName: string;
  roomId: number;
}

export const showtimeService = {
  checkConflict: async (data: MovieRoomTimeDTORequest): Promise<IBackendRes<void>> => {
    const response = await axiosClient.post('/api/v1/admin/showtimes/check', data);
    return response as unknown as IBackendRes<void>;
  },

  getAllTimeAtDateByRoom: async (roomId: number, date: string): Promise<IBackendRes<string[]>> => {
    const response = await axiosClient.post('/api/v1/admin/showtimes', { roomId, date });
    return response as unknown as IBackendRes<string[]>;
  }
};
