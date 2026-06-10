export const Colors = {
  primary: "#10b981",
  primaryDark: "#059669",
  primaryLight: "#d1fae5",
  secondary: "#f59e0b",
  accent: "#8b5cf6",
  danger: "#ef4444",
  info: "#3b82f6",

  bg: "#f9fafb",
  surface: "#ffffff",
  border: "#e5e7eb",
  borderStrong: "#9ca3af",

  text: "#111827",
  textSecondary: "#374151",
  textMuted: "#6b7280",
  textPlaceholder: "#9ca3af",

  tabBar: "#ffffff",
  tabBarBorder: "#e5e7eb",
  tabActive: "#10b981",
  tabInactive: "#9ca3af",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const Font = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

export const Shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
};
