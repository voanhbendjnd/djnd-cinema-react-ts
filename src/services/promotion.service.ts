import axiosClient from './axiosClient';
const BASE_URL = '/api/promotions';

export const promotionService = {
    /**
     * GET /api/promotions — paginated list with optional search query
     */
    getPromotions: (page: number = 1, size: number = 10, q?: string) => {
        const params: Record<string, unknown> = { page, size };
        if (q && q.trim()) params['q'] = q.trim();
        return axiosClient.get<IBackendRes<IModelPaginate<IPromotion>>>(BASE_URL, { params });
    },

    /**
     * GET /api/promotions/:id — fetch single promotion
     */
    getPromotionById: (id: number) => {
        return axiosClient.get<IBackendRes<IPromotion>>(`${BASE_URL}/${id}`);
    },

    /**
     * POST /api/promotions — create new promotion
     */
    createPromotion: (dto: Omit<IPromotion, 'id' | 'status'>) => {
        return axiosClient.post<IBackendRes<IPromotion>>(BASE_URL, dto);
    },

    /**
     * PUT /api/promotions/:id — update promotion
     */
    updatePromotion: (id: number, dto: Partial<Omit<IPromotion, 'id' | 'status'>>) => {
        return axiosClient.put<IBackendRes<IPromotion>>(`${BASE_URL}/${id}`, dto);
    },

    /**
     * DELETE /api/promotions/:id — delete promotion (blocked if Active)
     */
    deletePromotion: (id: number) => {
        return axiosClient.delete<IBackendRes<void>>(`${BASE_URL}/${id}`);
    },
};
