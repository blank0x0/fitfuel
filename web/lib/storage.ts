import { DayLog, MealEntry, Meal } from "@/types";

const TODAY = () => new Date().toISOString().split("T")[0];

export function getTodayLog(): DayLog {
  const key = `fitfuel-day-${TODAY()}`;
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  return {
    date: TODAY(),
    steps: 0,
    calorieGoal: 2000,
    workedOut: false,
    meals: [],
  };
}

export function saveTodayLog(log: DayLog): void {
  localStorage.setItem(`fitfuel-day-${log.date}`, JSON.stringify(log));
}

export function updateSteps(steps: number): void {
  const log = getTodayLog();
  log.steps = steps;
  saveTodayLog(log);
}

export function updateWorkout(workedOut: boolean, workoutType?: string): void {
  const log = getTodayLog();
  log.workedOut = workedOut;
  log.workoutType = workoutType;
  saveTodayLog(log);
}

export function addMealEntry(entry: MealEntry): void {
  const log = getTodayLog();
  log.meals.push(entry);
  saveTodayLog(log);
}

export function removeMealEntry(id: string): void {
  const log = getTodayLog();
  log.meals = log.meals.filter((m) => m.id !== id);
  saveTodayLog(log);
}

export function updateCalorieGoal(goal: number): void {
  const log = getTodayLog();
  log.calorieGoal = goal;
  saveTodayLog(log);
}

export function getSavedMeals(): Meal[] {
  const stored = localStorage.getItem("fitfuel-saved-meals");
  return stored ? JSON.parse(stored) : [];
}

export function saveMeal(meal: Meal): void {
  const meals = getSavedMeals();
  if (!meals.find((m) => m.id === meal.id)) {
    meals.push({ ...meal, saved: true });
    localStorage.setItem("fitfuel-saved-meals", JSON.stringify(meals));
  }
}

export function removeSavedMeal(id: string): void {
  const meals = getSavedMeals().filter((m) => m.id !== id);
  localStorage.setItem("fitfuel-saved-meals", JSON.stringify(meals));
}

export function getLastPostalCode(): string {
  return localStorage.getItem("fitfuel-postal-code") || "";
}

export function savePostalCode(code: string): void {
  localStorage.setItem("fitfuel-postal-code", code);
}

export function getWeekLogs(): DayLog[] {
  const logs: DayLog[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `fitfuel-day-${d.toISOString().split("T")[0]}`;
    const stored = localStorage.getItem(key);
    if (stored) logs.push(JSON.parse(stored));
  }
  return logs;
}
