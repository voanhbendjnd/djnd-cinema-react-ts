import dayjs from 'dayjs';
import 'dayjs/locale/en';

interface ExchangeInfo {
    canExchange: boolean;
    reason?: string;
    points: number;
    percentage: number;
    daysRemaining: number;
}

export const useExchangePoints = (
    showtime: string | null | undefined,
    price: number | null | undefined
): ExchangeInfo => {
    if (!showtime || price == null) {
        return {
            canExchange: false,
            reason: 'Invalid ticket data',
            points: 0,
            percentage: 0,
            daysRemaining: 0,
        };
    }

    const now = dayjs();
    const showtimeCal = dayjs(showtime);
    const daysRemaining = showtimeCal.diff(now, 'day', true);
    // console.log(startDateTime)
    // ✅ Check if movie already started
    if (now.isAfter(showtime)) {
        return {
            canExchange: false,
            reason: 'Movie already started',
            points: 0,
            percentage: 0,
            daysRemaining: 0,
        };
    }

    // ✅ Check if less than 1 day remaining
    if (daysRemaining < 1) {
        return {
            canExchange: false,
            reason: 'Cannot exchange within 1 day of showtime',
            points: 0,
            percentage: 0,
            daysRemaining,
        };
    }

    // ✅ Calculate points based on days remaining
    let percentage = 0;
    if (daysRemaining > 7) {
        percentage = 80;
    } else if (daysRemaining > 5) {
        percentage = 70;
    } else if (daysRemaining > 3) {
        percentage = 60;
    } else if (daysRemaining > 2) {
        percentage = 50;
    } else if (daysRemaining > 1) {
        percentage = 40;
    }

    const points = Math.floor((price * percentage) / 100);

    return {
        canExchange: true,
        points,
        percentage,
        daysRemaining,
    };
};