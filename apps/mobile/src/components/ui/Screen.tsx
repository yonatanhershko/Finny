import { type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LeafBackground, type LeafDensity } from '@/components/nature/LeafBackground';

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
  return (
    <View className="flex-1 bg-background">
      {leaves !== 'none' && <LeafBackground density={leaves} />}
      <SafeAreaView style={{ flex: 1 }}>
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
