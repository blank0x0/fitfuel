import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { ingredients } = await req.json();

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: "No ingredients provided" }, { status: 400 });
    }

    const prompt = `You are a professional nutritionist and chef. A user has these ingredients at home: ${ingredients.join(", ")}.

Suggest 3 healthy meals they can make. For each meal, respond ONLY with valid JSON in this exact format (no markdown, no explanation):

[
  {
    "name": "Meal Name",
    "category": "high-protein",
    "calories": 450,
    "protein": 35,
    "carbs": 40,
    "fat": 12,
    "prepTime": 20,
    "ingredients": ["ingredient 1 with amount", "ingredient 2 with amount"],
    "instructions": ["Step 1", "Step 2", "Step 3"],
    "tip": "A short budget or nutrition tip"
  }
]

Category must be one of: high-protein, high-carb, low-calorie, balanced.
Make meals practical, healthy, and budget-friendly. Use only the ingredients provided plus common pantry staples (salt, pepper, oil, water).`;

    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const text = completion.choices[0]?.message?.content || "[]";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("Groq API error:", err);
    return NextResponse.json({ error: "AI service unavailable" }, { status: 500 });
  }
}
