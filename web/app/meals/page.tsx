"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { MEAL_LIBRARY, CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/meals-data";
import { getSavedMeals, saveMeal, removeSavedMeal, addMealEntry } from "@/lib/storage";
import { Meal, MealCategory } from "@/types";
import { Bookmark, BookmarkCheck, Plus, Clock, ChevronDown, ChevronUp } from "lucide-react";

const CATEGORIES: MealCategory[] = ["high-protein", "high-carb", "low-calorie", "balanced"];

const CATEGORY_BG: Record<string, string> = {
  "high-protein": "from-red-400 to-orange-400",
  "high-carb":    "from-yellow-400 to-amber-400",
  "low-calorie":  "from-green-400 to-emerald-400",
  "balanced":     "from-blue-400 to-cyan-400",
  "ai-generated": "from-purple-400 to-violet-400",
};

export default function MealsPage() {
  const [activeCategory, setActiveCategory] = useState<MealCategory | "saved" | "all">("all");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedMeals, setSavedMeals] = useState<Meal[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logged, setLogged] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});

  const reload = () => {
    const s = getSavedMeals();
    setSavedIds(new Set(s.map((m) => m.id)));
    setSavedMeals(s);
  };

  useEffect(() => {
    reload();
    // Fetch images for all meals in parallel
    MEAL_LIBRARY.forEach((meal) => {
      if (!meal.imageQuery) return;
      fetch(`/api/meal-image?q=${encodeURIComponent(meal.imageQuery)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.image) {
            setImages((prev) => ({ ...prev, [meal.id]: data.image }));
          }
        })
        .catch(() => {});
    });
  }, []);

  const allMeals =
    activeCategory === "saved"
      ? savedMeals
      : activeCategory === "all"
      ? MEAL_LIBRARY
      : MEAL_LIBRARY.filter((m) => m.category === activeCategory);

  const toggleSave = (meal: Meal) => {
    if (savedIds.has(meal.id)) removeSavedMeal(meal.id);
    else saveMeal(meal);
    reload();
  };

  const logMeal = (meal: Meal) => {
    addMealEntry({
      id: `${meal.id}-${Date.now()}`,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      time: new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" }),
    });
    setLogged(meal.id);
    setTimeout(() => setLogged(null), 2000);
  };

  return (
    <div className="space-y-5 py-4">
      <div className="bg-gradient-to-r from-amber-500 to-orange-400 rounded-2xl p-5 text-white shadow-md">
        <h1 className="text-2xl font-extrabold">Meal Library 📖</h1>
        <p className="text-amber-100 text-sm mt-1">
          Browse healthy meals by category. Bookmark favourites or log them directly.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["all", ...CATEGORIES, "saved"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border-2 transition-colors ${
              activeCategory === cat
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white border-gray-300 text-gray-700 hover:border-amber-300"
            }`}
          >
            {cat === "all" ? "All Meals" : cat === "saved" ? "⭐ Saved" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {allMeals.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-12">
          {activeCategory === "saved"
            ? "No saved meals yet — bookmark a meal below."
            : "No meals found."}
        </p>
      )}

      <div className="space-y-4">
        {allMeals.map((meal) => {
          const expanded = expandedId === meal.id;
          const imgSrc = images[meal.id];
          const gradientClass = CATEGORY_BG[meal.category] || CATEGORY_BG["balanced"];

          return (
            <div
              key={meal.id}
              className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm"
            >
              {/* Food photo */}
              <div className="relative w-full h-44">
                {imgSrc ? (
                  <Image
                    src={imgSrc}
                    alt={meal.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 800px"
                    unoptimized
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}
                  >
                    <span className="text-5xl">🍽️</span>
                  </div>
                )}
                {/* Category badge over image */}
                <span
                  className={`absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full border font-bold shadow ${CATEGORY_COLORS[meal.category]}`}
                >
                  {CATEGORY_LABELS[meal.category]}
                </span>
                {/* Save button over image */}
                <button
                  onClick={() => toggleSave(meal)}
                  className={`absolute top-3 right-3 p-2 rounded-full shadow transition-colors ${
                    savedIds.has(meal.id)
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-gray-500 hover:text-emerald-600"
                  }`}
                >
                  {savedIds.has(meal.id) ? (
                    <BookmarkCheck size={16} />
                  ) : (
                    <Bookmark size={16} />
                  )}
                </button>
              </div>

              {/* Card body */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-900 text-base leading-snug">{meal.name}</h3>
                  <button
                    onClick={() => logMeal(meal)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      logged === meal.id
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {logged === meal.id ? "✓ Logged!" : <><Plus size={12} className="inline -mt-0.5" /> Log</>}
                  </button>
                </div>

                {/* Macro pills */}
                <div className="flex gap-2 mt-2.5 flex-wrap">
                  <MacroPill label="Cals" value={meal.calories} unit="kcal" color="bg-orange-100 text-orange-700" />
                  <MacroPill label="Protein" value={meal.protein} unit="g" color="bg-red-100 text-red-700" />
                  <MacroPill label="Carbs" value={meal.carbs} unit="g" color="bg-yellow-100 text-yellow-700" />
                  <MacroPill label="Fat" value={meal.fat} unit="g" color="bg-blue-100 text-blue-700" />
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
                    <Clock size={10} /> {meal.prepTime} min
                  </span>
                </div>

                <button
                  onClick={() => setExpandedId(expanded ? null : meal.id)}
                  className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
                >
                  {expanded ? (
                    <><ChevronUp size={13} /> Hide recipe</>
                  ) : (
                    <><ChevronDown size={13} /> View recipe & ingredients</>
                  )}
                </button>
              </div>

              {/* Expanded recipe */}
              {expanded && (
                <div className="border-t-2 border-gray-100 px-4 py-4 bg-amber-50 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                      🛒 Ingredients
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {meal.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">•</span> {ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                      👨‍🍳 Instructions
                    </p>
                    <ol className="text-sm text-gray-700 space-y-2">
                      {meal.instructions.map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="bg-amber-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MacroPill({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <span className={`text-xs font-bold rounded-full px-2.5 py-1 ${color}`}>
      {label}: {value}{unit}
    </span>
  );
}
