import { useState, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Linking, ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, Radius, Shadow, Font } from "../lib/theme";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

interface Suggestion { place_id: string; lat: string; lon: string; label: string; }
interface Store {
  id: string; name: string; lat: number; lon: number;
  type: string; address: string; distance?: number;
}

const FLYER_LINKS = [
  { store: "No Frills",   url: "https://www.nofrills.ca/flyer",      emoji: "🟡" },
  { store: "Food Basics", url: "https://www.foodbasics.ca/en/flyer", emoji: "🔵" },
  { store: "Metro",       url: "https://www.metro.ca/en/flyer",      emoji: "🔴" },
  { store: "Walmart",     url: "https://www.walmart.ca/weekly-flyer", emoji: "☀️" },
  { store: "Sobeys",      url: "https://www.sobeys.com/en/flyer/",   emoji: "🟠" },
  { store: "Loblaws",     url: "https://www.loblaws.ca/flyer",       emoji: "🟢" },
];

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function openInMaps(lat: number, lon: number, label?: string) {
  const query = label ? encodeURIComponent(label) : `${lat},${lon}`;
  // Try Apple Maps on iOS, Google Maps as fallback
  const appleUrl = `maps://?q=${query}&ll=${lat},${lon}`;
  const googleUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  Linking.canOpenURL(appleUrl).then((supported) => {
    Linking.openURL(supported ? appleUrl : googleUrl);
  });
}

