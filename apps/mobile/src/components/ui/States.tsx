import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';
import { Button } from './Button';

export function Loading() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View className="items-center py-10" accessibilityLabel={t('common.loading')}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="items-center gap-3 py-8" accessibilityRole="alert">
      <AppText tone="danger" className="text-center text-[15px]">
        {t('common.loadFailed')}
      </AppText>
      <Button label={t('common.retry')} variant="outline" onPress={onRetry} />
    </View>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <View className="items-center py-10">
      <AppText tone="muted" className="text-center text-[15px]">
        {text}
      </AppText>
    </View>
  );
}
