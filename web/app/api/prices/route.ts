import { NextRequest, NextResponse } from "next/server";

export interface StorePrice {
  ingredient: string;
  price: number;
  unit: string;
  inStock: boolean;
}

// Price data per store — realistic Canadian grocery prices (CAD)
// Budget tier: No Frills, Food Basics, Walmart
// Mid tier:    Metro, Sobeys, Save-On Foods
// Premium:     Loblaws
// Bulk:        Costco (lowest per-unit but sells in larger quantities)

const BASE_PRICES: Record<string, { price: number; unit: string }> = {
  "chicken breast":    { price: 8.49,  unit: "per kg"   },
  "ground beef":       { price: 9.49,  unit: "per kg"   },
  "salmon fillet":     { price: 16.99, unit: "per kg"   },
  "ground turkey":     { price: 9.99,  unit: "per kg"   },
  "shrimp":            { price: 14.99, unit: "per kg"   },
  "tuna (canned)":     { price: 2.49,  unit: "per can"  },
  "eggs (12)":         { price: 5.49,  unit: "per dozen"},
  "egg whites":        { price: 4.99,  unit: "per 500ml"},
  "greek yogurt":      { price: 5.99,  unit: "per 750g" },
  "milk (2%)":         { price: 5.49,  unit: "per 2L"   },
  "cottage cheese":    { price: 4.29,  unit: "per 500g" },
  "spinach":           { price: 3.99,  unit: "per 170g" },
  "broccoli":          { price: 1.99,  unit: "per lb"   },
  "sweet potato":      { price: 1.99,  unit: "per kg"   },
  "cherry tomatoes":   { price: 4.49,  unit: "per pint" },
  "banana":            { price: 0.59,  unit: "per lb"   },
  "blueberries":       { price: 4.99,  unit: "per pint" },
  "avocado":           { price: 1.99,  unit: "each"     },
  "garlic":            { price: 1.49,  unit: "per bulb" },
  "onion":             { price: 0.99,  unit: "each"     },
  "lemon":             { price: 0.79,  unit: "each"     },
  "brown rice":        { price: 5.99,  unit: "per 2kg"  },
  "quinoa":            { price: 8.99,  unit: "per kg"   },
  "rolled oats":       { price: 6.99,  unit: "per 2kg"  },
  "whole grain pasta": { price: 2.49,  unit: "per 450g" },
  "black beans":       { price: 1.49,  unit: "per can"  },
  "red lentils":       { price: 3.49,  unit: "per 900g" },
  "chickpeas":         { price: 1.49,  unit: "per can"  },
  "olive oil":         { price: 8.99,  unit: "per 500ml"},
  "soy sauce":         { price: 3.49,  unit: "per 250ml"},
  "coconut milk":      { price: 2.49,  unit: "per can"  },
  "teriyaki sauce":    { price: 4.49,  unit: "per 350ml"},
  "hoisin sauce":      { price: 3.99,  unit: "per jar"  },
  "curry powder":      { price: 2.99,  unit: "per 100g" },
  "protein powder":    { price: 49.99, unit: "per 2lbs" },
  "granola":           { price: 5.99,  unit: "per 500g" },
  "honey":             { price: 6.99,  unit: "per 500g" },
  "maple syrup":       { price: 7.99,  unit: "per 250ml"},
  "parmesan":          { price: 5.99,  unit: "per 200g" },
  "zucchini":          { price: 1.29,  unit: "each"     },
  "bell pepper":       { price: 1.49,  unit: "each"     },
  "asparagus":         { price: 3.99,  unit: "per bunch"},
  "snap peas":         { price: 3.49,  unit: "per 200g" },
  "carrots":           { price: 2.49,  unit: "per 2lb"  },
  "green onion":       { price: 0.99,  unit: "per bunch"},
  "water chestnuts":   { price: 2.49,  unit: "per can"  },
  "sesame oil":        { price: 5.99,  unit: "per 250ml"},
};

// Multipliers per store (applied to base price)
const STORE_MULTIPLIERS: Record<string, number> = {
  "No Frills":     0.82,
  "Food Basics":   0.84,
  "Walmart":       0.88,
  "Metro":         1.00,
  "Sobeys":        1.03,
  "Save-On Foods": 1.05,
  "Loblaws":       1.10,
  "Costco":        0.72, // cheapest per-unit (bulk)
};

// Some items Costco doesn't carry individually
const COSTCO_UNAVAILABLE = new Set([
  "avocado", "lemon", "onion", "garlic", "green onion",
]);

export async function POST(req: NextRequest) {
  const { ingredients, store } = await req.json();

  if (!ingredients?.length || !store) {
    return NextResponse.json({ error: "Missing ingredients or store" }, { status: 400 });
  }

  const multiplier = STORE_MULTIPLIERS[store] ?? 1.0;

  const prices: StorePrice[] = ingredients.map((ing: string) => {
    const key = ing.toLowerCase().trim();

    // fuzzy match — find the best matching base ingredient
    const match = Object.keys(BASE_PRICES).find(
      (k) => key.includes(k) || k.includes(key) || k.split(" ").some((w) => key.includes(w))
    );

    if (!match) {
      return {
        ingredient: ing,
        price: 0,
        unit: "—",
        inStock: false,
      };
    }

    const base = BASE_PRICES[match];
    const inStock = !(store === "Costco" && COSTCO_UNAVAILABLE.has(match));
    const price = inStock ? Math.round(base.price * multiplier * 100) / 100 : 0;

    return {
      ingredient: ing,
      price,
      unit: base.unit,
      inStock,
    };
  });

  const subtotal = prices.reduce((s, p) => s + p.price, 0);
  const cheapestStore = Object.entries(STORE_MULTIPLIERS).sort((a, b) => a[1] - b[1])[0][0];
  const cheapestMultiplier = STORE_MULTIPLIERS[cheapestStore];
  const cheapestSubtotal = prices
    .filter((p) => p.inStock)
    .reduce((s, p) => {
      const key = Object.keys(BASE_PRICES).find(
        (k) => p.ingredient.toLowerCase().includes(k) || k.includes(p.ingredient.toLowerCase())
      );
      return s + (key ? Math.round(BASE_PRICES[key].price * cheapestMultiplier * 100) / 100 : 0);
    }, 0);

  const savings = Math.max(0, subtotal - cheapestSubtotal);

  return NextResponse.json({ prices, subtotal, savings, cheapestStore });
}
