import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  getTodayLog, updateSteps, updateWorkout,
  addMealEntry, removeMealEntry, updateCalorieGoal,
} from "../lib/storage";
import { Colors, Spacing, Radius, Shadow, Font } from "../lib/theme";
import type { DayLog, WorkoutType, MealEntry } from "../types";

const WORKOUT_TYPES: { id: WorkoutType; label: string; icon: string }[] = [
  { id: "strength",  label: "Strength",  icon: "barbell"         },
  { id: "cardio",    label: "Cardio",    icon: "heart"           },
  { id: "yoga",      label: "Yoga",      icon: "body"            },
  { id: "hiit",      label: "HIIT",      icon: "flash"           },
  { id: "cycling",   label: "Cycling",   icon: "bicycle"         },
  { id: "swimming",  label: "Swimming",  icon: "water"           },
  { id: "other",     label: "Other",     icon: "ellipsis-horizontal" },
];

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={[styles.card, Shadow.sm]}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={18} color={Colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function TrackerScreen() {
  const [log, setLog] = useState<DayLog | null>(null);

  // Form state
  const [stepsInput, setStepsInput]         = useState("");
  const [goalInput, setGoalInput]           = useState("");
  const [mealName, setMealName]             = useState("");
  const [mealCal, setMealCal]               = useState("");
  const [mealProtein, setMealProtein]       = useState("");
  const [mealCarbs, setMealCarbs]           = useState("");
  const [mealFat, setMealFat]               = useState("");

  const load = useCallback(async () => {
    const l = await getTodayLog();
    setLog(l);
    setStepsInput(l.steps > 0 ? String(l.steps) : "");
    setGoalInput(String(l.calorieGoal));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const saveSteps = async () => {
    const n = parseInt(stepsInput);
    if (isNaN(n) || n < 0) return Alert.alert("Invalid", "Enter a valid step count.");
    const l = await updateSteps(n);
    setLog(l);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const saveGoal = async () => {
    const n = parseInt(goalInput);
    if (isNaN(n) || n < 100) return Alert.alert("Invalid", "Enter a calorie goal above 100.");
    const l = await updateCalorieGoal(n);
    setLog(l);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleWorkout = async (worked: boolean) => {
    const l = await updateWorkout(worked);
    setLog(l);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const setWorkoutType = async (type: WorkoutType) => {
    const l = await updateWorkout(true, type);
    setLog(l);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const logMeal = async () => {
    if (!mealName.trim()) return Alert.alert("Required", "Enter a meal name.");
    const entry: MealEntry = {
      id: Date.now().toString(),
      name: mealName.trim(),
      calories: parseInt(mealCal) || 0,
      protein:  parseInt(mealProtein) || 0,
      carbs:    parseInt(mealCarbs) || 0,
      fat:      parseInt(mealFat) || 0,
      time: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
    };
    const l = await addMealEntry(entry);
    setLog(l);
    setMealName(""); setMealCal(""); setMealProtein(""); setMealCarbs(""); setMealFat("");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteMeal = (id: string) => {
    Alert.alert("Remove meal?", "", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        const l = await removeMealEntry(id);
        setLog(l);
      }},
    ]);
  };

  if (!log) return <View style={styles.loading}><Text style={styles.loadingText}>Loading…</Text></View>;

  const calories = log.meals.reduce((s, m) => s + m.calories, 0);
  const pct = Math.min(Math.round((calories / log.calorieGoal) * 100), 100);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Today's Tracker</Text>
          <Text style={styles.subtitle}>{new Date().toLocaleDateString("en-CA", { weekday: "long", month: "short", day: "numeric" })}</Text>
        </View>

        {/* ── Steps ─────────────────────────────────────── */}
        <Section title="Daily Steps" icon="footsteps-outline">
          <Text style={styles.currentVal}>{log.steps.toLocaleString()} <Text style={styles.currentSub}>/ 10,000 steps</Text></Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={stepsInput}
              onChangeText={setStepsInput}
              keyboardType="numeric"
              placeholder="Enter step count"
              placeholderTextColor={Colors.textPlaceholder}
              returnKeyType="done"
              onSubmitEditing={saveSteps}
            />
            <TouchableOpacity style={styles.btnPrimary} onPress={saveSteps}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* ── Calorie goal ──────────────────────────────── */}
        <Section title="Calorie Goal" icon="flame-outline">
          <View style={styles.calorieRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.currentVal}>{calories} <Text style={styles.currentSub}>/ {log.calorieGoal} kcal</Text></Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: pct >= 100 ? Colors.danger : Colors.secondary }]} />
              </View>
              <Text style={styles.pctText}>{pct}% of daily goal</Text>
            </View>
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="numeric"
              placeholder="Daily calorie goal"
              placeholderTextColor={Colors.textPlaceholder}
              returnKeyType="done"
              onSubmitEditing={saveGoal}
            />
            <TouchableOpacity style={styles.btnPrimary} onPress={saveGoal}>
              <Text style={styles.btnText}>Update</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* ── Workout ───────────────────────────────────── */}
        <Section title="Workout" icon="barbell-outline">
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, !log.workedOut && styles.toggleBtnActive]}
              onPress={() => toggleWorkout(false)}
            >
              <Ionicons name="close-circle-outline" size={16} color={!log.workedOut ? "#fff" : Colors.textMuted} />
              <Text style={[styles.toggleBtnText, !log.workedOut && { color: "#fff" }]}>Rest Day</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, log.workedOut && styles.toggleBtnActiveGreen]}
              onPress={() => toggleWorkout(true)}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color={log.workedOut ? "#fff" : Colors.textMuted} />
              <Text style={[styles.toggleBtnText, log.workedOut && { color: "#fff" }]}>Worked Out</Text>
            </TouchableOpacity>
          </View>

          {log.workedOut && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.typeLabel}>Workout type:</Text>
              <View style={styles.typeGrid}>
                {WORKOUT_TYPES.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={[styles.typeBtn, log.workoutType === w.id && styles.typeBtnActive]}
                    onPress={() => setWorkoutType(w.id)}
                  >
                    <Ionicons name={w.icon as any} size={14} color={log.workoutType === w.id ? Colors.primary : Colors.textMuted} />
                    <Text style={[styles.typeBtnText, log.workoutType === w.id && { color: Colors.primary, fontWeight: Font.bold }]}>{w.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </Section>

        {/* ── Log meal ──────────────────────────────────── */}
        <Section title="Log a Meal" icon="restaurant-outline">
          <TextInput
            style={styles.input}
            value={mealName}
            onChangeText={setMealName}
            placeholder="Meal name (e.g. Grilled Chicken Bowl)"
            placeholderTextColor={Colors.textPlaceholder}
          />
          <View style={styles.macroInputs}>
            {[
              { label: "Calories", val: mealCal,     set: setMealCal     },
              { label: "Protein",  val: mealProtein,  set: setMealProtein  },
              { label: "Carbs",    val: mealCarbs,    set: setMealCarbs    },
              { label: "Fat",      val: mealFat,      set: setMealFat      },
            ].map((f) => (
              <View key={f.label} style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{f.label}</Text>
                <TextInput
                  style={[styles.input, { textAlign: "center" }]}
                  value={f.val}
                  onChangeText={f.set}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textPlaceholder}
                />
              </View>
            ))}
          </View>
          <TouchableOpacity style={[styles.btnPrimary, { marginTop: 4 }]} onPress={logMeal}>
            <Ionicons name="add-circle-outline" size={16} color="#fff" />
            <Text style={styles.btnText}>Add Meal</Text>
          </TouchableOpacity>
        </Section>

        {/* ── Meal log ──────────────────────────────────── */}
        {log.meals.length > 0 && (
          <Section title="Today's Log" icon="list-outline">
            {log.meals.map((m) => (
              <View key={m.id} style={styles.mealItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealItemName}>{m.name}</Text>
                  <Text style={styles.mealItemMacros}>{m.calories} kcal · {m.protein}g P · {m.carbs}g C · {m.fat}g F · {m.time}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteMeal(m.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </Section>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 32 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: Colors.textMuted, fontSize: 16 },

  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 24, fontWeight: Font.extrabold, color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  card: { margin: Spacing.md, marginBottom: 0, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: Font.bold, color: Colors.text },

  currentVal: { fontSize: 26, fontWeight: Font.extrabold, color: Colors.text, marginBottom: 8 },
  currentSub: { fontSize: 13, fontWeight: Font.regular, color: Colors.textMuted },
  calorieRow: { marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  progressFill: { height: "100%", borderRadius: 3 },
  pctText: { fontSize: 11, color: Colors.textMuted },

  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text, backgroundColor: Colors.bg, marginBottom: 10 },
  inputLabel: { fontSize: 10, fontWeight: Font.semibold, color: Colors.textMuted, marginBottom: 4, textAlign: "center" },
  macroInputs: { flexDirection: "row", gap: 6, marginBottom: 4 },
  btnPrimary: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" },
  btnText: { color: "#fff", fontWeight: Font.bold, fontSize: 14 },

  toggleRow: { flexDirection: "row", gap: 8 },
  toggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: 10 },
  toggleBtnActive: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  toggleBtnActiveGreen: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleBtnText: { fontSize: 13, fontWeight: Font.semibold, color: Colors.textMuted },

  typeLabel: { fontSize: 12, fontWeight: Font.semibold, color: Colors.textMuted, marginBottom: 8 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  typeBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg },
  typeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeBtnText: { fontSize: 12, fontWeight: Font.medium, color: Colors.textMuted },

  mealItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mealItemName: { fontSize: 14, fontWeight: Font.semibold, color: Colors.text },
  mealItemMacros: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});
