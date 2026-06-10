"use client";
import { useEffect, useState } from "react";
import { motion, type Transition } from "framer-motion";
import Link from "next/link";
import { getTodayLog, getWeekLogs } from "@/lib/storage";
import { DayLog } from "@/types";
import { Activity, Flame, Dumbbell, TrendingUp, ChevronRight } from "lucide-react";

const EASE: Transition = { duration: 0.4, ease: "easeOut" };
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { ...EASE, delay } as Transition,
});

export default function Dashboard() {
  const [log,  setLog]  = useState<DayLog | null>(null);
  const [week, setWeek] = useState<DayLog[]>([]);

  useEffect(() => {
    setLog(getTodayLog());
    setWeek(getWeekLogs());
  }, []);

  if (!log) return <PageSkeleton />;

  const totalCals    = log.meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = log.meals.reduce((s, m) => s + m.protein,  0);
  const totalCarbs   = log.meals.reduce((s, m) => s + m.carbs,    0);
  const totalFat     = log.meals.reduce((s, m) => s + m.fat,      0);
  const stepPct      = Math.min(log.steps / 10000, 1);
  const calPct       = Math.min(totalCals / log.calorieGoal, 1);

  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long", month: "long", day: "numeric",
  });

  const workoutStreak = week.filter((d) => d.workedOut).length;

  return (
    <div className="space-y-5 py-4">

      {/* ── Hero card ──────────────────────────────── */}
      <motion.div {...fadeUp(0)} className="hero-green rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        {/* decorative circles */}
        <span className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white opacity-5" />
        <span className="absolute -bottom-6 right-10 w-24 h-24 rounded-full bg-white opacity-5" />

        <p className="text-emerald-100 text-sm font-medium">{today}</p>
        <h1 className="text-3xl font-extrabold mt-1 tracking-tight">
          Good {greeting()}! 👋
        </h1>
        <p className="mt-2 text-emerald-100 text-sm">
          {log.workedOut
            ? "💪 Awesome — workout logged for today!"
            : "🎯 Let's crush your goals today."}
        </p>

        {/* streak badge */}
        {workoutStreak > 0 && (
          <span className="mt-3 inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            🔥 {workoutStreak}-day streak this week
          </span>
        )}
      </motion.div>

      {/* ── Stat rings ─────────────────────────────── */}
      <motion.div {...fadeUp(0.08)} className="grid grid-cols-3 gap-3">
        <RingCard
          label="Steps"
          value={log.steps.toLocaleString()}
          sub={`/ 10,000`}
          pct={stepPct}
          stroke="#10b981"
          bg="linear-gradient(135deg,#d1fae5,#a7f3d0)"
          icon={<Activity size={18} color="#059669" aria-hidden />}
        />
        <RingCard
          label="Calories"
          value={totalCals.toString()}
          sub={`/ ${log.calorieGoal}`}
          pct={calPct}
          stroke="#f59e0b"
          bg="linear-gradient(135deg,#fef3c7,#fde68a)"
          icon={<Flame size={18} color="#d97706" aria-hidden />}
        />
        <RingCard
          label="Workout"
          value={log.workedOut ? "Done!" : "Rest"}
          sub={log.workoutType ?? ""}
          pct={log.workedOut ? 1 : 0}
          stroke={log.workedOut ? "#10b981" : "#9ca3af"}
          bg={log.workedOut ? "linear-gradient(135deg,#d1fae5,#a7f3d0)" : "linear-gradient(135deg,#f3f4f6,#e5e7eb)"}
          icon={<Dumbbell size={18} color={log.workedOut ? "#059669" : "#9ca3af"} aria-hidden />}
        />
      </motion.div>

      {/* ── Macros ─────────────────────────────────── */}
      <motion.section {...fadeUp(0.14)} aria-label="Today's macros" className="surface">
        <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
          <TrendingUp size={18} color="var(--color-primary)" aria-hidden />
          Today&apos;s Macros
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <MacroBar label="Protein" value={totalProtein} max={160} fillColor="#ef4444" bg="#fef2f2" unit="g" />
          <MacroBar label="Carbs"   value={totalCarbs}   max={250} fillColor="#f59e0b" bg="#fefce8" unit="g" />
          <MacroBar label="Fat"     value={totalFat}     max={80}  fillColor="#3b82f6" bg="#eff6ff" unit="g" />
        </div>
      </motion.section>

      {/* ── Weekly streak ──────────────────────────── */}
      {week.length > 0 && (
        <motion.section {...fadeUp(0.20)} aria-label="Weekly workout streak" className="surface">
          <h2 className="font-bold text-gray-800 mb-4">Weekly Streak</h2>
          <div className="flex justify-between gap-1" role="list">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => {
              const dayLog = week[i];
              const worked = dayLog?.workedOut;
              return (
                <div key={i} role="listitem" className="flex flex-col items-center gap-1.5 flex-1">
                  <span className="text-xs text-gray-400 font-medium">{d}</span>
                  <div
                    aria-label={`${d}: ${worked ? "worked out" : dayLog ? "rest day" : "no data"}`}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                    style={{
                      background: worked ? "var(--color-primary)" : dayLog ? "#e5e7eb" : "#f9fafb",
                      color:      worked ? "#fff"                 : dayLog ? "#6b7280" : "#d1d5db",
                      boxShadow:  worked ? "0 2px 8px rgba(5,150,105,.35)" : "none",
                    }}
                  >
                    {worked ? "✓" : dayLog ? "–" : "·"}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* ── Quick actions ──────────────────────────── */}
      <motion.section {...fadeUp(0.26)}>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 stagger">
          {[
            { href: "/tracker", emoji: "📋", label: "Log Today",    sub: "Steps, meals & workout", bg: "hero-green"  },
            { href: "/ai-chef", emoji: "🤖", label: "AI Chef",      sub: "Cook from ingredients",  bg: "hero-purple" },
            { href: "/meals",   emoji: "📖", label: "Meal Library", sub: "Browse & log meals",     bg: "hero-amber"  },
            { href: "/deals",   emoji: "🏷️", label: "Find Deals",   sub: "Cheap groceries nearby", bg: "hero-blue"   },
          ].map(({ href, emoji, label, sub, bg }) => (
            <Link
              key={href}
              href={href}
              className={`${bg} rounded-2xl p-4 text-white shadow-md card-hover animate-fade-in-up flex flex-col gap-1`}
              aria-label={`${label} — ${sub}`}
            >
              <span className="text-2xl" role="img" aria-hidden>{emoji}</span>
              <span className="font-extrabold text-base">{label}</span>
              <span className="text-white/75 text-xs">{sub}</span>
              <ChevronRight size={14} className="self-end mt-1 opacity-60" aria-hidden />
            </Link>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/* ── Ring stat card ─────────────────────────────────────────────────────── */
function RingCard({
  label, value, sub, pct, stroke, bg, icon,
}: {
  label: string; value: string; sub: string;
  pct: number; stroke: string; bg: string; icon: React.ReactNode;
}) {
  const r    = 32;
  const circ = 2 * Math.PI * r;
  return (
    <article
      aria-label={`${label}: ${value} ${sub}`}
      className="rounded-2xl p-3 flex flex-col items-center gap-1.5 shadow-sm"
      style={{ background: bg }}
    >
      <div className="relative">
        <svg width="76" height="76" role="img" aria-hidden>
          <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="7" />
          <circle
            cx="38" cy="38" r={r} fill="none"
            stroke={stroke} strokeWidth="7"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">{icon}</div>
      </div>
      <span className="font-extrabold text-sm text-gray-800 text-center leading-tight">{value}</span>
      <span className="text-xs text-gray-500 text-center">{sub || label}</span>
      <span className="text-xs font-semibold text-gray-600">{label}</span>
    </article>
  );
}

/* ── Macro progress bar ─────────────────────────────────────────────────── */
function MacroBar({
  label, value, max, fillColor, bg, unit,
}: {
  label: string; value: number; max: number; fillColor: string; bg: string; unit: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: bg }}>
      <div className="text-xl font-extrabold text-gray-800">
        {value}<span className="text-sm font-semibold text-gray-500 ml-0.5">{unit}</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          role="progressbar"
          aria-valuenow={value}
          aria-valuemax={max}
          aria-label={label}
          style={{ width: `${pct}%`, background: fillColor }}
        />
      </div>
      <div className="text-xs font-semibold text-gray-600">{label}</div>
    </div>
  );
}

/* ── Skeleton loader ────────────────────────────────────────────────────── */
function PageSkeleton() {
  return (
    <div className="space-y-5 py-4" aria-busy="true" aria-label="Loading dashboard">
      <div className="skeleton h-36 rounded-3xl" />
      <div className="grid grid-cols-3 gap-3">
        {[0,1,2].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
      </div>
      <div className="skeleton h-28 rounded-2xl" />
    </div>
  );
}

