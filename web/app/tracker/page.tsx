"use client";
import { useEffect, useState } from "react";
import { motion, type Transition } from "framer-motion";
import {
  getTodayLog, updateSteps, updateWorkout,
  addMealEntry, removeMealEntry, updateCalorieGoal,
} from "@/lib/storage";
import { DayLog } from "@/types";
import { Activity, Flame, Dumbbell, Plus, Trash2, Check } from "lucide-react";

const WORKOUT_TYPES = ["Weights","Cardio","HIIT","Yoga","Sports","Walk/Run","Swimming","Other"];

const EASE: Transition = { duration: 0.35, ease: "easeOut" };
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { ...EASE, delay } as Transition,
});

export default function TrackerPage() {
  const [log, setLog]           = useState<DayLog | null>(null);
  const [stepInput, setStepInput] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [workoutType, setWorkoutType] = useState("");
  const [mealForm, setMealForm]  = useState({ name:"", calories:"", protein:"", carbs:"", fat:"" });
  const [saved, setSaved]        = useState<Record<string,boolean>>({});

  const reload = () => {
    const l = getTodayLog();
    setLog(l);
    setStepInput(l.steps > 0 ? String(l.steps) : "");
    setGoalInput(String(l.calorieGoal));
    setWorkoutType(l.workoutType || "");
  };

  useEffect(() => { reload(); }, []);

  if (!log) return null;

  const totalCals = log.meals.reduce((s,m) => s + m.calories, 0);

  const flash = (key: string) => {
    setSaved(p => ({ ...p, [key]: true }));
    setTimeout(() => setSaved(p => ({ ...p, [key]: false })), 1800);
  };

  const handleSteps = () => { updateSteps(Number(stepInput)||0); flash("steps"); reload(); };
  const handleGoal  = () => { updateCalorieGoal(Number(goalInput)||2000); flash("goal"); reload(); };

  const handleWorkout = (worked: boolean) => {
    updateWorkout(worked, worked ? workoutType : undefined);
    reload();
  };

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    addMealEntry({
      id: Date.now().toString(),
      name:     mealForm.name,
      calories: Number(mealForm.calories) || 0,
      protein:  Number(mealForm.protein)  || 0,
      carbs:    Number(mealForm.carbs)    || 0,
      fat:      Number(mealForm.fat)      || 0,
      time: new Date().toLocaleTimeString("en-CA",{ hour:"2-digit", minute:"2-digit" }),
    });
    setMealForm({ name:"", calories:"", protein:"", carbs:"", fat:"" });
    reload();
  };

  return (
    <div className="space-y-5 py-4">

      {/* Hero */}
      <motion.div {...fadeUp(0)} className="hero-green rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <span className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white opacity-5" />
        <h1 className="text-3xl font-extrabold tracking-tight">Daily Tracker</h1>
        <p className="text-emerald-100 text-sm mt-1">Log your steps, calories and workout for today.</p>
      </motion.div>

      {/* Steps */}
      <motion.section {...fadeUp(0.07)} aria-label="Step counter">
        <Card icon={<Activity size={20} color="var(--color-primary)" />} title="Steps">
          <div className="flex gap-2">
            <input
              type="number" min="0" value={stepInput}
              onChange={e => setStepInput(e.target.value)}
              placeholder="How many steps today?"
              aria-label="Steps today"
              className="flex-1 px-4 py-2.5 text-sm"
            />
            <button onClick={handleSteps} aria-label="Save steps" className="btn btn-primary">
              {saved.steps ? <><Check size={14} aria-hidden /> Saved</> : "Save"}
            </button>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>{log.steps.toLocaleString()} steps</span>
              <span>Goal: 10,000</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                role="progressbar"
                aria-valuenow={log.steps}
                aria-valuemax={10000}
                aria-label="Steps progress"
                style={{ width:`${Math.min(log.steps/100,100)}%`, background:"var(--color-primary)" }}
              />
            </div>
          </div>
        </Card>
      </motion.section>

      {/* Calorie goal */}
      <motion.section {...fadeUp(0.12)} aria-label="Calorie goal">
        <Card icon={<Flame size={20} color="#f59e0b" />} title="Calorie Goal">
          <div className="flex gap-2">
            <input
              type="number" min="0" value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              placeholder="Daily calorie goal (kcal)"
              aria-label="Daily calorie goal"
              className="flex-1 px-4 py-2.5 text-sm"
            />
            <button onClick={handleGoal} aria-label="Set calorie goal" className="btn btn-primary" style={{ background:"#f59e0b" }}>
              {saved.goal ? <><Check size={14} aria-hidden /> Saved</> : "Set"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1.5 font-medium">
            {totalCals} / {log.calorieGoal} kcal consumed today
          </p>
          <div className="progress-track mt-1">
            <div
              className="progress-fill"
              role="progressbar"
              aria-valuenow={totalCals}
              aria-valuemax={log.calorieGoal}
              aria-label="Calories consumed"
              style={{ width:`${Math.min((totalCals/log.calorieGoal)*100,100)}%`, background:"#f59e0b" }}
            />
          </div>
        </Card>
      </motion.section>

      {/* Workout */}
      <motion.section {...fadeUp(0.17)} aria-label="Workout log">
        <Card icon={<Dumbbell size={20} color="#7c3aed" />} title="Workout">
          <div className="flex gap-2 mb-3" role="group" aria-label="Did you work out today?">
            <button
              onClick={() => handleWorkout(true)}
              aria-pressed={log.workedOut}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all"
              style={{
                background: log.workedOut ? "var(--color-primary)" : "transparent",
                color:      log.workedOut ? "#fff" : "var(--color-text-secondary)",
                borderColor: log.workedOut ? "var(--color-primary)" : "var(--color-border)",
              }}
            >
              ✓ Yes, I worked out
            </button>
            <button
              onClick={() => handleWorkout(false)}
              aria-pressed={!log.workedOut}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all"
              style={{
                background: !log.workedOut ? "#f3f4f6" : "transparent",
                color:      !log.workedOut ? "var(--color-text-secondary)" : "var(--color-text-muted)",
                borderColor: !log.workedOut ? "#d1d5db" : "var(--color-border)",
              }}
            >
              ✗ Rest day
            </button>
          </div>

          {log.workedOut && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Workout type">
              {WORKOUT_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => { setWorkoutType(t); updateWorkout(true, t); reload(); }}
                  aria-pressed={workoutType === t}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                  style={{
                    background:  workoutType === t ? "#7c3aed" : "transparent",
                    color:       workoutType === t ? "#fff"    : "var(--color-text-secondary)",
                    borderColor: workoutType === t ? "#7c3aed" : "var(--color-border)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </Card>
      </motion.section>

      {/* Meal log */}
      <motion.section {...fadeUp(0.22)} aria-label="Meal log">
        <Card icon={<Flame size={20} color="#f97316" />} title="Meal Log">
          <form onSubmit={handleAddMeal} className="space-y-2.5" aria-label="Add a meal">
            <input
              value={mealForm.name}
              onChange={e => setMealForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Meal name (e.g. Chicken bowl)"
              aria-label="Meal name"
              required
              className="w-full px-4 py-2.5 text-sm"
            />
            <div className="grid grid-cols-4 gap-2">
              {(["calories","protein","carbs","fat"] as const).map(field => (
                <input
                  key={field}
                  type="number" min="0"
                  value={mealForm[field]}
                  onChange={e => setMealForm(p => ({ ...p, [field]: e.target.value }))}
                  placeholder={field === "calories" ? "kcal" : `${field[0].toUpperCase()}${field.slice(1)} g`}
                  aria-label={field}
                  className="px-2 py-2 text-xs"
                />
              ))}
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ background:"#f97316" }}>
              <Plus size={15} aria-hidden /> Add Meal
            </button>
          </form>

          {log.meals.length > 0 && (
            <ul className="mt-4 space-y-2" aria-label="Logged meals">
              {log.meals.map(meal => (
                <motion.li
                  key={meal.id}
                  layout
                  initial={{ opacity:0, x:-12 }}
                  animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:12 }}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{ background:"#fff7ed", border:"1.5px solid #fed7aa" }}
                >
                  <div>
                    <p className="text-sm font-bold text-gray-800">{meal.name}</p>
                    <p className="text-xs text-gray-500">
                      {meal.time} · {meal.calories} kcal · P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
                    </p>
                  </div>
                  <button
                    onClick={() => { removeMealEntry(meal.id); reload(); }}
                    aria-label={`Remove ${meal.name}`}
                    className="btn btn-danger p-1.5 ml-2"
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                </motion.li>
              ))}
              <li className="flex justify-between text-sm font-extrabold text-gray-700 pt-3 border-t-2 border-gray-100 px-1">
                <span>Total calories</span>
                <span style={{ color:"#f97316" }}>{totalCals} kcal</span>
              </li>
            </ul>
          )}
        </Card>
      </motion.section>
    </div>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="surface card-hover space-y-3">
      <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:"#f0fdf4" }}>
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </div>
  );
}


