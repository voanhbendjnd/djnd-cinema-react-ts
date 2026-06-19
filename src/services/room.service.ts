import axiosClient from './axiosClient'; // adjust to your axios instance path
import type { RoomDTO, RoomDetailDTO } from '../types/room.types';

export const roomService = {
    fetchAllWithPagination: (q: string, page: number, size: number) => {
        return axiosClient.get<IBackendRes<IModelPaginate<RoomDTO>>>('/api/v1/admin/rooms', {
            params: { q, page, size , sort:'lastModifiedDate,desc'},
        });
    },

    createRoom: (payload: RoomDTO) => {
        return axiosClient.post<RoomDetailDTO>('/api/v1/admin/rooms', payload);
    },

    // NOTE: not present in the shared backend snippet yet.
    // Add a corresponding GET /api/v1/admin/rooms/{id} -> RoomDetailDTO endpoint on the backend.
    fetchRoomDetail: (id: number) => {
        return axiosClient.get<RoomDetailDTO>(`/api/v1/admin/rooms/${id}`);
    },
    // room.service.ts
    updateRoom: (payload: RoomDetailDTO) => {
        return axiosClient.put<RoomDetailDTO>('/api/v1/admin/rooms', payload);
    },
    deleteRoom: async (id: number | undefined) => {
        return axiosClient.delete(`/api/v1/admin/rooms/${id}`);
    }
};