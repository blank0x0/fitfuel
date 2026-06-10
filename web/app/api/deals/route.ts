import { NextRequest, NextResponse } from "next/server";
import { Deal } from "@/types";

// Canadian grocery store deals — seeded with realistic weekly deals.
// In production, replace with Flipp API (flipp.com) or store-specific scraping.
const SAMPLE_DEALS: Deal[] = [
  { id: "d1", store: "No Frills", item: "Chicken Breast", price: "$4.99/kg", originalPrice: "$8.99/kg", unit: "per kg", validUntil: "Sat", category: "meat" },
  { id: "d2", store: "Food Basics", item: "Lean Ground Beef", price: "$5.99/kg", originalPrice: "$9.49/kg", unit: "per kg", validUntil: "Sun", category: "meat" },
  { id: "d3", store: "Metro", item: "Atlantic Salmon Fillet", price: "$9.99/kg", originalPrice: "$16.99/kg", unit: "per kg", validUntil: "Thu", category: "meat" },
  { id: "d4", store: "Walmart", item: "Canned Tuna (6-pack)", price: "$5.97", originalPrice: "$8.97", validUntil: "Sat", category: "meat" },
  { id: "d5", store: "No Frills", item: "Baby Spinach", price: "$1.99", originalPrice: "$3.99", unit: "170g bag", validUntil: "Sat", category: "produce" },
  { id: "d6", store: "Food Basics", item: "Broccoli", price: "$0.99/lb", originalPrice: "$1.99/lb", validUntil: "Sun", category: "produce" },
  { id: "d7", store: "Sobeys", item: "Cherry Tomatoes", price: "$2.49", originalPrice: "$4.49", unit: "pint", validUntil: "Thu", category: "produce" },
  { id: "d8", store: "Metro", item: "Sweet Potatoes", price: "$1.49/kg", originalPrice: "$2.49/kg", validUntil: "Thu", category: "produce" },
  { id: "d9", store: "Walmart", item: "Bananas", price: "$0.49/lb", validUntil: "Sat", category: "produce" },
  { id: "d10", store: "No Frills", item: "Blueberries", price: "$2.99", originalPrice: "$5.49", unit: "pint", validUntil: "Sat", category: "produce" },
  { id: "d11", store: "Food Basics", item: "Greek Yogurt 2%", price: "$3.49", originalPrice: "$5.99", unit: "750g", validUntil: "Sun", category: "dairy" },
  { id: "d12", store: "Walmart", item: "Large Eggs (12)", price: "$3.97", originalPrice: "$5.97", validUntil: "Sat", category: "dairy" },
  { id: "d13", store: "Sobeys", item: "Cottage Cheese", price: "$2.99", originalPrice: "$4.49", unit: "500g", validUntil: "Thu", category: "dairy" },
  { id: "d14", store: "Metro", item: "Milk 2% (4L)", price: "$4.49", originalPrice: "$5.99", validUntil: "Thu", category: "dairy" },
  { id: "d15", store: "No Frills", item: "Brown Rice", price: "$3.99", originalPrice: "$5.99", unit: "2kg", validUntil: "Sat", category: "grains" },
  { id: "d16", store: "Walmart", item: "Rolled Oats", price: "$4.97", originalPrice: "$7.47", unit: "2.25kg", validUntil: "Sat", category: "grains" },
  { id: "d17", store: "Food Basics", item: "Whole Grain Pasta", price: "$1.49", originalPrice: "$2.49", unit: "450g", validUntil: "Sun", category: "grains" },
  { id: "d18", store: "Metro", item: "Red Lentils", price: "$2.49", originalPrice: "$3.99", unit: "900g", validUntil: "Thu", category: "grains" },
  { id: "d19", store: "Sobeys", item: "Black Beans (canned)", price: "$0.99", originalPrice: "$1.49", validUntil: "Thu", category: "grains" },
  { id: "d20", store: "No Frills", item: "Quinoa", price: "$4.99", originalPrice: "$8.99", unit: "1kg", validUntil: "Sat", category: "grains" },
];

// Keyword map from meal ingredients → deal categories/items
const INGREDIENT_KEYWORDS: Record<string, string[]> = {
  chicken: ["chicken", "poultry"],
  beef: ["beef", "ground beef"],
  salmon: ["salmon", "fish"],
  tuna: ["tuna", "fish"],
  shrimp: ["shrimp", "seafood"],
  turkey: ["turkey"],
  eggs: ["eggs"],
  yogurt: ["yogurt"],
  milk: ["milk", "dairy"],
  spinach: ["spinach", "greens"],
  broccoli: ["broccoli"],
  tomato: ["tomato"],
  "sweet potato": ["sweet potato", "potato"],
  banana: ["banana"],
  blueberries: ["blueberries", "berries"],
  rice: ["rice"],
  oats: ["oats", "oatmeal"],
  pasta: ["pasta"],
  lentils: ["lentils"],
  beans: ["beans"],
  quinoa: ["quinoa"],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const mealIngredients = searchParams.get("ingredients");

  let deals = [...SAMPLE_DEALS];

  if (category && category !== "all") {
    deals = deals.filter((d) => d.category === category);
  }

  if (mealIngredients) {
    const ingredientList = mealIngredients.toLowerCase().split(",");
    deals = SAMPLE_DEALS.filter((deal) => {
      const itemLower = deal.item.toLowerCase();
      return ingredientList.some((ing) => {
        const trimmed = ing.trim();
        const keywords = INGREDIENT_KEYWORDS[trimmed] || [trimmed];
        return keywords.some((kw) => itemLower.includes(kw));
      });
    });
  }

  return NextResponse.json({ deals });
}
