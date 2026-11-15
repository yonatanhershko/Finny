import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/Icon";
import {
  TAB_BAR_CONTENT_HEIGHT,
  TabBarHeightContext,
} from "@/components/ui/TabBarHeight";
import { useTheme } from "@/theme/ThemeProvider";

const tabs = [
  { name: "today", label: "tabs.today", icon: "home-variant" },
  { name: "stats", label: "tabs.stats", icon: "chart-donut" },
  { name: "goals", label: "tabs.goals", icon: "bullseye-arrow" },
  { name: "more", label: "tabs.more", icon: "dots-horizontal" },
] as const;

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const barHeight = TAB_BAR_CONTENT_HEIGHT + useSafeAreaInsets().bottom;
  return (
    <TabBarHeightContext value={barHeight}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          // Absolute: screens (and their leaves) run under the bar.
          tabBarStyle: {
            position: "absolute",
            height: barHeight,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarLabelStyle: { fontFamily: "Rubik_500Medium", fontSize: 12 },
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: t(tab.label),
              tabBarIcon: ({ color, size }) => (
                <Icon name={tab.icon} size={size} color={String(color)} />
              ),
            }}
          />
        ))}
      </Tabs>
    </TabBarHeightContext>
  );
}
