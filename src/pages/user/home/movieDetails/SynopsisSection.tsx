import { colors } from "@/styles/theme.ts";

interface SynopsisSectionProps {
    description: string;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3
            style={{
                margin: 0, fontSize: 24, fontWeight: 600, lineHeight: "32px",
                color: colors.primary, borderLeft: `4px solid ${colors.primary}`, paddingLeft: 16,
            }}
        >
            {children}
        </h3>
    );
}

export default function SynopsisSection({ description }: SynopsisSectionProps) {
    return (
        <article style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <SectionTitle>Description</SectionTitle>
            <p style={{ margin: 0, fontSize: 18, lineHeight: "28px", color: colors.onSurfaceVariant }}>
                {description}
            </p>
        </article>
    );
}