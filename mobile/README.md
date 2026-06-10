# FitFuel Mobile 📱

A React Native mobile app for tracking food, workouts, and finding grocery deals near you.

Built with **Expo SDK 54** · **TypeScript** · **Expo Router**

---

## Features

| Tab | Description |
|---|---|
| 🏠 Dashboard | Daily stats — steps, calories, protein, weekly workout streak |
| 📋 Tracker | Log steps, meals with macros, and workout type |
| 🍽 Meals | Browse 13 curated meals with food photos, recipes, and macros |
| 🤖 AI Chef | Enter your ingredients → AI generates full meal ideas with recipes |
| 🏷 Deals | Find nearby grocery stores + weekly flyers from major Canadian chains |
| 🛒 Budget | Compare ingredient prices across 8 Canadian grocery stores in CAD |

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [Expo Go](https://expo.dev/go) app on your iPhone or Android phone
- The [FitFuel web app](https://github.com/Blank0x0/fitfuel) running locally (for AI Chef, Budget, and Deals APIs)

### Installation

```bash
git clone https://github.com/Blank0x0/fitfuel-mobile.git
cd fitfuel-mobile
npm install
```

### Configuration

Create a `.env.local` file in the root:

```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000
```

Replace `YOUR_LOCAL_IP` with your PC's local network IP (run `ipconfig` on Windows to find it). Your phone and PC must be on the same Wi-Fi network.

### Run

```bash
# Start the FitFuel web server first (in the fitfuel repo)
npm run dev

# Then start the mobile app
npx expo start
```

Scan the QR code with Expo Go on your phone.

---

## Tech Stack

- [Expo SDK 54](https://expo.dev/)
- [React Native 0.81](https://reactnative.dev/)
- [Expo Router](https://expo.github.io/router/) — file-based navigation
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) — local data persistence
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/) — GPS for nearby stores
- [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) — tactile feedback
- [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) — hero gradients

---

## Related

- 🌐 **Web App:** [github.com/Blank0x0/fitfuel](https://github.com/Blank0x0/fitfuel)
