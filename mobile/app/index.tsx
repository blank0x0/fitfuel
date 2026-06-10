import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Dimensions,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { getTodayLog, getWeekLogs } from "../lib/storage";
import { Colors, Spacing, Radius, Shadow, Font } from "../lib/theme";
import type { DayLog } from "../types";

const { width: W } = Dimensions.get("window");
const RING = 90;
const STROKE = 10;

function Arc({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(value / max, 1);
  return (
    <View style={{ width: RING, height: RING, alignItems: "center", justifyContent: "center" }}>
      <View style={[styles.ringTrack, { borderColor: color + "22", width: RING, height: RING }]} />
      <View
        style={[
          styles.ringFill,
          {
            borderColor: color,
            width: RING,
            height: RING,
            borderTopColor: pct > 0.75 ? color : "transparent",
            borderRightColor: pct > 0.25 ? color : "transparent",
            borderBottomColor: pct > 0.5 ? color : "transparent",
            borderLeftColor: "transparent",
            transform: [{ rotate: `${pct * 360 - 45}deg` }],
          },
        ]}
      />
    </View>
  );
}

function StatCard({
  label, value, max, unit, color, icon,
}: {
  label: string; value: number; max: number; unit: string; color: string; icon: string;
}) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <View style={[styles.statCard, Shadow.md]}>
      <View style={[styles.statIcon, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>
        {value.toLocaleString()}<Text style={styles.statUnit}> {unit}</Text>
      </Text>
      <View style={styles.statBar}>
        <View style={[styles.statBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.statPct}>{pct}% of goal</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const [log, setLog] = useState<DayLog | null>(null);
  const [weekLogs, setWeekLogs] = useState<DayLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [today, week] = await Promise.all([getTodayLog(), getWeekLogs()]);
    setLog(today);
    setWeekLogs(week);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (!log) return <View style={styles.loading}><Text style={styles.loadingText}>Loading…</Text></View>;

  const calories = log.meals.reduce((s, m) => s + m.calories, 0);
  const protein  = log.meals.reduce((s, m) => s + m.protein, 0);
  const streak   = weekLogs.filter((d) => d.workedOut).length;
  const today    = new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* ── Hero ─────────────────────────────────────────── */}
      <LinearGradient colors={["#059669", "#10b981", "#34d399"]} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View>
          <Text style={styles.heroGreeting}>Good {getGreeting()} 👋</Text>
          <Text style={styles.heroDate}>{today}</Text>
        </View>
        <View style={[styles.heroBadge, { backgroundColor: log.workedOut ? "#fff3" : "#fff1" }]}>
          <Ionicons name={log.workedOut ? "checkmark-circle" : "body"} size={16} color="#fff" />
          <Text style={styles.heroBadgeText}>{log.workedOut ? "Worked out!" : "No workout yet"}</Text>
        </View>
      </LinearGradient>

      {/* ── Stats grid ───────────────────────────────────── */}
      <View style={styles.grid}>
        <StatCard label="Steps"    value={log.steps}   max={10000}          unit="steps"    color={Colors.info}      icon="footsteps" />
        <StatCard label="Calories" value={calories}     max={log.calorieGoal} unit="kcal"   color={Colors.secondary} icon="flame" />
        <StatCard label="Protein"  value={protein}      max={150}            unit="g"        color={Colors.danger}    icon="barbell" />
        <StatCard label="Workout"  value={streak}       max={7}              unit="/ 7 days" color={Colors.primary}   icon="trophy" />
      </View>

      {/* ── Weekly streak ────────────────────────────────── */}
      <View style={[styles.card, Shadow.sm]}>
        <Text style={styles.cardTitle}>Weekly Streak</Text>
        <View style={styles.streakRow}>
          {weekLogs.map((d, i) => {
            const label = new Date(d.date + "T12:00:00").toLocaleDateString("en", { weekday: "narrow" });
            return (
              <View key={i} style={styles.streakDot}>
                <View style={[styles.dot, { backgroundColor: d.workedOut ? Colors.primary : Colors.border }]}>
                  {d.workedOut && <Ionicons name="checkmark" size={10} color="#fff" />}
                </View>
                <Text style={styles.streakLabel}>{label}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.streakSub}>{streak} workout{streak !== 1 ? "s" : ""} this week</Text>
      </View>

      {/* ── Today's meals ────────────────────────────────── */}
      <View style={[styles.card, Shadow.sm]}>
        <Text style={styles.cardTitle}>Today's Meals</Text>
        {log.meals.length === 0 ? (
          <Text style={styles.empty}>No meals logged yet. Head to the Tracker tab to add one.</Text>
        ) : (
          log.meals.map((m) => (
            <View key={m.id} style={styles.mealRow}>
              <View style={styles.mealDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.mealName}>{m.name}</Text>
                <Text style={styles.mealMacros}>{m.calories} kcal · {m.protein}g protein · {m.carbs}g carbs · {m.fat}g fat</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* ── Macro breakdown ──────────────────────────────── */}
      {log.meals.length > 0 && (
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Macro Breakdown</Text>
          {[
            { label: "Protein", value: protein, max: 150, color: Colors.danger },
            { label: "Carbs",   value: log.meals.reduce((s, m) => s + m.carbs, 0), max: 250, color: Colors.secondary },
            { label: "Fat",     value: log.meals.reduce((s, m) => s + m.fat, 0),   max: 70,  color: Colors.accent },
          ].map((m) => (
            <View key={m.label} style={styles.macroRow}>
              <Text style={styles.macroLabel}>{m.label}</Text>
              <View style={styles.macroBar}>
                <View style={[styles.macroFill, { width: `${Math.min((m.value / m.max) * 100, 100)}%` as any, backgroundColor: m.color }]} />
              </View>
              <Text style={[styles.macroVal, { color: m.color }]}>{m.value}g</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 32 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: Colors.textMuted, fontSize: 16 },

  hero: { paddingTop: 60, paddingBottom: 28, paddingHorizontal: Spacing.md, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  heroGreeting: { fontSize: 22, fontWeight: Font.extrabold, color: "#fff" },
  heroDate: { fontSize: 13, color: "rgba(255,255,255,.8)", marginTop: 2 },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  heroBadgeText: { color: "#fff", fontSize: 12, fontWeight: Font.semibold },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, padding: Spacing.md, paddingBottom: 0 },
  statCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, width: (W - Spacing.md * 2 - Spacing.sm) / 2 },
  statIcon: { width: 34, height: 34, borderRadius: Radius.full, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statLabel: { fontSize: 11, fontWeight: Font.semibold, color: Colors.textMuted, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: Font.extrabold },
  statUnit: { fontSize: 11, fontWeight: Font.regular, color: Colors.textMuted },
  statBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginTop: 8, overflow: "hidden" },
  statBarFill: { height: "100%", borderRadius: 2 },
  statPct: { fontSize: 10, color: Colors.textMuted, marginTop: 3 },

  card: { margin: Spacing.md, marginBottom: 0, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md },
  cardTitle: { fontSize: 15, fontWeight: Font.bold, color: Colors.text, marginBottom: 12 },

  streakRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  streakDot: { alignItems: "center", gap: 4 },
  dot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  streakLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: Font.semibold },
  streakSub: { fontSize: 12, color: Colors.textMuted },

  mealRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  mealDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 5 },
  mealName: { fontSize: 13, fontWeight: Font.semibold, color: Colors.text },
  mealMacros: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },

  macroRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  macroLabel: { width: 50, fontSize: 12, fontWeight: Font.semibold, color: Colors.textSecondary },
  macroBar: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden" },
  macroFill: { height: "100%", borderRadius: 3 },
  macroVal: { width: 36, fontSize: 12, fontWeight: Font.bold, textAlign: "right" },

  ringTrack: { position: "absolute", borderRadius: 45, borderWidth: STROKE, },
  ringFill: { position: "absolute", borderRadius: 45, borderWidth: STROKE, },
  empty: { fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
});
