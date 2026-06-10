import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.length < 3) return NextResponse.json({ results: [] });

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + " Canada")}&format=json&limit=6&addressdetails=1&countrycodes=ca`;
    const res = await fetch(url, { headers: { "User-Agent": "FitFuel-App/1.0" } });
    const data = await res.json();

    const results = data.map((item: { place_id: number; lat: string; lon: string; display_name: string; address: Record<string, string> }) => ({
      place_id: item.place_id,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      label: item.display_name.split(",").slice(0, 3).join(",").trim(),
      full: item.display_name,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
