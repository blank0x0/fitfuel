import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../lib/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index:   { active: "home",         inactive: "home-outline"         },
  tracker: { active: "clipboard",    inactive: "clipboard-outline"    },
  meals:   { active: "restaurant",   inactive: "restaurant-outline"   },
  "ai-chef": { active: "sparkles",   inactive: "sparkles-outline"     },
  deals:   { active: "pricetag",     inactive: "pricetag-outline"     },
  budget:  { active: "cart",         inactive: "cart-outline"         },
};

const TAB_LABELS: Record<string, string> = {
  index:     "Dashboard",
  tracker:   "Tracker",
  meals:     "Meals",
  "ai-chef": "AI Chef",
  deals:     "Deals",
  budget:    "Budget",
};

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: Colors.tabActive,
          tabBarInactiveTintColor: Colors.tabInactive,
          tabBarStyle: {
            backgroundColor: Colors.tabBar,
            borderTopColor: Colors.tabBarBorder,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
          },
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name];
            const name = focused ? icons?.active : icons?.inactive;
            return <Ionicons name={name ?? "help-outline"} size={size - 2} color={color} />;
          },
          tabBarLabel: TAB_LABELS[route.name] ?? route.name,
        })}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="tracker" />
        <Tabs.Screen name="meals" />
        <Tabs.Screen name="ai-chef" />
        <Tabs.Screen name="deals" />
        <Tabs.Screen name="budget" />
      </Tabs>
    </>
  );
}
