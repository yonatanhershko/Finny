import { type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Backdrop } from '@/components/nature/Backdrop';
import { LeafBackground, type LeafDensity } from '@/components/nature/LeafBackground';
import { useTabBarHeight } from '@/components/ui/TabBarHeight';
import { useTheme } from '@/theme/ThemeProvider';

/** Page shell: themed background, leaves behind, safe areas, optional scroll. */
export function Screen({
  children,
  leaves = 'medium',
  scroll = false,
  className = '',
}: {
  children: ReactNode;
  leaves?: LeafDensity | 'none';
  scroll?: boolean;
  className?: string;
}) {
  const { theme } = useTheme();
  // Inside the tab bar the bar floats over the screen, so reserve its height here.
  const tabBarHeight = useTabBarHeight();
  return (
    <View className="flex-1 bg-background">
      <Backdrop theme={theme} />
      {leaves !== 'none' && <LeafBackground density={leaves} />}
      <SafeAreaView
        style={{ flex: 1, paddingBottom: tabBarHeight }}
        edges={tabBarHeight ? ['top', 'left', 'right'] : undefined}>
        {scroll ? (
          <ScrollView
            contentContainerClassName={`grow ${className}`}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View className={`flex-1 ${className}`}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}
