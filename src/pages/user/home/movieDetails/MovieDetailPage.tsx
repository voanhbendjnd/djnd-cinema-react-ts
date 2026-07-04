import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Spin, Result } from "antd";
import type { MovieDetails } from "@/types/movie.types.ts";
import { movieService } from "@/services/movie.service.ts";
import { getMoviePosterSrc } from "@/utils/moviePoster";
import HeroSection from "@/pages/user/home/movieDetails/HeroSection.tsx";
import SynopsisSection from "@/pages/user/home/movieDetails/SynopsisSection";
import ShowtimesPanel from "@/pages/user/home/movieDetails/ShowtimesPanel";
import { colors } from "@/styles/theme.ts";
import {extractMovieId} from "@/utils/generate.slug.ts";
import 'dayjs/locale/en';

// ── Lấy màu trung bình của poster để làm nền trang ─────────
function useDominantColor(imageUrl?: string | null) {
    const [color, setColor] = useState<[number, number, number] | null>(null);

    useEffect(() => {
        if (!imageUrl) {
            setColor(null);
            return;
        }

        let cancelled = false;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;

        img.onload = () => {
            try {
                const size = 24; // downsample nhỏ cho nhanh, chỉ cần màu trung bình
                const canvas = document.createElement("canvas");
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.drawImage(img, 0, 0, size, size);
                const { data } = ctx.getImageData(0, 0, size, size);

                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] < 128) continue; // bỏ pixel trong suốt
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                    count++;
                }
                if (count === 0 || cancelled) return;
                setColor([Math.round(r / count), Math.round(g / count), Math.round(b / count)]);
            } catch {
                // Canvas bị "tainted" do CORS (ảnh khác domain không cho phép đọc pixel)
                // -> im lặng bỏ qua, dùng màu nền mặc định
                if (!cancelled) setColor(null);
            }
        };
        img.onerror = () => {
            if (!cancelled) setColor(null);
        };

        return () => {
            cancelled = true;
        };
    }, [imageUrl]);

    return color;
}

const toRgb = (c: [number, number, number], alpha = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
const darken = (c: [number, number, number], factor: number): [number, number, number] => [
    Math.round(c[0] * factor),
    Math.round(c[1] * factor),
    Math.round(c[2] * factor),
];

export default function MovieDetailPage() {
    const [movie, setMovie] = useState<MovieDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { slug } = useParams();
    const movieId = extractMovieId(slug ?? "");

    useEffect(() => {
        // Slug không hợp lệ / không tách được id -> báo lỗi ngay, tránh treo spinner mãi mãi
        if (!movieId) {
            setLoading(false);
            setError("Đường dẫn phim không hợp lệ.");
            return;
        }

        setLoading(true);
        setError(null);

        movieService
            .getMovieDetail(movieId )
            .then((data) => setMovie(data))
            .catch(() => setError("Không thể tải thông tin phim. Vui lòng thử lại."))
            .finally(() => setLoading(false));
    }, [movieId]);

    const posterSrc = movie ? getMoviePosterSrc(movie.posterUrl) : null;
    const dominantColor = useDominantColor(posterSrc);

    // Nền trang: pha màu chủ đạo từ poster (tối lại để giữ độ tương phản chữ),
    // đổ dần về màu nền gốc của theme khi cuộn xuống.
    const pageBackground = dominantColor
        ? `linear-gradient(180deg, ${toRgb(darken(dominantColor, 0.55))} 0%, ${toRgb(
            darken(dominantColor, 0.25)
        )} 420px, ${colors.background} 900px)`
        : colors.background;

    // ── Loading ────────────────────────────────────────────
    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: colors.background,
                }}
            >
                <Spin size="large" />
            </div>
        );
    }

    // ── Error ──────────────────────────────────────────────
    if (error || !movie) {
        return (
            <div
                style={{
                    minHeight: "100vh", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: colors.background,
                }}
            >
                <Result
                    status="error"
                    title="Có lỗi xảy ra"
                    subTitle={error ?? "Không tìm thấy phim"}
                />
            </div>
        );
    }

    // ── Main ───────────────────────────────────────────────
    return (
        <main
            style={{
                paddingTop: 64,
                paddingBottom: 96,
                minHeight: "100vh",
                background: pageBackground,
                transition: "background 0.8s ease",
            }}
        >
            <HeroSection
                movie={movie}
                onBookNow={() => console.log("Book Now clicked")}
                onWatchTrailer={() => console.log("Watch Trailer clicked")}
            />

            <section
                style={{
                    maxWidth: 1280, margin: "0 auto",
                    padding: "48px 48px 0",
                    display: "grid", gridTemplateColumns: "1fr", gap: 48,
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
                        gap: 48, alignItems: "start",
                    }}
                >
                    {/* Left */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
                        <SynopsisSection description={movie.description} />
                    </div>

                    {/* Right */}
                    <ShowtimesPanel
                        showtimes={movie.showtimes}
                        onSelectSeats={(showtime) =>
                            console.log("Selected showtime:", showtime)
                        }
                    />
                </div>
            </section>
        </main>
    );
}