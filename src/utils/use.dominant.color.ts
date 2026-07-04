import { useEffect, useState } from "react";

/**
 * Tải ảnh, vẽ xuống canvas nhỏ, lấy màu trung bình (dominant color) của ảnh.
 * Trả về chuỗi rgb(...) hoặc fallback nếu ảnh lỗi CORS / chưa tải xong.
 */
export function useDominantColor(imageUrl: string | undefined, fallback = "rgb(20, 20, 20)") {
    const [color, setColor] = useState(fallback);

    useEffect(() => {
        if (!imageUrl) {
            setColor(fallback);
            return;
        }

        let cancelled = false;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;

        img.onload = () => {
            if (cancelled) return;
            try {
                const canvas = document.createElement("canvas");
                // Downscale mạnh để tính trung bình nhanh + giảm nhiễu chi tiết nhỏ
                const SAMPLE_SIZE = 24;
                canvas.width = SAMPLE_SIZE;
                canvas.height = SAMPLE_SIZE;

                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
                const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    const alpha = data[i + 3];
                    if (alpha < 100) continue; // bỏ pixel gần như trong suốt
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                    count++;
                }

                if (count === 0) return;
                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);

                // Làm tối bớt để chữ trắng vẫn đọc rõ trên nền
                const darken = 0.55;
                r = Math.round(r * darken);
                g = Math.round(g * darken);
                b = Math.round(b * darken);

                if (!cancelled) setColor(`rgb(${r}, ${g}, ${b})`);
            } catch {
                // Canvas bị "tainted" do CORS -> giữ màu fallback
                if (!cancelled) setColor(fallback);
            }
        };

        img.onerror = () => {
            if (!cancelled) setColor(fallback);
        };

        return () => {
            cancelled = true;
        };
    }, [imageUrl, fallback]);

    return color;
}