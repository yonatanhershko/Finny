import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';

const tabs = [
  { name: 'today', label: 'tabs.today', icon: 'home-variant' },
  { name: 'stats', label: 'tabs.stats', icon: 'chart-donut' },
  { name: 'goals', label: 'tabs.goals', icon: 'bullseye-arrow' },
  { name: 'more', label: 'tabs.more', icon: 'dots-horizontal' },
] as const;

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: 'Rubik_500Medium', fontSize: 12 },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.label),
            tabBarIcon: ({ color, size }) => <Icon name={tab.icon} size={size} color={String(color)} />,
          }}
        />
      ))}
    </Tabs>
  );
}
