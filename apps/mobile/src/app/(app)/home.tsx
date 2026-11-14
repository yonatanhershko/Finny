import { daysUntilExpiry } from '@finny/shared';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { WalletLogo } from '@/components/nature/WalletLogo';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';

/** Placeholder for the unlocked app. Phase 3 replaces it with the real home and tabs. */
export default function HomePlaceholderScreen() {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const days = profile ? daysUntilExpiry(profile) : null;

  return (
    <Screen leaves="medium" className="px-6 pt-4">
      <WalletLogo />
      <View className="flex-1 items-center justify-center gap-2">
        <AppText weight="bold" className="text-center text-[26px]">
          {t('home.hello', { name: profile?.full_name || '' })}
        </AppText>
        <AppText tone="success" weight="medium" className="text-[16px]">
          {t('home.unlocked')}
        </AppText>
        {days !== null && (
          <AppText tone="muted" className="text-[14px]">
            {t('home.daysLeft', { count: days })}
          </AppText>
        )}
      </View>
      <Button label={t('auth.signOut')} variant="outline" onPress={() => void signOut()} className="mb-6" />
    </Screen>
  );
}
