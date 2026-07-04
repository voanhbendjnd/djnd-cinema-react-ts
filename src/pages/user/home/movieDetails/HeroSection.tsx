import {Button, Tag} from "antd";
import {ClockCircleOutlined, PlayCircleOutlined, CalendarOutlined} from "@ant-design/icons";
import type {MovieDetails, MovieStatus} from "@/types/movie.types.ts";
import {colors} from "@/styles/theme.ts";
import dayjs from "dayjs";
import {baseURL} from "@/services/axiosClient.ts";
import {useDominantColor} from "@/utils/use.dominant.color.ts";
import 'dayjs/locale/en';

interface HeroSectionProps {
    movie: MovieDetails;
    onBookNow?: () => void;
    onWatchTrailer?: () => void;
}

// Label hiển thị cho genre và status
const GENRE_LABELS: Record<string, string> = {
    ACTION: "ACTION", COMEDY: "COMEDY", DRAMA: "DRAMA",
    HORROR: "HORROR", ROMANCE: "ROMANCE", FAMILY: "FAMILY",
    TRAGEDY: "TRAGEDY", HISTORICAL: "HISTORICAL",
    MUSICAL: "MUSICAL", CARTOON: "CARTOON"

};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    SHOWING: {label: "SHOWING", color: "#52c41a"},
    UPCOMING: {label: "UPCOMING", color: colors.primary},
    ENDED: {label: "ENDED", color: colors.onSurfaceVariant},
};

function getStatusConfig(status: MovieStatus) {
    return STATUS_CONFIG[status] ?? {label: status, color: colors.onSurfaceVariant};
}

