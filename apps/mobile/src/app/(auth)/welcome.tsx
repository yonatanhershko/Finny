import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { WalletHero } from '@/components/nature/WalletHero';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  return (
    <Screen leaves="high" scroll className="items-center justify-center px-6 py-8">
      <WalletHero size={290} />
      <AppText weight="bold" tone="primary" className="mt-2 text-[44px]">
        {t('app.name')}
      </AppText>
      <AppText className="mb-8 text-center text-[17px]">{t('app.tagline')}</AppText>
      <View className="w-full gap-3">
        <Button label={t('auth.signIn')} onPress={() => router.push('/sign-in')} />
        <Button label={t('auth.signUp')} variant="outline" onPress={() => router.push('/sign-up')} />
      </View>
    </Screen>
  );
}
