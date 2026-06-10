"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Tag, MapPin, ShoppingCart, Search, Loader2, ExternalLink, X } from "lucide-react";
import { Deal, DealCategory } from "@/types";
import { getLastPostalCode, savePostalCode } from "@/lib/storage";
import { MEAL_LIBRARY } from "@/lib/meals-data";

const FoodMap = dynamic(() => import("@/components/FoodMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-medium border-2 border-emerald-200">
      Loading map…
    </div>
  ),
});

interface MapPlace {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

interface AutocompleteResult {
  place_id: number;
  lat: number;
  lon: number;
  label: string;
  full: string;
}

const DEAL_CATEGORIES: { value: DealCategory | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "All Deals", emoji: "🛍️" },
  { value: "meat", label: "Meat & Fish", emoji: "🍗" },
  { value: "produce", label: "Produce", emoji: "🥦" },
  { value: "dairy", label: "Dairy & Eggs", emoji: "🥚" },
  { value: "grains", label: "Grains", emoji: "🌾" },
];

const FLYER_STORES = [
  { name: "No Frills", emoji: "🟡", url: "https://www.nofrills.ca/flyer" },
  { name: "Food Basics", emoji: "🔵", url: "https://www.foodbasics.ca/flyer" },
  { name: "Metro", emoji: "🔴", url: "https://www.metro.ca/en/flyer" },
  { name: "Sobeys", emoji: "🟠", url: "https://www.sobeys.com/en/flyer/" },
  { name: "Walmart", emoji: "🔵", url: "https://www.walmart.ca/en/flyer" },
  { name: "Costco", emoji: "🟥", url: "https://www.costco.ca/warehouse-savings.html" },
  { name: "Loblaws", emoji: "🟢", url: "https://www.loblaws.ca/flyer" },
  { name: "Save-On", emoji: "🟠", url: "https://www.saveonfoods.com/flyer/" },
];

