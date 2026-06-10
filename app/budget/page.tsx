"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ShoppingCart, Loader2, Calculator } from "lucide-react";
import { type Transition } from "framer-motion";
import { MEAL_LIBRARY } from "@/lib/meals-data";
import s from "@/components/Budget.module.css";

/* ── Types ──────────────────────────────────────────────────────── */
interface PriceRow {
  ingredient: string;
  price: number;
  unit: string;
  inStock: boolean;
}

interface PriceResult {
  prices: PriceRow[];
  subtotal: number;
  savings: number;
  cheapestStore: string;
}

/* ── Store catalogue ────────────────────────────────────────────── */
const STORES = [
  { name: "No Frills",     emoji: "🟡", tier: "Budget",  tierCss: s.tierBudget  },
  { name: "Food Basics",   emoji: "🔵", tier: "Budget",  tierCss: s.tierBudget  },
  { name: "Walmart",       emoji: "☀️", tier: "Budget",  tierCss: s.tierBudget  },
  { name: "Metro",         emoji: "🔴", tier: "Mid",     tierCss: s.tierMid     },
  { name: "Sobeys",        emoji: "🟠", tier: "Mid",     tierCss: s.tierMid     },
  { name: "Save-On Foods", emoji: "🌿", tier: "Mid",     tierCss: s.tierMid     },
  { name: "Loblaws",       emoji: "🟢", tier: "Premium", tierCss: s.tierPremium },
  { name: "Costco",        emoji: "🏭", tier: "Bulk",    tierCss: s.tierBulk    },
];

const EASE: Transition = { duration: 0.35, ease: "easeOut" };
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { ...EASE, delay } as Transition,
});

/* ════════════════════════════════════════════════════════════════════
   Page
   ════════════════════════════════════════════════════════════════════ */
