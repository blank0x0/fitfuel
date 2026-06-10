import { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { addMealEntry, saveMeal } from "../lib/storage";
import { Colors, Spacing, Radius, Shadow, Font } from "../lib/theme";
import type { AISuggestion, MealEntry, Meal } from "../types";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

function SuggestionCard({ s, onLog, onSave }: {
  s: AISuggestion & { id: string };
  onLog: (s: AISuggestion) => void;
  onSave: (s: AISuggestion) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={[styles.card, Shadow.sm]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{s.name}</Text>
        <Text style={styles.cardCal}>{s.calories} kcal</Text>
      </View>
      <View style={styles.macroRow}>
        {[
          { label: "Protein", val: s.protein, color: Colors.danger },
          { label: "Carbs",   val: s.carbs,   color: Colors.secondary },
          { label: "Fat",     val: s.fat,      color: Colors.accent },
        ].map((m) => (
          <View key={m.label} style={[styles.macroPill, { backgroundColor: m.color + "22" }]}>
            <Text style={[styles.macroPillVal, { color: m.color }]}>{m.val}g</Text>
            <Text style={styles.macroPillLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.expandBtn} onPress={() => setExpanded(!expanded)}>
        <Ionicons name={expanded ? "chevron-up-outline" : "chevron-down-outline"} size={14} color={Colors.textMuted} />
        <Text style={styles.expandBtnText}>{expanded ? "Hide recipe" : "View recipe"}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.recipe}>
          <Text style={styles.recipeHeading}>Ingredients</Text>
          {s.ingredients.map((ing, i) => <Text key={i} style={styles.recipeItem}>• {ing}</Text>)}
          <Text style={[styles.recipeHeading, { marginTop: 10 }]}>Instructions</Text>
          {s.instructions.map((step, i) => <Text key={i} style={styles.recipeItem}>{i + 1}. {step}</Text>)}
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onSave(s)}>
          <Ionicons name="bookmark-outline" size={15} color={Colors.primary} />
          <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Save to Library</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary, borderColor: Colors.primary }]} onPress={() => onLog(s)}>
          <Ionicons name="add-circle-outline" size={15} color="#fff" />
          <Text style={[styles.actionBtnText, { color: "#fff" }]}>Log to Tracker</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AIChefScreen() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputVal, setInputVal]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [suggestions, setSuggestions] = useState<(AISuggestion & { id: string })[]>([]);

  const addIngredient = (val = inputVal) => {
    const t = val.trim().toLowerCase();
    if (t && !ingredients.includes(t)) setIngredients((p) => [...p, t]);
    setInputVal("");
  };

  const removeIngredient = (ing: string) => setIngredients((p) => p.filter((i) => i !== ing));

  const getSuggestions = async () => {
    if (ingredients.length === 0) { setError("Add at least one ingredient first."); return; }
    setError("");
    setLoading(true);
    setSuggestions([]);
    try {
      const res = await fetch(`${API_BASE}/api/meal-suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Server error");
      const list = (data.suggestions ?? []).map((s: AISuggestion, i: number) => ({ ...s, id: `${Date.now()}-${i}` }));
      setSuggestions(list);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to get suggestions.");
    } finally {
      setLoading(false);
    }
  };

  const logSuggestion = async (s: AISuggestion) => {
    const entry: MealEntry = {
      id: Date.now().toString(),
      name: s.name,
      calories: s.calories,
      protein: s.protein,
      carbs: s.carbs,
      fat: s.fat,
      time: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
    };
    await addMealEntry(entry);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const saveSuggestion = async (s: AISuggestion) => {
    const meal: Meal = {
      id: `ai-${Date.now()}`,
      name: s.name,
      category: "balanced",
      calories: s.calories,
      protein: s.protein,
      carbs: s.carbs,
      fat: s.fat,
      prepTime: 20,
      ingredients: s.ingredients,
      instructions: s.instructions,
    };
    await saveMeal(meal);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>AI Chef</Text>
            <Text style={styles.subtitle}>Tell me what's in your fridge — I'll suggest meals.</Text>
          </View>
        </View>

        {/* Ingredient input */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.sectionTitle}>Your Ingredients</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={inputVal}
              onChangeText={setInputVal}
              placeholder="e.g. chicken, rice, broccoli…"
              placeholderTextColor={Colors.textPlaceholder}
              onSubmitEditing={() => addIngredient()}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addBtn} onPress={() => addIngredient()}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Chips */}
          {ingredients.length > 0 && (
            <View style={styles.chipList}>
              {ingredients.map((ing) => (
                <TouchableOpacity key={ing} style={styles.chip} onPress={() => removeIngredient(ing)}>
                  <Text style={styles.chipText}>{ing}</Text>
                  <Ionicons name="close" size={12} color={Colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {ingredients.length === 0 && (
            <Text style={styles.hint}>Type an ingredient and press + or Enter to add it.</Text>
          )}
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Generate button */}
        <TouchableOpacity
          style={[styles.generateBtn, (loading || ingredients.length === 0) && styles.generateBtnDisabled]}
          onPress={getSuggestions}
          disabled={loading || ingredients.length === 0}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="sparkles" size={18} color="#fff" />
          }
          <Text style={styles.generateBtnText}>{loading ? "Generating meals…" : "Generate Meal Ideas"}</Text>
        </TouchableOpacity>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={styles.resultsLabel}>✨ {suggestions.length} meal ideas for you</Text>
            {suggestions.map((s) => (
              <SuggestionCard key={s.id} s={s} onLog={logSuggestion} onSave={saveSuggestion} />
            ))}
          </View>
        )}

        {/* Empty state */}
        {!loading && suggestions.length === 0 && ingredients.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧑‍🍳</Text>
            <Text style={styles.emptyTitle}>What's in your fridge?</Text>
            <Text style={styles.emptyBody}>Add your available ingredients above and the AI will suggest complete meals with recipes and macros.</Text>
            <Text style={styles.emptyNote}>Powered by Groq · Llama 3</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 32, gap: 12 },

  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingTop: 60, paddingBottom: 20, paddingHorizontal: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: Font.extrabold, color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  card: { margin: Spacing.md, marginBottom: 0, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: Font.bold, color: Colors.text, marginBottom: 10 },

  inputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text, backgroundColor: Colors.bg },
  addBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, width: 42, height: 42, alignItems: "center", justifyContent: "center" },

  chipList: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 13, fontWeight: Font.semibold, color: Colors.primaryDark },

  hint: { fontSize: 13, color: Colors.textMuted, marginTop: 10 },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: Spacing.md, backgroundColor: "#fef2f2", borderRadius: Radius.md, padding: 12 },
  errorText: { flex: 1, fontSize: 13, color: Colors.danger, fontWeight: Font.semibold },

  generateBtn: { marginHorizontal: Spacing.md, backgroundColor: Colors.primary, borderRadius: Radius.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  generateBtnDisabled: { backgroundColor: Colors.borderStrong },
  generateBtnText: { color: "#fff", fontWeight: Font.bold, fontSize: 15 },

  resultsLabel: { marginHorizontal: Spacing.md, fontSize: 14, fontWeight: Font.bold, color: Colors.text },

  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: Font.bold, color: Colors.text, flex: 1, marginRight: 8 },
  cardCal: { fontSize: 18, fontWeight: Font.extrabold, color: Colors.primary },

  macroRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  macroPill: { flex: 1, alignItems: "center", borderRadius: Radius.md, paddingVertical: 6 },
  macroPillVal: { fontSize: 13, fontWeight: Font.bold },
  macroPillLabel: { fontSize: 10, color: Colors.textMuted },

  expandBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6 },
  expandBtnText: { fontSize: 12, color: Colors.textMuted, fontWeight: Font.semibold },

  recipe: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 4 },
  recipeHeading: { fontSize: 13, fontWeight: Font.bold, color: Colors.text, marginBottom: 6 },
  recipeItem: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: 2 },

  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border },
  actionBtnText: { fontSize: 12, fontWeight: Font.bold },

  emptyState: { margin: Spacing.md, alignItems: "center", paddingVertical: 32, backgroundColor: Colors.surface, borderRadius: Radius.xl, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: Font.bold, color: Colors.text },
  emptyBody: { fontSize: 13, color: Colors.textMuted, textAlign: "center", paddingHorizontal: Spacing.lg, lineHeight: 20 },
  emptyNote: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
});