export default function DealsPage() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [acLoading, setAcLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const acTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [mapData, setMapData] = useState<{ lat: number; lon: number; places: MapPlace[] } | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState("");

  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [dealCategory, setDealCategory] = useState<DealCategory | "all">("all");

  const [matchedMealId, setMatchedMealId] = useState("");
  const [matchedDeals, setMatchedDeals] = useState<Deal[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);

  const loadDeals = useCallback(async (cat: DealCategory | "all") => {
    setDealsLoading(true);
    const res = await fetch(`/api/deals?category=${cat}`);
    const data = await res.json();
    setDeals(data.deals || []);
    setDealsLoading(false);
  }, []);

  useEffect(() => {
    loadDeals("all");
    setQuery(getLastPostalCode());
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [loadDeals]);

  // Debounced autocomplete
  const handleQueryChange = (val: string) => {
    setQuery(val);
    setMapError("");
    if (acTimer.current) clearTimeout(acTimer.current);
    if (val.length < 3) { setSuggestions([]); setShowDropdown(false); return; }
    acTimer.current = setTimeout(async () => {
      setAcLoading(true);
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSuggestions(data.results || []);
        setShowDropdown(true);
      } finally {
        setAcLoading(false);
      }
    }, 400);
  };

  const selectSuggestion = async (s: AutocompleteResult) => {
    setQuery(s.label);
    setSuggestions([]);
    setShowDropdown(false);
    await loadMap(s.lat, s.lon);
  };

  const loadMap = async (lat: number, lon: number) => {
    setMapLoading(true);
    setMapError("");
    try {
      const places = await fetch(`/api/overpass?lat=${lat}&lon=${lon}`);
      const placesData = await places.json();
      setMapData({
        lat, lon,
        places: (placesData.elements || []).filter((e: MapPlace) => e.lat && e.lon).slice(0, 60),
      });
    } catch {
      setMapError("Could not load map data.");
    } finally {
      setMapLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setMapLoading(true);
    setMapError("");
    setShowDropdown(false);
    savePostalCode(query.trim());
    try {
      const geo = await fetch(`/api/geocode?postal=${encodeURIComponent(query.trim())}`);
      const geoData = await geo.json();
      if (!geo.ok) throw new Error(geoData.error);
      await loadMap(geoData.lat, geoData.lon);
    } catch (e: unknown) {
      setMapError(e instanceof Error ? e.message : "Location not found. Try typing your city name.");
      setMapLoading(false);
    }
  };

  const matchMealDeals = async (mealId: string) => {
    setMatchedMealId(mealId);
    if (!mealId) { setMatchedDeals([]); return; }
    setMatchLoading(true);
    const meal = MEAL_LIBRARY.find(m => m.id === mealId);
    if (!meal) { setMatchLoading(false); return; }
    const ingredients = meal.ingredients.map(i => i.replace(/^\d+[\w.]*\s+/, "").toLowerCase());
    const res = await fetch(`/api/deals?ingredients=${encodeURIComponent(ingredients.join(","))}`);
    const data = await res.json();
    setMatchedDeals(data.deals || []);
    setMatchLoading(false);
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2.5 rounded-xl">
          <Tag size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals & Food Map</h1>
          <p className="text-sm text-gray-500">Find cheap groceries and food near you</p>
        </div>
      </div>

      {/* Map search with autocomplete */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-lg">
            <MapPin size={18} className="text-blue-600" />
          </div>
          <h2 className="font-bold text-gray-800 text-lg">Find Food Near You</h2>
        </div>

        <div ref={wrapperRef} className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Postal code or city (e.g. M5V 3L9 or Toronto)"
                className="w-full px-4 py-3 pr-8 text-sm rounded-xl"
                autoComplete="off"
              />
              {query && (
                <button onClick={() => { setQuery(""); setSuggestions([]); setShowDropdown(false); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <button onClick={handleSearch} disabled={mapLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2 flex-shrink-0">
              {mapLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Search
            </button>
          </div>

          {/* Autocomplete dropdown */}
          {showDropdown && (suggestions.length > 0 || acLoading) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {acLoading && (
                <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Searching…
                </div>
              )}
              {suggestions.map(s => (
                <button key={s.place_id} onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0 flex items-center gap-2 text-gray-800">
                  <MapPin size={13} className="text-blue-400 flex-shrink-0" />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {mapError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
            ⚠️ {mapError}
          </div>
        )}

        {mapData && (
          <>
            {/* isolation:isolate + z-index:0 traps all Leaflet z-indices so they
                never bleed above the sticky header */}
            <div style={{ position: "relative", zIndex: 0, isolation: "isolate" }}>
              <FoodMap lat={mapData.lat} lon={mapData.lon} places={mapData.places} />
            </div>
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              🟢 Your area &nbsp;·&nbsp; 🛒 Grocery store &nbsp;·&nbsp; 🍽 Restaurant &nbsp;·&nbsp; Data: OpenStreetMap
            </p>
          </>
        )}

        {!mapData && !mapLoading && (
          <div className="bg-blue-50 border-2 border-blue-100 rounded-xl px-4 py-6 text-center text-blue-600">
            <MapPin size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Enter your postal code or city name above to see nearby grocery stores and restaurants on the map.</p>
          </div>
        )}
      </div>

      {/* Store flyers */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <ShoppingCart size={18} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Weekly Flyers</h2>
            <p className="text-xs text-gray-500">Click any store to view their live weekly deals</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FLYER_STORES.map(store => (
            <a key={store.name} href={store.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between bg-gray-50 hover:bg-emerald-50 border-2 border-gray-200 hover:border-emerald-400 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors group">
              <span>{store.emoji} {store.name}</span>
              <ExternalLink size={12} className="text-gray-400 group-hover:text-emerald-500" />
            </a>
          ))}
        </div>
      </div>

      {/* Meal deal matcher */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-amber-100 p-2 rounded-lg">
            <Tag size={18} className="text-amber-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Meal Deal Matcher</h2>
            <p className="text-xs text-gray-500">Pick a meal to find which ingredients are on sale this week</p>
          </div>
        </div>
        <select value={matchedMealId} onChange={e => matchMealDeals(e.target.value)}
          className="w-full px-4 py-3 text-sm rounded-xl font-medium">
          <option value="">Choose a meal…</option>
          {MEAL_LIBRARY.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        {matchLoading && (
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Finding deals…
          </div>
        )}

        {!matchLoading && matchedMealId && matchedDeals.length === 0 && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-500">No deals found for this meal this week.</div>
        )}

        {matchedDeals.length > 0 && (
          <div className="space-y-2">
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl px-4 py-2 text-sm font-bold text-emerald-700">
              🎉 {matchedDeals.length} ingredient deal{matchedDeals.length > 1 ? "s" : ""} found!
            </div>
            {matchedDeals.map(deal => <DealCard key={deal.id} deal={deal} />)}
          </div>
        )}
      </div>

      {/* Deal browser */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Tag size={18} className="text-purple-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-lg">This Week&apos;s Deals</h2>
            <p className="text-xs text-gray-500">Sample deals from major Canadian grocery chains</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {DEAL_CATEGORIES.map(cat => (
            <button key={cat.value} onClick={() => { setDealCategory(cat.value); loadDeals(cat.value); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border-2 transition-colors flex items-center gap-1.5 ${
                dealCategory === cat.value
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-gray-50 border-gray-200 text-gray-700 hover:border-purple-300"
              }`}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {dealsLoading ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  const categoryColors: Record<string, { bg: string; border: string }> = {
    meat:    { bg: "#fef2f2", border: "#fecaca" },
    produce: { bg: "#f0fdf4", border: "#bbf7d0" },
    dairy:   { bg: "#eff6ff", border: "#bfdbfe" },
    grains:  { bg: "#fffbeb", border: "#fde68a" },
    other:   { bg: "#f9fafb", border: "#e5e7eb" },
  };
  const colors = categoryColors[deal.category] ?? categoryColors.other;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderRadius: "12px", padding: "12px 16px",
      border: `2px solid ${colors.border}`,
      background: colors.bg,
    }}>
      <div>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827", margin: 0 }}>{deal.item}</p>
        <p style={{ fontSize: "12px", color: "#4b5563", marginTop: "2px", margin: 0 }}>
          🏪 {deal.store}
          {deal.unit ? ` · ${deal.unit}` : ""}
          {deal.validUntil ? ` · Until ${deal.validUntil}` : ""}
        </p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "16px" }}>
        <p style={{ fontSize: "15px", fontWeight: 800, color: "#059669", margin: 0 }}>{deal.price}</p>
        {deal.originalPrice && (
          <p style={{ fontSize: "12px", color: "#9ca3af", textDecoration: "line-through", margin: 0 }}>{deal.originalPrice}</p>
        )}
      </div>
    </div>
  );
}
