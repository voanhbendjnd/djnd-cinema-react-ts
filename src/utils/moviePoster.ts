import { baseURL } from '@/services/axiosClient';

// [2026-06-27] Tạo URL poster đúng format /api/v1/files/{folder}/{filename}
export function getMoviePosterSrc(posterUrl?: string | null): string {
    if (!posterUrl) return '';

    const normalized = posterUrl.replace(/\\/g, '/');

    if (/^https?:\/\//i.test(normalized)) return normalized;
    if (normalized.startsWith('/api/v1/files/')) return `${baseURL}${normalized}`;
    if (normalized.startsWith('api/v1/files/')) return `${baseURL}/${normalized}`;

    return `${baseURL}/api/v1/files/${normalized}`;
}
