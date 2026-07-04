import type { ThemeConfig } from "antd";

// ─── Design Tokens ────────────────────────────────────────────────────────────
export const colors = {
    primary: "#ffd552",
    primaryContainer: "#e5b80b",
    primaryFixedDim: "#efc11c",
    onPrimary: "#3d2f00",
    onPrimaryContainer: "#5e4a00",

    background: "#121414",
    surface: "#121414",
    surfaceDim: "#121414",
    surfaceBright: "#37393a",
    surfaceContainerLowest: "#0c0f0f",
    surfaceContainerLow: "#1a1c1c",
    surfaceContainer: "#1e2020",
    surfaceContainerHigh: "#282a2b",
    surfaceContainerHighest: "#333535",
    surfaceVariant: "#333535",
    surfaceElevated: "#262626",

    onSurface: "#e2e2e2",
    onSurfaceVariant: "#d1c5ac",
    onBackground: "#e2e2e2",

    secondary: "#c8c6c5",
    secondaryContainer: "#474746",
    onSecondary: "#313030",
    onSecondaryContainer: "#b7b5b4",

    outline: "#9a9079",
    outlineVariant: "#4e4633",

    error: "#ffb4ab",
    errorContainer: "#93000a",
    onError: "#690005",
    onErrorContainer: "#ffdad6",

    tertiary: "#b7deff",
    tertiaryContainer: "#76c5ff",
    onTertiary: "#00344f",

    inverseOnSurface: "#2f3131",
    inverseSurface: "#e2e2e2",
    inversePrimary: "#745b00",
    surfaceTint: "#efc11c",

    textSecondary: "#A6A6A6",
    statusGoldGlow: "rgba(229, 184, 11, 0.2)",
} as const;

// ─── Ant Design Theme Override ─────────────────────────────────────────────────
export const antdTheme: ThemeConfig = {
    token: {
        colorPrimary: colors.primary,
        colorBgBase: colors.background,
        colorTextBase: colors.onSurface,
        colorBorder: colors.outlineVariant,
        colorBorderSecondary: colors.surfaceVariant,
        borderRadius: 4,
        borderRadiusLG: 8,
        borderRadiusXL: 12,
        fontFamily: "'Inter', sans-serif",
    },
    components: {
        Button: {
            colorPrimary: colors.primaryContainer,
            colorPrimaryHover: colors.primaryFixedDim,
            defaultBg: "transparent",
            defaultBorderColor: colors.outlineVariant,
            defaultColor: colors.onSurface,
        },
        Menu: {
            darkItemBg: "transparent",
            darkItemColor: colors.onSurfaceVariant,
            darkItemSelectedColor: colors.primary,
            itemSelectedBg: "transparent",
        },
        Input: {
            colorBgContainer: colors.surfaceContainer,
            colorBorder: colors.outlineVariant,
            activeBorderColor: colors.primary,
            hoverBorderColor: colors.primary,
        },
    },
};