"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  LayoutDashboard, ClipboardList, BookOpen,
  Sparkles, Tag, ShoppingCart,
} from "lucide-react";
import styles from "./Nav.module.css";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/",        label: "Dashboard", icon: LayoutDashboard },
  { href: "/tracker", label: "Tracker",   icon: ClipboardList   },
  { href: "/meals",   label: "Meals",     icon: BookOpen        },
  { href: "/ai-chef", label: "AI Chef",   icon: Sparkles        },
  { href: "/deals",   label: "Deals",     icon: Tag             },
  { href: "/budget",  label: "Budget",    icon: ShoppingCart    },
];

function useRipple() {
  return useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const btn  = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const el   = document.createElement("span");
    el.className      = styles.ripple;
    el.style.top      = `${e.clientY - rect.top}px`;
    el.style.left     = `${e.clientX - rect.left}px`;
    btn.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }, []);
}

export default function Nav() {
  const pathname  = usePathname();
  const addRipple = useRipple();

  return (
    <>
      {/* ══════════════════════════ Desktop header ═══════════════════════════ */}
      <header className={styles.header} role="banner">
        <div className={styles.inner}>

          <Link href="/" className={styles.logo} aria-label="Go to FitFuel dashboard">
            <span className={styles.logoEmoji} role="img" aria-hidden="true">🥗</span>
            <span>
              <span className={styles.logoText}>FitFuel</span>
              <span className={styles.logoTag}>Track · Eat · Move</span>
            </span>
          </Link>

          <nav aria-label="Main navigation">
            <ul className={styles.desktopNav} role="list">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <li key={href} role="listitem">
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      aria-label={label}
                      className={`${styles.navLink} ${active ? styles.active : ""}`}
                      onClick={addRipple}
                    >
                      <Icon size={14} aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={styles.rightSlot}>
            <ThemeToggle />
          </div>

        </div>
      </header>

      {/* ══════════════════════════ Mobile bottom bar ════════════════════════ */}
      <nav className={styles.mobileNav} aria-label="Mobile navigation">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`${styles.mobileLink} ${active ? styles.active : ""}`}
            >
              <Icon size={20} aria-hidden="true" />
              <span className={styles.mobileLinkLabel}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
