export interface DayLog {
  date: string; // YYYY-MM-DD
  steps: number;
  calorieGoal: number;
  workedOut: boolean;
  workoutType?: string;
  meals: MealEntry[];
}

export interface MealEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

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
  prepTime: number; // minutes
  imageQuery?: string; // search term for TheMealDB
  saved?: boolean;
}

export type MealCategory = "high-protein" | "high-carb" | "low-calorie" | "balanced" | "ai-generated";

export interface Deal {
  id: string;
  store: string;
  item: string;
  price: string;
  originalPrice?: string;
  unit?: string;
  validUntil?: string;
  category: DealCategory;
}

export type DealCategory = "meat" | "produce" | "dairy" | "grains" | "other";

export interface UserIngredients {
  items: string[];
}

export interface AISuggestion {
  name: string;
  category: MealCategory;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  tip?: string;
}
