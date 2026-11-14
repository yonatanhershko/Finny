import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { markTermsRead } from '@/auth/terms';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';

type Section = { title: string; body: string };

/** The terms of use, opened from the last sign-up step. */
export default function TermsScreen() {
  const { t } = useTranslation();
  const sections = t('terms.sections', { returnObjects: true }) as Section[];

  const confirm = () => {
    markTermsRead();
    router.back();
  };

  return (
    <Screen leaves="low" scroll className="px-6 pb-8 pt-2">
      <ScreenHeader title={t('terms.title')} />
      <AppText tone="muted" className="mb-4 text-[14px]">
        {t('terms.draftNote')}
      </AppText>
      <View className="gap-5">
        {sections.map((section) => (
          <View key={section.title} className="gap-1">
            <AppText weight="bold" className="text-[17px]" accessibilityRole="header">
              {section.title}
            </AppText>
            <AppText className="text-[15px] leading-6">{section.body}</AppText>
          </View>
        ))}
      </View>
      <View className="mt-8">
        <Button label={t('terms.iRead')} onPress={confirm} />
      </View>
    </Screen>
  );
}
