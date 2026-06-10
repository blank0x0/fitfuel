import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, Dimensions, TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MEAL_LIBRARY, CATEGORY_LABELS, CATEGORY_COLORS } from "../lib/meals-data";
import { addMealEntry, saveMeal, getSavedMeals, removeSavedMeal } from "../lib/storage";
import { Colors, Spacing, Radius, Shadow, Font } from "../lib/theme";
import type { Meal, MealCategory, MealEntry } from "../types";

const { width: W } = Dimensions.get("window");

const CATEGORIES = ["all", "high-protein", "high-carb", "low-calorie", "balanced"] as const;

function MacroPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={[styles.macroPill, { backgroundColor: color + "22" }]}>
      <Text style={[styles.macroPillVal, { color }]}>{value}g</Text>
      <Text style={styles.macroPillLabel}>{label}</Text>
    </View>
  );
}

function MealCard({ meal, savedIds, onSave, onLog }: {
  meal: Meal;
  savedIds: Set<string>;
  onSave: (meal: Meal) => void;
  onLog: (meal: Meal) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const catColor = CATEGORY_COLORS[meal.category] ?? Colors.primary;
  const isSaved  = savedIds.has(meal.id);

  const imageUrl = `https://www.themealdb.com/images/ingredients/${encodeURIComponent(meal.imageQuery ?? meal.name)}-Small.png`;

  return (
    <View style={[styles.mealCard, Shadow.sm]}>
      {/* Image + header */}
      <View style={styles.mealCardTop}>
        {!imgError ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.mealThumb}
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={[styles.mealThumb, { backgroundColor: catColor + "33", alignItems: "center", justifyContent: "center" }]}>
            <Ionicons name="restaurant" size={24} color={catColor} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.mealName}>{meal.name}</Text>
          <View style={styles.mealMeta}>
            <View style={[styles.catBadge, { backgroundColor: catColor + "22" }]}>
              <Text style={[styles.catBadgeText, { color: catColor }]}>{CATEGORY_LABELS[meal.category]}</Text>
            </View>
            <Text style={styles.prepTime}>⏱ {meal.prepTime} min</Text>
          </View>
          <Text style={styles.calText}>{meal.calories} kcal</Text>
        </View>
      </View>

      {/* Macros */}
      <View style={styles.macroRow}>
        <MacroPill value={meal.protein} label="Protein" color={Colors.danger} />
        <MacroPill value={meal.carbs}   label="Carbs"   color={Colors.secondary} />
        <MacroPill value={meal.fat}     label="Fat"     color={Colors.accent} />
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setExpanded(!expanded)}>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={15} color={Colors.textMuted} />
          <Text style={styles.actionBtnText}>{expanded ? "Hide" : "Recipe"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, isSaved && { backgroundColor: Colors.primaryLight }]}
          onPress={() => onSave(meal)}
        >
          <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={15} color={isSaved ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.actionBtnText, isSaved && { color: Colors.primary }]}>{isSaved ? "Saved" : "Save"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primaryLight }]} onPress={() => onLog(meal)}>
          <Ionicons name="add-circle-outline" size={15} color={Colors.primary} />
          <Text style={[styles.actionBtnText, { color: Colors.primary, fontWeight: Font.bold }]}>Log</Text>
        </TouchableOpacity>
      </View>

      {/* Recipe */}
      {expanded && (
        <View style={styles.recipe}>
          <Text style={styles.recipeHeading}>Ingredients</Text>
          {meal.ingredients.map((ing, i) => (
            <Text key={i} style={styles.recipeItem}>• {ing}</Text>
          ))}
          <Text style={[styles.recipeHeading, { marginTop: 10 }]}>Instructions</Text>
          {meal.instructions.map((step, i) => (
            <Text key={i} style={styles.recipeItem}>{i + 1}. {step}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

export default function MealsScreen() {
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("all");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [search, setSearch]     = useState("");

  useCallback(() => {
    getSavedMeals().then((meals) => setSavedIds(new Set(meals.map((m) => m.id))));
  }, [])();

  const filtered = MEAL_LIBRARY.filter((m) => {
    const matchCat = category === "all" || m.category === category;
    const matchQ   = !search || m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const handleSave = async (meal: Meal) => {
    if (savedIds.has(meal.id)) {
      await removeSavedMeal(meal.id);
      setSavedIds((s) => { const n = new Set(s); n.delete(meal.id); return n; });
    } else {
      await saveMeal(meal);
      setSavedIds((s) => new Set([...s, meal.id]));
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLog = async (meal: Meal) => {
    const entry: MealEntry = {
      id: Date.now().toString(),
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      time: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
    };
    await addMealEntry(entry);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Meal Library</Text>
        <Text style={styles.subtitle}>{MEAL_LIBRARY.length} curated meals</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search meals…"
          placeholderTextColor={Colors.textPlaceholder}
        />
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingVertical: 10, alignItems: "center" }}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, category === cat && styles.filterChipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.filterChipText, category === cat && { color: "#fff" }]}>
              {cat === "all" ? "All" : CATEGORY_LABELS[cat as MealCategory]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Meal list */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.list}>
        {filtered.map((meal) => (
          <MealCard key={meal.id} meal={meal} savedIds={savedIds} onSave={handleSave} onLog={handleLog} />
        ))}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No meals found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 24, fontWeight: Font.extrabold, color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2, marginBottom: 10 },
  searchInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: Colors.text, backgroundColor: Colors.bg },

  filterBar: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, flexGrow: 0, flexShrink: 0 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.bg, alignSelf: "center" },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 13, fontWeight: Font.semibold, color: Colors.textSecondary },

  list: { padding: Spacing.md, gap: 12, paddingBottom: 32 },

  mealCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, overflow: "hidden" },
  mealCardTop: { flexDirection: "row", gap: 12, marginBottom: 10 },
  mealThumb: { width: 72, height: 72, borderRadius: Radius.md, resizeMode: "cover" },
  mealName: { fontSize: 15, fontWeight: Font.bold, color: Colors.text, flex: 1 },
  mealMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  catBadgeText: { fontSize: 10, fontWeight: Font.bold },
  prepTime: { fontSize: 11, color: Colors.textMuted },
  calText: { fontSize: 18, fontWeight: Font.extrabold, color: Colors.text, marginTop: 6 },

  macroRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  macroPill: { flex: 1, alignItems: "center", borderRadius: Radius.md, paddingVertical: 6 },
  macroPillVal: { fontSize: 13, fontWeight: Font.bold },
  macroPillLabel: { fontSize: 10, color: Colors.textMuted },

  actionRow: { flexDirection: "row", gap: 6 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg },
  actionBtnText: { fontSize: 12, fontWeight: Font.semibold, color: Colors.textMuted },

  recipe: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  recipeHeading: { fontSize: 13, fontWeight: Font.bold, color: Colors.text, marginBottom: 6 },
  recipeItem: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: 2 },

  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textMuted, fontWeight: Font.semibold },
});
