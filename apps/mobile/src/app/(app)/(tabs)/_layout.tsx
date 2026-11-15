import { router, Tabs, usePathname } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PanResponder, View } from "react-native";

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

/** Swipe distance (px) or speed that counts as a deliberate swipe between tabs. */
const SWIPE_DISTANCE = 60;
const SWIPE_SPEED = 0.5;

/**
 * Swipe sideways to switch tabs: swipe left goes to the tab on your left, swipe
 * right to the tab on your right (owner request). Vertical scrolling and taps are
 * untouched: the gesture only starts once the finger has moved clearly sideways.
 */
function useTabSwipe() {
  const pathname = usePathname();
  const index = tabs.findIndex((tab) => pathname === `/${tab.name}`);

  // Rebuilt when the tab changes, so the handler always knows where the user is.
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, g) =>
          Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, g) => {
          if (index < 0) return;
          if (Math.abs(g.dx) < SWIPE_DISTANCE && Math.abs(g.vx) < SWIPE_SPEED)
            return;
          const target = tabs[index + (g.dx < 0 ? -1 : 1)];
          if (target) router.navigate(`/${target.name}`);
        },
      }),
    [index],
  );
  return responder.panHandlers;
}

export default function TabsLayout() {
  const swipe = useTabSwipe();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const barHeight = TAB_BAR_CONTENT_HEIGHT + useSafeAreaInsets().bottom;
  return (
    <TabBarHeightContext value={barHeight}>
      <View style={{ flex: 1 }} {...swipe}>
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
      </View>
    </TabBarHeightContext>
  );
}
