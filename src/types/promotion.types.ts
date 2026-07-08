export type PromotionStatus = 'Active' | 'Upcoming' | 'Expired';

export interface IPromotion {
  id: number;
  title: string;
  detail?: string;
  discountPercentage: number;
  quantity?: number;      // số lượng voucher, >= 0
  releaseDate?: string;   // ngày công khai voucher (hiện tại hoặc tương lai)
  isActive?: boolean;     // voucher đang hoạt động hay tạm dừng
  startTime: string; // ISO LocalDateTime string
  endTime: string;
  thumbnailUrl?: string;
  status: PromotionStatus; // computed by backend, not stored in DB
}

export interface IPromotionRequest {
  title: string;
  detail?: string;
  discountPercentage: number;
  quantity?: number;
  releaseDate?: string;
  isActive?: boolean;
  startTime: string;
  endTime: string;
  thumbnailUrl?: string;
}

