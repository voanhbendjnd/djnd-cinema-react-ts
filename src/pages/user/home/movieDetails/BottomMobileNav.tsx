import {
    HomeOutlined,
    VideoCameraOutlined,
    PlaySquareOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { colors } from "@/styles/theme.ts";

const NAV_ITEMS = [
    { icon: <HomeOutlined />, label: "Home", href: "#", active: false },
    { icon: <VideoCameraOutlined />, label: "Movies", href: "#", active: true },
    { icon: <PlaySquareOutlined />, label: "Cinemas", href: "#", active: false },
    { icon: <UserOutlined />, label: "Profile", href: "#", active: false },
];

export default function BottomMobileNav() {
    return (
        <nav
            style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                backgroundColor: colors.surfaceContainerLow,
                borderRadius: "12px 12px 0 0",
                boxShadow: "0 -4px 20px rgba(0,0,0,0.4)",
                height: 64,
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                padding: "0 16px",
                // Only show on mobile – use CSS media query via a style tag or Tailwind;
                // here we inline a class hint. In practice add a CSS class or use a
                // responsive utility.
            }}
            className="md:hidden"
        >
            {NAV_ITEMS.map((item) => (
                <a
                    key={item.label}
                    href={item.href}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: item.active ? colors.primary : colors.onSurfaceVariant,
                        textDecoration: "none",
                        gap: 2,
                        transition: "transform 0.15s",
                        fontSize: 13,
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.transform =
                            "scale(0.95)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
                    }}
                >
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{item.label}</span>
                </a>
            ))}
        </nav>
    );
}