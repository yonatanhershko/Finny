import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { checkEmail } from '@/auth/validation';
import { WalletHero } from '@/components/nature/WalletHero';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';

export default function SignInScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const emailProblem = checkEmail(email);
    setEmailError(emailProblem ? t(emailProblem) : null);
    if (emailProblem || password.length === 0) {
      if (password.length === 0) setFormError(t('auth.errors.passwordRequired'));
      return;
    }
    setFormError(null);
    setBusy(true);
    const error = await signIn(email, password);
    setBusy(false);
    // On success the guard in the root layout moves to the right area.
    if (error) setFormError(t(`auth.errors.${error}`));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen leaves="high" scroll className="items-center px-6 pb-8 pt-2">
        <WalletHero size={210} />
        <AppText weight="bold" className="mb-5 text-[26px]">
          {t('auth.signInTitle')}
        </AppText>
        <View className="w-full gap-4">
          <TextField
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            textContentType="emailAddress"
            returnKeyType="next"
          />
          <TextField
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
          />
          {formError ? (
            <AppText tone="danger" className="text-[14px]" accessibilityLiveRegion="polite">
              {formError}
            </AppText>
          ) : null}
          <Button label={t('auth.signIn')} onPress={submit} loading={busy} />
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/forgot')}
            className="min-h-[44px] items-center justify-center">
            <AppText tone="primary" weight="medium" className="text-[15px]">
              {t('auth.forgot.link')}
            </AppText>
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.replace('/sign-up')}
          className="mt-5 min-h-[44px] justify-center">
          <AppText tone="primary" weight="medium" className="text-[15px]">
            {t('auth.noAccount')}
          </AppText>
        </Pressable>
      </Screen>
    </KeyboardAvoidingView>
  );
}
