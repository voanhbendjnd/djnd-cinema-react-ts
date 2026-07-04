import { Avatar } from "antd";
import { RightOutlined } from "@ant-design/icons";
import type { CastMember } from "@/types/movie.types.ts";
import { SectionTitle } from "./SynopsisSection.tsx";
import { colors } from "@/styles/theme.ts";
import { useState } from "react";

interface CastCrewSectionProps {
    cast: CastMember[];
    onViewAll?: () => void;
}

function CastCard({ member }: { member: CastMember }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 12,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <Avatar
                src={member.photo}
                size={96}
                style={{
                    border: `2px solid ${hovered ? colors.primary : "transparent"}`,
                    transition: "border-color 0.3s",
                    cursor: "default",
                }}
                alt={member.name}
            />
            <div>
                <p
                    style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 700,
                        color: colors.onSurface,
                        lineHeight: "18px",
                    }}
                >
                    {member.name}
                </p>
                <p
                    style={{
                        margin: 0,
                        fontSize: 13,
                        color: colors.onSurfaceVariant,
                        lineHeight: "18px",
                    }}
                >
                    {member.role}
                </p>
            </div>
        </div>
    );
}

export default function CastCrewSection({
                                            cast,
                                            onViewAll,
                                        }: CastCrewSectionProps) {
    return (
        <article style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <SectionTitle>Cast &amp; Crew</SectionTitle>
                <button
                    onClick={onViewAll}
                    style={{
                        background: "none",
                        border: "none",
                        color: colors.primary,
                        fontWeight: 500,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: 0,
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.textDecoration =
                            "underline";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.textDecoration = "none";
                    }}
                >
                    View All <RightOutlined style={{ fontSize: 14 }} />
                </button>
            </div>

            {/* Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: 24,
                }}
            >
                {cast.map((member) => (
                    <CastCard key={member.id} member={member} />
                ))}
            </div>
        </article>
    );
}