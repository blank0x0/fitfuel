# FitFuel Web 🥗

A full-stack nutrition and fitness web app built with Next.js 14, TypeScript, and Tailwind CSS.

---

## Features

- **Dashboard** — Daily calorie ring, macro bars, step counter, and workout streak
- **Meal Tracker** — Log meals and workouts with full macro breakdown
- **Meal Library** — Browse curated meals with photos, recipes, and macros (TheMealDB)
- **AI Chef** — Enter your ingredients, get full meal plans from Llama 3 (Groq)
- **Grocery Deals** — Find nearby grocery stores on an interactive Leaflet map + weekly flyer deals
- **Budget Tracker** — Compare ingredient prices across 8 Canadian supermarkets
- **Dark Mode** — Full dark/light theme toggle with localStorage persistence

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the root:

```
GROQ_API_KEY=your_groq_api_key
```

Get a free API key at [console.groq.com](https://console.groq.com).

---

## Tech Stack

- [Next.js 14](https://nextjs.org/) — App Router, TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) — utility-first styling
- [Framer Motion](https://www.framer.com/motion/) — animations
- [Groq SDK](https://groq.com/) / Llama 3 — AI meal generation
- [Leaflet](https://leafletjs.com/) / OpenStreetMap — interactive maps
- [TheMealDB](https://themealdb.com/) — meal data
- Nominatim + Overpass API — store search

---

## Mobile App

Looking for FitFuel on your phone?

📱 **[FitFuel Mobile →](https://github.com/Blank0x0/fitfuel/tree/master/mobile)**

Available for iOS and Android via [Expo Go](https://expo.dev/go). Built with Expo SDK 54 and React Native.

---

## Author

Built by [Blank0x0](https://github.com/Blank0x0)
