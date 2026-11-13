import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { WalletHero } from '@/components/nature/WalletHero';
import { WalletLogo } from '@/components/nature/WalletLogo';
import { AppText } from '@/components/ui/AppText';
import { BudgetBar } from '@/components/ui/BudgetBar';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { changeLanguage, useLanguage } from '@/i18n';
import type { ThemePreference } from '@/lib/preferences';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Phase 5 style preview: tokens, both themes, both languages, leaves, wallet.
 * Becomes the login screen in Phase 2. Sample numbers below are display-only.
 */
export default function StylePreviewScreen() {
  const { t } = useTranslation();
  const { preference, setPreference } = useTheme();
  const language = useLanguage();

  const themes: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];

  return (
    <Screen leaves="high" scroll className="items-center px-6 pb-10 pt-4">
      <View className="w-full flex-row items-center justify-between">
        <WalletLogo />
        <AppText tone="muted" className="text-[12px]">{t('preview.title')}</AppText>
      </View>

      <WalletHero size={270} />

      <AppText weight="bold" tone="primary" className="text-[40px]">
        {t('app.name')}
      </AppText>
      <AppText className="mb-5 text-[16px]">{t('app.tagline')}</AppText>

      <View className="w-full gap-3">
        <Button label={t('auth.signIn')} />
        <Button label={t('auth.signUp')} variant="outline" />
      </View>

      <View className="mt-6 w-full gap-3">
        <View className="rounded-lg border border-border bg-surface p-3">
          <View className="mb-2 flex-row items-end justify-between">
            <AppText weight="medium" className="text-[15px]">
              ₪ 600
            </AppText>
            <AppText tone="muted" className="text-[12px]">
              {t('preview.leftOfBudget', { left: '₪ 900', total: '₪ 1,500' })}
            </AppText>
          </View>
          <BudgetBar spent={60000} budget={150000} />
        </View>
        <View className="rounded-lg border border-danger bg-danger-surface p-3">
          <View className="mb-2 flex-row items-end justify-between">
            <AppText weight="bold" tone="danger" className="text-[15px]">
              ₪ 350
            </AppText>
            <AppText weight="bold" tone="danger" className="text-[12px]">
              {t('preview.overBudget', { amount: '₪ 50' })}
            </AppText>
          </View>
          <BudgetBar spent={35000} budget={30000} />
        </View>
      </View>

      <View className="mt-6 w-full gap-2">
        <AppText tone="muted" className="text-[12px]">{t('settings.theme')}</AppText>
        <View className="flex-row gap-2">
          {themes.map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              selected={preference === item.value}
              onPress={() => setPreference(item.value)}
            />
          ))}
        </View>
        <AppText tone="muted" className="mt-2 text-[12px]">{t('settings.language')}</AppText>
        <View className="flex-row gap-2">
          <Chip
            label={t('settings.languageHe')}
            selected={language === 'he'}
            onPress={() => void changeLanguage('he')}
          />
          <Chip
            label={t('settings.languageEn')}
            selected={language === 'en'}
            onPress={() => void changeLanguage('en')}
          />
        </View>
      </View>
    </Screen>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`min-h-[44px] flex-1 items-center justify-center rounded-md border px-3 ${
        selected ? 'border-primary bg-primary' : 'border-border bg-surface'
      }`}>
      <AppText weight="medium" tone={selected ? 'onPrimary' : 'text'} className="text-[14px]">
        {label}
      </AppText>
    </Pressable>
  );
}
