export type PromotionStatus = 'Active' | 'Upcoming' | 'Expired';

export interface IPromotion {
  id: number;
  title: string;
  detail?: string;
  discountPercentage: number;
  startTime: string; // ISO LocalDateTime string
  endTime: string;
  thumbnailUrl?: string;
  status: PromotionStatus; // computed by backend, not stored in DB
}

export interface IPromotionRequest {
  title: string;
  detail?: string;
  discountPercentage: number;
  startTime: string;
  endTime: string;
  thumbnailUrl?: string;
}
