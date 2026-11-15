import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { AppText } from './ui/AppText';
import { Icon } from './ui/Icon';

/** Title bar with a back button for screens pushed on top of the tabs. */
export function ScreenHeader({ title, end }: { title: string; end?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <View className="mb-2 min-h-[44px] flex-row items-center justify-between">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        className="h-11 w-11 items-center justify-center"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/today'))}>
        <Icon name="chevron-left" size={28} />
      </Pressable>
      <AppText weight="bold" className="flex-1 text-center text-[19px]" numberOfLines={1} accessibilityRole="header">
        {title}
      </AppText>
      <View className="min-w-[44px] items-end">{end}</View>
    </View>
  );
}
