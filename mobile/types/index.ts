export type WorkoutType =
  | "strength"
  | "cardio"
  | "yoga"
  | "hiit"
  | "cycling"
  | "swimming"
  | "other";

export interface MealEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

export interface DayLog {
  date: string;
  steps: number;
  calorieGoal: number;
  meals: MealEntry[];
  workedOut: boolean;
  workoutType?: WorkoutType;
  workoutNote?: string;
}

export type MealCategory = "high-protein" | "high-carb" | "low-calorie" | "balanced";

export interface Meal {
  id: string;
  name: string;
  category: MealCategory;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  imageQuery?: string;
  imageUrl?: string;
}

export interface AISuggestion {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
}

export type DealCategory = "produce" | "meat" | "dairy" | "bakery" | "frozen" | "pantry";

export interface Deal {
  id: string;
  store: string;
  item: string;
  originalPrice: number;
  salePrice: number;
  category: DealCategory;
  unit: string;
  validUntil: string;
}
