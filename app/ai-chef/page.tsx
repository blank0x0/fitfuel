"use client";
import { useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { Sparkles, Plus, X, ChefHat, Bookmark, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { AISuggestion } from "@/types";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/meals-data";
import { saveMeal, addMealEntry } from "@/lib/storage";

export default function AIChefPage() {
  const [input, setInput]               = useState("");
  const [ingredients, setIngredients]   = useState<string[]>([]);
  const [suggestions, setSuggestions]   = useState<AISuggestion[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [savedIdx, setSavedIdx]         = useState<Set<number>>(new Set());
  const [loggedIdx, setLoggedIdx]       = useState<Set<number>>(new Set());
  const [expandedIdx, setExpandedIdx]   = useState<Set<number>>(new Set());

  const addIngredient = () => {
    const t = input.trim();
    if (t && !ingredients.includes(t)) setIngredients(p => [...p, t]);
    setInput("");
  };

  const getSuggestions = async () => {
    if (!ingredients.length) return;
    setLoading(true); setError(""); setSuggestions([]);
    setSavedIdx(new Set()); setLoggedIdx(new Set());
    try {
      const res  = await fetch("/api/meal-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSuggestions(data.suggestions);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "AI service unavailable. Ensure GROQ_API_KEY is set in .env.local");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (s: AISuggestion, idx: number) => {
    saveMeal({ id:`ai-${Date.now()}-${idx}`, name:s.name, category:s.category,
      calories:s.calories, protein:s.protein, carbs:s.carbs, fat:s.fat,
      ingredients:s.ingredients, instructions:s.instructions, prepTime:s.prepTime, saved:true });
    setSavedIdx(p => new Set([...p, idx]));
  };

  const handleLog = (s: AISuggestion, idx: number) => {
    addMealEntry({ id:`ai-log-${Date.now()}`, name:s.name, calories:s.calories,
      protein:s.protein, carbs:s.carbs, fat:s.fat,
      time: new Date().toLocaleTimeString("en-CA",{hour:"2-digit",minute:"2-digit"}) });
    setLoggedIdx(p => new Set([...p, idx]));
  };

  const toggleExpand = (idx: number) => {
    setExpandedIdx(p => { const n = new Set(p); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  };

  return (
    <div className="space-y-5 py-4">

      {/* Hero */}
      <motion.div
        initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:.4 }}
        className="hero-purple rounded-3xl p-6 text-white shadow-lg relative overflow-hidden"
      >
        <span className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-white opacity-5" />
        <div className="flex items-center gap-4">
          <ChefHat size={40} className="opacity-80 flex-shrink-0" aria-hidden />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">AI Chef</h1>
            <p className="text-purple-100 text-sm mt-0.5">
              Tell us what you have — we&apos;ll build healthy meal ideas just for you.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Ingredient input */}
      <motion.section
        initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:.35, delay:.08 }}
        aria-label="Ingredient input"
        className="surface space-y-3"
      >
        <label htmlFor="ingredient-input" className="font-bold text-gray-800 text-lg block">
          What ingredients do you have?
        </label>

        <div className="flex gap-2">
          <input
            id="ingredient-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addIngredient())}
            placeholder="e.g. chicken breast, rice, broccoli…"
            aria-label="Add an ingredient"
            className="flex-1 px-4 py-2.5 text-sm"
          />
          <button onClick={addIngredient} aria-label="Add ingredient" className="btn btn-primary px-3">
            <Plus size={18} aria-hidden />
          </button>
        </div>

        {/* Ingredient chips */}
        <AnimatePresence>
          {ingredients.length > 0 && (
            <motion.div
              initial={{ opacity:0, height:0 }}
              animate={{ opacity:1, height:"auto" }}
              exit={{ opacity:0, height:0 }}
              className="flex flex-wrap gap-2"
              role="list"
              aria-label="Added ingredients"
            >
              {ingredients.map((ing, i) => (
                <motion.span
                  key={ing}
                  initial={{ scale:.8, opacity:0 }}
                  animate={{ scale:1, opacity:1 }}
                  exit={{ scale:.8, opacity:0 }}
                  role="listitem"
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background:"#ede9fe", color:"#6d28d9", border:"1.5px solid #c4b5fd" }}
                >
                  {ing}
                  <button
                    onClick={() => setIngredients(p => p.filter((_,j)=>j!==i))}
                    aria-label={`Remove ${ing}`}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X size={11} aria-hidden />
                  </button>
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={getSuggestions}
          disabled={!ingredients.length || loading}
          aria-busy={loading}
          className="btn btn-primary w-full py-3 text-base"
          style={{ background:"#7c3aed" }}
        >
          {loading
            ? <><Loader2 size={18} className="animate-spin" aria-hidden /> Thinking…</>
            : <><Sparkles size={18} aria-hidden /> Generate Meal Ideas</>
          }
        </button>

        {error && (
          <div role="alert" className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background:"#fef2f2", color:"var(--color-danger)", border:"2px solid #fecaca" }}>
            ⚠️ {error}
          </div>
        )}
      </motion.section>

      {/* Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.section
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            aria-label="AI meal suggestions"
            className="space-y-3"
          >
            <h2 className="font-bold text-gray-700 text-sm uppercase tracking-widest">
              ✨ AI Suggestions
            </h2>
            {suggestions.map((s, idx) => (
              <motion.article
                key={idx}
                initial={{ opacity:0, y:14 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay: idx * 0.08 }}
                className="surface card-hover overflow-hidden"
                aria-label={s.name}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-gray-900">{s.name}</h3>
                      <span className={`badge ${CATEGORY_COLORS[s.category] || ""}`}>
                        {CATEGORY_LABELS[s.category] || s.category}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Pill label="Cals" value={s.calories} unit="kcal" color="#fff7ed" text="#ea580c" />
                      <Pill label="P"    value={s.protein}  unit="g"    color="#fef2f2" text="#dc2626" />
                      <Pill label="C"    value={s.carbs}    unit="g"    color="#fefce8" text="#ca8a04" />
                      <Pill label="F"    value={s.fat}      unit="g"    color="#eff6ff" text="#2563eb" />
                      <Pill label="Prep" value={s.prepTime} unit=" min" color="#f5f3ff" text="#7c3aed" />
                    </div>
                    {s.tip && (
                      <p className="text-xs mt-2 italic font-medium" style={{ color:"#7c3aed" }}>
                        💡 {s.tip}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleSave(s, idx)}
                      aria-label={savedIdx.has(idx) ? "Saved to library" : "Save to meal library"}
                      aria-pressed={savedIdx.has(idx)}
                      className="btn btn-secondary p-2"
                      style={{ color: savedIdx.has(idx) ? "var(--color-primary)" : undefined }}
                    >
                      <Bookmark size={16} aria-hidden />
                    </button>
                    <button
                      onClick={() => handleLog(s, idx)}
                      aria-label={`Log ${s.name}`}
                      className="btn px-2 py-1.5 text-xs font-bold"
                      style={{
                        background: loggedIdx.has(idx) ? "#d1fae5" : "var(--color-primary)",
                        color:      loggedIdx.has(idx) ? "var(--color-primary)" : "#fff",
                      }}
                    >
                      {loggedIdx.has(idx) ? "✓ Logged" : "Log"}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => toggleExpand(idx)}
                  aria-expanded={expandedIdx.has(idx)}
                  className="mt-3 flex items-center gap-1 text-xs font-bold transition-colors"
                  style={{ color:"#7c3aed" }}
                >
                  {expandedIdx.has(idx)
                    ? <><ChevronUp size={13} aria-hidden /> Hide recipe</>
                    : <><ChevronDown size={13} aria-hidden /> View recipe</>}
                </button>

                <AnimatePresence>
                  {expandedIdx.has(idx) && (
                    <motion.div
                      initial={{ opacity:0, height:0 }}
                      animate={{ opacity:1, height:"auto" }}
                      exit={{ opacity:0, height:0 }}
                      className="mt-3 pt-3 border-t-2 border-gray-100 space-y-3"
                    >
                      <RecipeSection title="🛒 Ingredients" items={s.ingredients} ordered={false} />
                      <RecipeSection title="👨‍🍳 Instructions" items={s.instructions} ordered />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            ))}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!loading && !suggestions.length && !ingredients.length && (
        <div className="text-center py-16 space-y-3" role="status">
          <ChefHat size={48} className="mx-auto" style={{ color:"#c4b5fd", opacity:.6 }} aria-hidden />
          <p className="text-gray-400 font-medium">
            Add your ingredients above and tap <strong>Generate</strong> to get personalised meal ideas.
          </p>
        </div>
      )}
    </div>
  );
}

function Pill({ label, value, unit, color, text }: { label:string; value:number; unit:string; color:string; text:string }) {
  return (
    <span className="text-xs font-bold rounded-full px-2.5 py-1" style={{ background:color, color:text }}>
      {label}: {value}{unit}
    </span>
  );
}

function RecipeSection({ title, items, ordered }: { title:string; items:string[]; ordered:boolean }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-wide mb-2" style={{ color:"var(--color-text-secondary)" }}>
        {title}
      </p>
      {ordered ? (
        <ol className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 mt-0.5"
                style={{ background:"#7c3aed", color:"#fff" }}>
                {i+1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      ) : (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
              <span style={{ color:"#7c3aed" }}>•</span> {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