export default function HeroSection({movie, onBookNow, onWatchTrailer}: HeroSectionProps) {
    const statusCfg = getStatusConfig(movie.movieStatus);
    const genreLabel = GENRE_LABELS[movie.genre] ?? movie.genre;
    const releaseYear = movie.releaseDate ? dayjs(movie.releaseDate).format("DD/MM/YYYY") : "";

    // Poster luôn đi qua baseURL, dùng chung 1 nguồn cho cả nền và ảnh chính
    const posterSrc = `${baseURL}/api/v1/files/${movie.posterUrl}`;

    // Màu chủ đạo tách từ chính poster -> nền hero sẽ "mang màu" của phim
    const dominantColor = useDominantColor(posterSrc, colors.background);

    return (
        <section style={{position: "relative", width: "100%", height: 870, overflow: "hidden"}}>
            {/* Background */}
            <div style={{position: "absolute", inset: 0, zIndex: 0, backgroundColor: dominantColor, transition: "background-color 0.6s ease"}}>
                {/* Lớp poster blur mờ để thêm chất liệu, không còn là nguồn màu chính */}
                <div
                    style={{
                        width: "100%", height: "100%",
                        backgroundImage: `url('${posterSrc}')`,
                        backgroundSize: "cover", backgroundPosition: "center",
                        transform: "scale(1.05)",
                        filter: "blur(30px) saturate(1.3)",
                        opacity: 0.55,
                    }}
                />
                {/* Wash theo màu chủ đạo, giúp ảnh blur hòa vào nền thay vì nổi lên như ảnh riêng */}
                <div
                    style={{
                        position: "absolute", inset: 0,
                        background: `radial-gradient(120% 100% at 50% 100%, transparent 0%, ${dominantColor} 75%)`,
                        transition: "background 0.6s ease",
                    }}
                />
                {/* Gradient tối dần về phía dưới để chữ luôn đọc rõ */}
                <div
                    style={{
                        position: "absolute", inset: 0,
                        background: `linear-gradient(to top, ${colors.background} 10%, ${colors.background}99 50%, transparent 100%)`,
                    }}
                />
            </div>

            {/* Content */}
            <div
                style={{
                    position: "relative", zIndex: 10, height: "100%",
                    maxWidth: 1280, margin: "0 auto",
                    padding: "0 48px 80px",
                    display: "flex", alignItems: "flex-end", gap: 24,
                }}
            >
                {/* Poster */}
                <div
                    style={{
                        width: 288, flexShrink: 0,
                        transform: "rotate(-2deg)", transition: "transform 0.5s",
                        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = "rotate(0deg)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = "rotate(-2deg)";
                    }}
                >
                    <img
                        src={posterSrc}
                        alt={`${movie.title} poster`}
                        style={{
                            width: "100%", height: "auto", display: "block",
                            borderRadius: 12, border: `1px solid ${colors.surfaceVariant}`,
                        }}
                    />
                </div>

                {/* Info */}
                <div style={{flex: 1, display: "flex", flexDirection: "column", gap: 24}}>
                    {/* Badges row */}
                    <div style={{display: "flex", flexDirection: "column", gap: 10}}>
                        <div style={{display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap"}}>
                            {/* Status badge */}
                            <Tag
                                style={{
                                    backgroundColor: `${statusCfg.color}22`,
                                    borderColor: statusCfg.color,
                                    color: statusCfg.color,
                                    fontWeight: 700, fontSize: 12,
                                    letterSpacing: "0.1em", textTransform: "uppercase",
                                    borderRadius: 4, margin: 0,
                                }}
                            >
                                {statusCfg.label}
                            </Tag>

                            {/* Duration */}
                            <span style={{
                                color: colors.onSurfaceVariant,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 13
                            }}>
                <ClockCircleOutlined/>
                                {movie.durationMunutes} phút
              </span>

                            {/* Release date */}
                            {releaseYear && (
                                <span style={{
                                    color: colors.onSurfaceVariant,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    fontSize: 13
                                }}>
                  <CalendarOutlined/>
                                    {releaseYear}
                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h2
                            style={{
                                margin: 0, fontSize: 48, fontWeight: 700,
                                lineHeight: "56px", letterSpacing: "-0.02em",
                                color: colors.onSurface,
                            }}
                        >
                            {movie.title}
                        </h2>

                        {/* Genre + Director */}
                        <div style={{display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap"}}>
              <span
                  style={{
                      color: colors.onSecondaryContainer,
                      backgroundColor: `${colors.secondaryContainer}4D`,
                      border: `1px solid ${colors.outlineVariant}`,
                      borderRadius: 9999, padding: "4px 12px",
                      fontSize: 13, fontWeight: 500,
                  }}
              >
                {genreLabel}
              </span>
                            <span style={{color: colors.onSurfaceVariant, fontSize: 13}}>
                 🎬 Director: <strong>{movie.director}</strong>
              </span>
                        </div>
                    </div>

                    {/* CTA */}
                    <div style={{display: "flex", gap: 16, flexWrap: "wrap", paddingTop: 16}}>
                        <Button
                            onClick={onBookNow}
                            disabled={movie.movieStatus !== "SHOWING"}
                            style={{
                                backgroundColor: movie.movieStatus === "SHOWING" ? colors.primary : colors.surfaceVariant,
                                borderColor: "transparent",
                                color: movie.movieStatus === "SHOWING" ? colors.onPrimary : colors.onSurfaceVariant,
                                fontWeight: 700, height: 56, padding: "0 40px",
                                borderRadius: 12, fontSize: 16,
                                display: "flex", alignItems: "center", gap: 12,
                                boxShadow: movie.movieStatus === "SHOWING" ? `0 8px 24px ${colors.statusGoldGlow}` : "none",
                                cursor: movie.movieStatus === "SHOWING" ? "pointer" : "not-allowed",
                            }}
                        >
                            🎟 Book Now
                        </Button>

                        <Button
                            onClick={onWatchTrailer}
                            icon={<PlayCircleOutlined/>}
                            style={{
                                backgroundColor: "transparent",
                                borderColor: colors.primary, color: colors.primary,
                                fontWeight: 700, height: 56, padding: "0 32px",
                                borderRadius: 12, fontSize: 16,
                                display: "flex", alignItems: "center", gap: 12,
                            }}
                        >
                            View Trailer
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}