import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from './AppText';
import { Button } from './Button';
import { SkeletonList } from './Skeleton';

export function Loading() {
  const { t } = useTranslation();
  return (
    <View accessibilityLabel={t('common.loading')} accessibilityRole="progressbar">
      <SkeletonList />
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