export default function BudgetPage() {
  const [store, setStore]               = useState<string>("");
  const [ingredients, setIngredients]   = useState<string[]>([]);
  const [inputVal, setInputVal]         = useState("");
  const [result, setResult]             = useState<PriceResult | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const inputRef                        = useRef<HTMLInputElement>(null);

  /* Add a single ingredient chip */
  const addIngredient = (val = inputVal) => {
    const t = val.trim();
    if (t && !ingredients.includes(t.toLowerCase())) {
      setIngredients(prev => [...prev, t.toLowerCase()]);
    }
    setInputVal("");
    inputRef.current?.focus();
  };

  /* Load all ingredients from a meal */
  const loadMeal = (mealId: string) => {
    if (!mealId) return;
    const meal = MEAL_LIBRARY.find(m => m.id === mealId);
    if (!meal) return;
    const cleaned = meal.ingredients.map(i =>
      i.replace(/^[\d.]+\s*(g|kg|cup|tbsp|tsp|ml|oz|lb|can|clove|medium|large|small|bunch)?\s*/i, "")
        .replace(/\s*\(.*?\)/g, "")
        .trim()
        .toLowerCase()
    );
    setIngredients(prev => {
      const merged = [...prev];
      cleaned.forEach(c => { if (!merged.includes(c)) merged.push(c); });
      return merged;
    });
  };

  /* Fetch prices */
  const calculate = async () => {
    if (!store)            { setError("Please select a store first."); return; }
    if (!ingredients.length) { setError("Please add at least one ingredient."); return; }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res  = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store, ingredients }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const matchedCount = result?.prices.filter(p => p.inStock && p.price > 0).length ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", paddingTop: "1rem", paddingBottom: "1rem" }}>

      {/* ── Hero ─────────────────────────────────────── */}
      <motion.div {...fadeUp(0)} className={s.hero}>
        <h1 className={s.heroTitle}>🛒 Budget Planner</h1>
        <p className={s.heroSub}>Compare ingredient prices across Canadian grocery stores and calculate your shopping total before you leave home.</p>
        <span className={s.heroBadge}>🇨🇦 Canadian prices · CAD</span>
      </motion.div>

      {/* ── Store picker ─────────────────────────────── */}
      <motion.section {...fadeUp(0.07)} className={s.card} aria-label="Store selector">
        <h2 className={s.cardTitle}>
          <span className={s.cardIcon} style={{ background: "#dbeafe" }}>🏪</span>
          Choose Your Store
        </h2>

        <div className={s.storeGrid} role="radiogroup" aria-label="Select supermarket">
          {STORES.map(st => (
            <button
              key={st.name}
              role="radio"
              aria-checked={store === st.name}
              onClick={() => { setStore(st.name); setResult(null); }}
              className={`${s.storeBtn} ${store === st.name ? s.storeBtnActive : ""}`}
            >
              <span className={s.storeEmoji} aria-hidden="true">{st.emoji}</span>
              <span className={s.storeName}>{st.name}</span>
              <span className={`${s.storeTier} ${st.tierCss}`}>{st.tier}</span>
            </button>
          ))}
        </div>

        {store && (
          <p style={{ marginTop: "12px", fontSize: ".8rem", color: "#6b7280", fontWeight: 600 }}>
            ✓ Selected: <strong style={{ color: "#1d4ed8" }}>{store}</strong>
          </p>
        )}
      </motion.section>

      {/* ── Ingredient builder ───────────────────────── */}
      <motion.section {...fadeUp(0.13)} className={s.card} aria-label="Ingredient list">
        <h2 className={s.cardTitle}>
          <span className={s.cardIcon} style={{ background: "#fef9c3" }}>🥦</span>
          Ingredients
        </h2>

        {/* Load from meal */}
        <label htmlFor="meal-select" style={{ fontSize: ".78rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: "6px" }}>
          Auto-fill from meal library:
        </label>
        <select
          id="meal-select"
          className={s.mealSelect}
          defaultValue=""
          onChange={e => { loadMeal(e.target.value); e.target.value = ""; }}
          aria-label="Select a meal to auto-fill ingredients"
        >
          <option value="">Choose a meal to import its ingredients…</option>
          {MEAL_LIBRARY.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        {/* Manual input */}
        <div style={{ marginTop: "14px", fontSize: ".78rem", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
          Or add manually:
        </div>
        <div className={s.inputRow}>
          <input
            ref={inputRef}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addIngredient())}
            placeholder="e.g. chicken breast, salmon, oats…"
            aria-label="Add ingredient"
            style={{ flex: 1, padding: "10px 14px", fontSize: ".875rem" }}
          />
          <button
            onClick={() => addIngredient()}
            aria-label="Add ingredient"
            className={s.addBtn}
          >
            <Plus size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Chips */}
        <AnimatePresence>
          {ingredients.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={s.chipList}
              role="list"
              aria-label="Ingredient list"
            >
              {ingredients.map(ing => (
                <motion.span
                  key={ing}
                  initial={{ scale: .7, opacity: 0 }}
                  animate={{ scale: 1,  opacity: 1 }}
                  exit={{ scale: .7, opacity: 0 }}
                  className={s.chip}
                  role="listitem"
                >
                  {ing}
                  <button
                    onClick={() => setIngredients(p => p.filter(i => i !== ing))}
                    aria-label={`Remove ${ing}`}
                    className={s.chipX}
                  >
                    <X size={11} aria-hidden="true" />
                  </button>
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {ingredients.length === 0 && (
          <p style={{ fontSize: ".8rem", color: "#9ca3af", marginTop: "10px" }}>
            No ingredients added yet. Import from a meal or type them in above.
          </p>
        )}
      </motion.section>

      {/* ── Error ────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="alert"
            style={{ background: "#fef2f2", border: "2px solid #fecaca", borderRadius: "14px",
                     padding: "12px 16px", fontSize: ".875rem", fontWeight: 600, color: "#dc2626" }}
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Calculate button ─────────────────────────── */}
      <motion.div {...fadeUp(0.18)}>
        <button
          onClick={calculate}
          disabled={loading || !store || !ingredients.length}
          className={s.calcBtn}
          aria-busy={loading}
        >
          {loading
            ? <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Calculating prices…</>
            : <><Calculator size={18} aria-hidden="true" /> Calculate Shopping Total</>
          }
        </button>
      </motion.div>

      {/* ── Loading skeletons ────────────────────────── */}
      {loading && (
        <div aria-busy="true" aria-label="Loading prices">
          {[1,2,3,4].map(i => <div key={i} className={s.skeletonRow} />)}
        </div>
      )}

      {/* ── Results ──────────────────────────────────── */}
      <AnimatePresence>
        {result && !loading && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .4, ease: "easeOut" } as Transition}
            aria-label="Price breakdown"
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                Price Breakdown — {store}
              </h2>
              <span style={{ fontSize: ".75rem", fontWeight: 600, color: "#6b7280" }}>
                {matchedCount} / {result.prices.length} items found
              </span>
            </div>

            {/* Price table */}
            <div className={s.card} style={{ padding: 0, overflow: "hidden" }}>
              <table className={s.table} aria-label={`Ingredient prices at ${store}`}>
                <thead>
                  <tr>
                    <th scope="col">Ingredient</th>
                    <th scope="col">Pack size</th>
                    <th scope="col" style={{ textAlign: "right" }}>Price (CAD)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.prices.map((row, i) => (
                    <motion.tr
                      key={row.ingredient}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, ease: "easeOut" } as Transition}
                    >
                      <td className={`${s.ingCell} ${!row.inStock ? s.noMatch : ""}`}>
                        {!row.inStock ? "⚠️ " : row.price === 0 ? "❓ " : "✅ "}
                        {row.ingredient}
                      </td>
                      <td className={s.unitCell}>{row.unit !== "—" ? row.unit : "—"}</td>
                      {row.inStock && row.price > 0
                        ? <td className={s.priceCell}>${row.price.toFixed(2)}</td>
                        : <td className={s.naCell}>
                            {store === "Costco" && !row.inStock ? "Not sold individually" : "Not found"}
                          </td>
                      }
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <p style={{ fontSize: ".72rem", color: "#9ca3af", marginTop: "6px", marginLeft: "4px" }}>
              ✅ Price found &nbsp;·&nbsp; ❓ No match in database &nbsp;·&nbsp; ⚠️ Not sold at this store
            </p>

            {/* Totals */}
            <div className={s.totals} style={{ marginTop: "14px" }}>
              {result.savings > 0 && (
                <div className={`${s.totalsRow} ${s.savingsRow}`}>
                  <span className={s.totalsLabel}>💡 Cheapest alternative</span>
                  <span className={s.totalsValue} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className={s.cheapestBadge}>🏆 {result.cheapestStore}</span>
                    saves ${result.savings.toFixed(2)}
                  </span>
                </div>
              )}
              <div className={`${s.totalsRow} ${s.subtotalRow}`}>
                <span className={s.totalsLabel}>
                  <ShoppingCart size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} aria-hidden="true" />
                  Estimated Total at {store}
                </span>
                <span className={s.totalsValue} style={{ fontSize: "1.2rem" }}>
                  ${result.subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            <p style={{ fontSize: ".72rem", color: "#9ca3af", marginTop: "8px", marginLeft: "4px" }}>
              Prices are estimates based on current Canadian averages. Actual prices may vary by location and date.
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Empty state ──────────────────────────────── */}
      {!result && !loading && (
        <div className={s.empty} aria-label="Instructions">
          <span className={s.emptyIcon}>🛒</span>
          <p className={s.emptyText}>
            Select a store, add your ingredients, then tap <strong>Calculate</strong> to see a full price breakdown and subtotal.
          </p>
        </div>
      )}

    </div>
  );
}
