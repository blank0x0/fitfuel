import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) return NextResponse.json({ image: null });

  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`,
      { next: { revalidate: 86400 } } // cache for 24h
    );
    const data = await res.json();
    const meal = data?.meals?.[0];
    return NextResponse.json({ image: meal?.strMealThumb ?? null });
  } catch {
    return NextResponse.json({ image: null });
  }
}
