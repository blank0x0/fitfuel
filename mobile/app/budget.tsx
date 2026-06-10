import { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MEAL_LIBRARY } from "../lib/meals-data";
import { Colors, Spacing, Radius, Shadow, Font } from "../lib/theme";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const STORES = [
  { name: "No Frills",     emoji: "🟡", tier: "Budget"  },
  { name: "Food Basics",   emoji: "🔵", tier: "Budget"  },
  { name: "Walmart",       emoji: "☀️", tier: "Budget"  },
  { name: "Metro",         emoji: "🔴", tier: "Mid"     },
  { name: "Sobeys",        emoji: "🟠", tier: "Mid"     },
  { name: "Save-On Foods", emoji: "🌿", tier: "Mid"     },
  { name: "Loblaws",       emoji: "🟢", tier: "Premium" },
  { name: "Costco",        emoji: "🏭", tier: "Bulk"    },
];

const TIER_COLORS: Record<string, string> = {
  Budget: Colors.primary,
  Mid: Colors.info,
  Premium: Colors.accent,
  Bulk: Colors.secondary,
};

interface PriceRow { ingredient: string; price: number; unit: string; inStock: boolean; }
interface PriceResult { prices: PriceRow[]; subtotal: number; savings: number; cheapestStore: string; }

export default function BudgetScreen() {
  const [store, setStore]             = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputVal, setInputVal]       = useState("");
  const [result, setResult]           = useState<PriceResult | null>(null);
  const [loading, setLoading]         = useState(false);

  const addIngredient = (val = inputVal) => {
    const t = val.trim().toLowerCase();
    if (t && !ingredients.includes(t)) setIngredients((p) => [...p, t]);
    setInputVal("");
  };

  const loadMeal = (mealId: string) => {
    const meal = MEAL_LIBRARY.find((m) => m.id === mealId);
    if (!meal) return;
    const cleaned = meal.ingredients.map((i) =>
      i.replace(/^[\d.]+\s*(g|kg|cup|tbsp|tsp|ml|oz|lb|can|clove|medium|large|small|bunch)?\s*/i, "")
        .replace(/\s*\(.*?\)/g, "").trim().toLowerCase()
    );
    setIngredients((prev) => {
      const merged = [...prev];
      cleaned.forEach((c) => { if (!merged.includes(c)) merged.push(c); });
      return merged;
    });
  };

  const calculate = async () => {
    if (!store)            { Alert.alert("Select a store", "Please choose a store first."); return; }
    if (!ingredients.length) { Alert.alert("No ingredients", "Add at least one ingredient."); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store, ingredients }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🛒 Budget Planner</Text>
        <Text style={styles.subtitle}>Compare prices across Canadian grocery stores</Text>
      </View>

      {/* Store picker */}
      <View style={[styles.card, Shadow.sm]}>
        <Text style={styles.sectionTitle}>Choose Your Store</Text>
        <View style={styles.storeGrid}>
          {STORES.map((st) => (
            <TouchableOpacity
              key={st.name}
              style={[styles.storeBtn, store === st.name && { borderColor: Colors.primary, backgroundColor: Colors.primaryLight }]}
              onPress={() => { setStore(st.name); setResult(null); }}
            >
              <Text style={styles.storeEmoji}>{st.emoji}</Text>
              <Text style={[styles.storeName, store === st.name && { color: Colors.primaryDark, fontWeight: Font.bold }]} numberOfLines={1}>{st.name}</Text>
              <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[st.tier] + "22" }]}>
                <Text style={[styles.tierText, { color: TIER_COLORS[st.tier] }]}>{st.tier}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Ingredients */}
      <View style={[styles.card, Shadow.sm]}>
        <Text style={styles.sectionTitle}>Ingredients</Text>

        {/* Load from meal */}
        <Text style={styles.label}>Import from meal library:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
          {MEAL_LIBRARY.map((m) => (
            <TouchableOpacity key={m.id} style={styles.mealChip} onPress={() => loadMeal(m.id)}>
              <Ionicons name="add-circle-outline" size={12} color={Colors.primary} />
              <Text style={styles.mealChipText}>{m.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Manual input */}
        <Text style={styles.label}>Or add manually:</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={inputVal}
            onChangeText={setInputVal}
            placeholder="e.g. chicken breast, salmon…"
            placeholderTextColor={Colors.textPlaceholder}
            onSubmitEditing={() => addIngredient()}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={() => addIngredient()}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Chips */}
        {ingredients.length > 0 ? (
          <View style={styles.chipList}>
            {ingredients.map((ing) => (
              <TouchableOpacity key={ing} style={styles.chip} onPress={() => setIngredients((p) => p.filter((i) => i !== ing))}>
                <Text style={styles.chipText}>{ing}</Text>
                <Ionicons name="close" size={12} color={Colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyHint}>No ingredients yet. Import a meal or add manually.</Text>
        )}
      </View>

      {/* Calculate */}
      <TouchableOpacity
        style={[styles.calcBtn, (loading || !store || !ingredients.length) && styles.calcBtnDisabled]}
        onPress={calculate}
        disabled={loading || !store || !ingredients.length}
      >
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Ionicons name="calculator-outline" size={18} color="#fff" />
        }
        <Text style={styles.calcBtnText}>{loading ? "Calculating…" : "Calculate Shopping Total"}</Text>
      </TouchableOpacity>

      {/* Results */}
      {result && !loading && (
        <View style={[styles.card, Shadow.sm]}>
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>Price Breakdown — {store}</Text>
            <Text style={styles.matchedText}>{result.prices.filter((p) => p.inStock && p.price > 0).length}/{result.prices.length} found</Text>
          </View>

          {result.prices.map((row) => (
            <View key={row.ingredient} style={styles.priceRow}>
              <Text style={styles.priceIcon}>
                {!row.inStock ? "⚠️" : row.price === 0 ? "❓" : "✅"}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.priceName, !row.inStock && { color: Colors.textMuted }]}>{row.ingredient}</Text>
                {row.unit !== "—" && <Text style={styles.priceUnit}>{row.unit}</Text>}
              </View>
              {row.inStock && row.price > 0
                ? <Text style={styles.priceVal}>${row.price.toFixed(2)}</Text>
                : <Text style={styles.priceNA}>N/A</Text>
              }
            </View>
          ))}

          {/* Legend */}
          <Text style={styles.legend}>✅ Found · ❓ No match · ⚠️ Not at this store</Text>

          {/* Totals */}
          {result.savings > 0 && (
            <View style={[styles.totalRow, { backgroundColor: Colors.primaryLight }]}>
              <Text style={styles.totalLabel}>💡 Cheapest: {result.cheapestStore}</Text>
              <Text style={[styles.totalVal, { color: Colors.primary }]}>saves ${result.savings.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, { backgroundColor: Colors.secondary + "22", marginTop: 6 }]}>
            <Text style={styles.totalLabel}>🛒 Total at {store}</Text>
            <Text style={[styles.totalVal, { fontSize: 20, color: Colors.secondary }]}>${result.subtotal.toFixed(2)}</Text>
          </View>
          <Text style={styles.disclaimer}>Prices are Canadian market estimates. Actual prices may vary.</Text>
        </View>
      )}

      {/* Empty */}
      {!result && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyText}>Select a store, add ingredients, then tap Calculate.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 32, gap: 12 },

  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 24, fontWeight: Font.extrabold, color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  card: { marginHorizontal: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: Font.bold, color: Colors.text, marginBottom: 10 },
  label: { fontSize: 12, fontWeight: Font.semibold, color: Colors.textMuted, marginBottom: 6 },

  storeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  storeBtn: { width: "47%", flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: Colors.bg },
  storeEmoji: { fontSize: 18 },
  storeName: { flex: 1, fontSize: 12, fontWeight: Font.semibold, color: Colors.textSecondary },
  tierBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  tierText: { fontSize: 9, fontWeight: Font.bold },

  mealChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary + "55", backgroundColor: Colors.primaryLight },
  mealChipText: { fontSize: 12, fontWeight: Font.semibold, color: Colors.primaryDark },

  inputRow: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 10 },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text, backgroundColor: Colors.bg },
  addBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, width: 42, height: 42, alignItems: "center", justifyContent: "center" },

  chipList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 13, fontWeight: Font.semibold, color: Colors.primaryDark },
  emptyHint: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },

  calcBtn: { marginHorizontal: Spacing.md, backgroundColor: Colors.primary, borderRadius: Radius.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  calcBtnDisabled: { backgroundColor: Colors.borderStrong },
  calcBtnText: { color: "#fff", fontWeight: Font.bold, fontSize: 15 },

  resultsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  matchedText: { fontSize: 12, color: Colors.textMuted, fontWeight: Font.semibold },

  priceRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: Colors.border },
  priceIcon: { fontSize: 14 },
  priceName: { fontSize: 13, fontWeight: Font.semibold, color: Colors.text },
  priceUnit: { fontSize: 11, color: Colors.textMuted },
  priceVal: { fontSize: 14, fontWeight: Font.bold, color: Colors.text },
  priceNA: { fontSize: 12, color: Colors.textMuted },

  legend: { fontSize: 11, color: Colors.textMuted, marginTop: 8, marginBottom: 12 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: Radius.md, padding: 12 },
  totalLabel: { fontSize: 13, fontWeight: Font.semibold, color: Colors.textSecondary },
  totalVal: { fontSize: 16, fontWeight: Font.extrabold },
  disclaimer: { fontSize: 11, color: Colors.textMuted, marginTop: 8 },

  emptyState: { marginHorizontal: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 32, alignItems: "center", gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 13, color: Colors.textMuted, textAlign: "center", lineHeight: 20 },
});
