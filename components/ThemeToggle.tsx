"use client";
import { useTheme } from "./ThemeProvider";
import styles from "./ThemeToggle.module.css";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={styles.toggle}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {/* Track */}
      <span className={`${styles.track} ${isDark ? styles.trackDark : ""}`} aria-hidden="true">
        {/* Sliding thumb */}
        <span className={`${styles.thumb} ${isDark ? styles.thumbDark : ""}`}>
          {isDark
            ? <Moon  size={11} strokeWidth={2.5} className={styles.icon} />
            : <Sun   size={11} strokeWidth={2.5} className={styles.icon} />
          }
        </span>
      </span>

      {/* Label */}
      <span className={styles.label}>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
