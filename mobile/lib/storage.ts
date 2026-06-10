import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DayLog, MealEntry, Meal, WorkoutType } from "../types";

const today = () => new Date().toISOString().split("T")[0];

const DEFAULT_LOG = (): DayLog => ({
  date: today(),
  steps: 0,
  calorieGoal: 2000,
  meals: [],
  workedOut: false,
});

export async function getTodayLog(): Promise<DayLog> {
  const key = `fitfuel-log-${today()}`;
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : DEFAULT_LOG();
}

export async function saveTodayLog(log: DayLog): Promise<void> {
  const key = `fitfuel-log-${log.date}`;
  await AsyncStorage.setItem(key, JSON.stringify(log));
}

export async function updateSteps(steps: number): Promise<DayLog> {
  const log = await getTodayLog();
  log.steps = steps;
  await saveTodayLog(log);
  return log;
}

export async function updateWorkout(
  workedOut: boolean,
  type?: WorkoutType,
  note?: string
): Promise<DayLog> {
  const log = await getTodayLog();
  log.workedOut = workedOut;
  if (type) log.workoutType = type;
  if (note !== undefined) log.workoutNote = note;
  await saveTodayLog(log);
  return log;
}

export async function addMealEntry(entry: MealEntry): Promise<DayLog> {
  const log = await getTodayLog();
  log.meals = [...log.meals, entry];
  await saveTodayLog(log);
  return log;
}

export async function removeMealEntry(id: string): Promise<DayLog> {
  const log = await getTodayLog();
  log.meals = log.meals.filter((m) => m.id !== id);
  await saveTodayLog(log);
  return log;
}

export async function updateCalorieGoal(goal: number): Promise<DayLog> {
  const log = await getTodayLog();
  log.calorieGoal = goal;
  await saveTodayLog(log);
  return log;
}

export async function getWeekLogs(): Promise<DayLog[]> {
  const logs: DayLog[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const raw = await AsyncStorage.getItem(`fitfuel-log-${dateStr}`);
    logs.push(raw ? JSON.parse(raw) : { ...DEFAULT_LOG(), date: dateStr });
  }
  return logs;
}

export async function getSavedMeals(): Promise<Meal[]> {
  const raw = await AsyncStorage.getItem("fitfuel-saved-meals");
  return raw ? JSON.parse(raw) : [];
}

export async function saveMeal(meal: Meal): Promise<void> {
  const meals = await getSavedMeals();
  if (!meals.find((m) => m.id === meal.id)) {
    await AsyncStorage.setItem(
      "fitfuel-saved-meals",
      JSON.stringify([...meals, meal])
    );
  }
}

export async function removeSavedMeal(id: string): Promise<void> {
  const meals = await getSavedMeals();
  await AsyncStorage.setItem(
    "fitfuel-saved-meals",
    JSON.stringify(meals.filter((m) => m.id !== id))
  );
}

export async function getLastPostalCode(): Promise<string> {
  return (await AsyncStorage.getItem("fitfuel-postal")) ?? "";
}

export async function savePostalCode(code: string): Promise<void> {
  await AsyncStorage.setItem("fitfuel-postal", code);
}
