import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postal = searchParams.get("postal");

  if (!postal) {
    return NextResponse.json({ error: "postal code required" }, { status: 400 });
  }

  try {
    // Strip spaces and uppercase for Canadian postal codes (e.g. "M5V3L9")
    const cleaned = postal.replace(/\s+/g, "").toUpperCase();

    // Try postalcode search first (most accurate for Canadian codes)
    const url1 = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(cleaned)}&countrycodes=ca&format=json&limit=1&addressdetails=1`;
    const res1 = await fetch(url1, { headers: { "User-Agent": "FitFuel-App/1.0" } });
    const data1 = await res1.json();

    if (data1.length) {
      return NextResponse.json({ lat: parseFloat(data1[0].lat), lon: parseFloat(data1[0].lon), display: data1[0].display_name });
    }

    // Fallback: free-text search with Canada appended
    const url2 = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleaned + ", Canada")}&format=json&limit=1`;
    const res2 = await fetch(url2, { headers: { "User-Agent": "FitFuel-App/1.0" } });
    const data2 = await res2.json();

    if (data2.length) {
      return NextResponse.json({ lat: parseFloat(data2[0].lat), lon: parseFloat(data2[0].lon), display: data2[0].display_name });
    }

    return NextResponse.json({ error: "Postal code not found. Try entering your city name instead (e.g. Toronto, ON)." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