export default function DealsScreen() {
  const [query, setQuery]             = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stores, setStores]           = useState<Store[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [searching, setSearching]     = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onQueryChange = (text: string) => {
    setQuery(text);
    if (debounce.current) clearTimeout(debounce.current);
    if (text.length < 3) { setSuggestions([]); return; }
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/autocomplete?q=${encodeURIComponent(text)}`);
        const data = await res.json();
        setSuggestions((data.results ?? data).slice(0, 5));
      } catch { setSuggestions([]); }
    }, 400);
  };

  const selectSuggestion = async (s: Suggestion) => {
    setSuggestions([]);
    setQuery(s.label);
    await findNearbyStores(parseFloat(s.lat), parseFloat(s.lon));
  };

  const useMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    setSearching(true);
    const loc = await Location.getCurrentPositionAsync({});
    setQuery("Current location");
    await findNearbyStores(loc.coords.latitude, loc.coords.longitude);
    setSearching(false);
  };

  const findNearbyStores = async (lat: number, lon: number) => {
    setLoadingStores(true);
    setUserLocation({ lat, lon });
    try {
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["shop"="supermarket"](around:3000,${lat},${lon});
          node["shop"="grocery"](around:3000,${lat},${lon});
          node["amenity"="fast_food"](around:2000,${lat},${lon});
        );
        out body 30;
      `;
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: overpassQuery,
        headers: { "Content-Type": "text/plain" },
      });
      const data = await res.json();
      const list: Store[] = ((data.elements ?? []) as any[])
        .map((el: any) => ({
          id: String(el.id),
          name: el.tags?.name ?? "Unnamed store",
          lat: el.lat,
          lon: el.lon,
          type: el.tags?.shop ?? el.tags?.amenity ?? "store",
          address:
            [el.tags?.["addr:housenumber"], el.tags?.["addr:street"]]
              .filter(Boolean)
              .join(" ") || "Address unknown",
          distance: haversine(lat, lon, el.lat, el.lon),
        }))
        .sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));
      setStores(list);
    } catch {
      setStores([]);
    } finally {
      setLoadingStores(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Deals & Map</Text>
        <Text style={styles.subtitle}>Find cheap groceries near you</Text>
      </View>

      {/* Search */}
      <View style={[styles.card, Shadow.sm]}>
        <Text style={styles.sectionTitle}>Find Stores Near You</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={query}
            onChangeText={onQueryChange}
            placeholder="Enter postal code or city…"
            placeholderTextColor={Colors.textPlaceholder}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.locBtn} onPress={useMyLocation} disabled={searching}>
            {searching
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="locate" size={18} color="#fff" />
            }
          </TouchableOpacity>
        </View>

        {/* Autocomplete */}
        {suggestions.length > 0 && (
          <View style={styles.autocomplete}>
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s.place_id}
                style={styles.suggestion}
                onPress={() => selectSuggestion(s)}
              >
                <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.suggestionText} numberOfLines={1}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Open in Maps button */}
      {userLocation && (
        <TouchableOpacity
          style={[styles.openMapsBtn, Shadow.sm]}
          onPress={() => openInMaps(userLocation.lat, userLocation.lon, query)}
        >
          <Ionicons name="map" size={20} color="#fff" />
          <View>
            <Text style={styles.openMapsBtnTitle}>View on Map</Text>
            <Text style={styles.openMapsBtnSub}>Opens Apple Maps / Google Maps</Text>
          </View>
          <Ionicons name="open-outline" size={16} color="rgba(255,255,255,0.7)" style={{ marginLeft: "auto" }} />
        </TouchableOpacity>
      )}

      {/* Nearby stores list */}
      {loadingStores && (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Finding nearby stores…</Text>
        </View>
      )}

      {!loadingStores && stores.length > 0 && (
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.sectionTitle}>
            Nearby Stores ({stores.length})
          </Text>
          {stores.slice(0, 12).map((st) => (
            <TouchableOpacity
              key={st.id}
              style={styles.storeItem}
              onPress={() => openInMaps(st.lat, st.lon, st.name)}
            >
              <View style={styles.storeIconWrap}>
                <Ionicons name="storefront-outline" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.storeName}>{st.name}</Text>
                <Text style={styles.storeAddr}>{st.address}</Text>
              </View>
              <View style={styles.storeRight}>
                {st.distance != null && (
                  <Text style={styles.storeDist}>{st.distance.toFixed(1)} km</Text>
                )}
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!loadingStores && !userLocation && (
        <View style={[styles.card, Shadow.sm, styles.emptyMapCard]}>
          <Ionicons name="map-outline" size={40} color={Colors.textMuted} />
          <Text style={styles.emptyMapTitle}>Find stores near you</Text>
          <Text style={styles.emptyMapSub}>
            Enter your postal code or tap the locate button to find nearby grocery stores.
          </Text>
        </View>
      )}

      {/* Weekly Flyers */}
      <View style={[styles.card, Shadow.sm]}>
        <Text style={styles.sectionTitle}>Weekly Flyers</Text>
        <Text style={styles.flyerNote}>Tap any store to browse their current deals:</Text>
        <View style={styles.flyerGrid}>
          {FLYER_LINKS.map((f) => (
            <TouchableOpacity
              key={f.store}
              style={styles.flyerBtn}
              onPress={() => Linking.openURL(f.url)}
            >
              <Text style={styles.flyerEmoji}>{f.emoji}</Text>
              <Text style={styles.flyerName}>{f.store}</Text>
              <Ionicons name="open-outline" size={11} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 32, gap: 12 },

  header: {
    paddingTop: 60, paddingBottom: 20, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title:    { fontSize: 24, fontWeight: Font.extrabold, color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  card: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  sectionTitle: { fontSize: 15, fontWeight: Font.bold, color: Colors.text, marginBottom: 10 },

  searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: Colors.text, backgroundColor: Colors.bg,
  },
  locBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    width: 42, height: 42, alignItems: "center", justifyContent: "center",
  },

  autocomplete: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    marginTop: 4, overflow: "hidden",
  },
  suggestion: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  suggestionText: { flex: 1, fontSize: 13, color: Colors.text },

  openMapsBtn: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: Spacing.md,
  },
  openMapsBtnTitle: { fontSize: 14, fontWeight: Font.bold, color: "#fff" },
  openMapsBtnSub:   { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 1 },

  centered: { alignItems: "center", paddingVertical: 20, gap: 8 },
  loadingText: { fontSize: 13, color: Colors.textMuted },

  storeItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  storeIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  storeName:  { fontSize: 14, fontWeight: Font.semibold, color: Colors.text },
  storeAddr:  { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  storeRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  storeDist:  { fontSize: 12, fontWeight: Font.bold, color: Colors.primary },

  emptyMapCard: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyMapTitle: { fontSize: 15, fontWeight: Font.bold, color: Colors.text },
  emptyMapSub:   { fontSize: 13, color: Colors.textMuted, textAlign: "center", lineHeight: 20 },

  flyerNote: { fontSize: 13, color: Colors.textMuted, marginBottom: 12 },
  flyerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  flyerBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  flyerEmoji: { fontSize: 14 },
  flyerName:  { fontSize: 12, fontWeight: Font.semibold, color: Colors.textSecondary },
});
