import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { checkEmail, checkName, checkPassword, MIN_PASSWORD_LENGTH } from '@/auth/validation';
import { WalletHero } from '@/components/nature/WalletHero';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';

const STEPS = ['name', 'email', 'password'] as const;

/**
 * Register in three short steps. The wallet and its leaves stay on screen
 * the whole way; only the field under them changes.
 */
export default function SignUpScreen() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const step = STEPS[stepIndex];

  const next = async () => {
    const problem =
      step === 'name' ? checkName(name) : step === 'email' ? checkEmail(email) : checkPassword(password);
    if (problem) {
      setError(t(problem, { min: MIN_PASSWORD_LENGTH }));
      return;
    }
    setError(null);
    if (step !== 'password') {
      setStepIndex(stepIndex + 1);
      return;
    }
    setBusy(true);
    const failure = await signUp(name, email, password);
    setBusy(false);
    // On success the guard moves the new user to the locked (pending) screen.
    if (failure) {
      setError(t(`auth.errors.${failure}`));
      if (failure === 'emailTaken') setStepIndex(1);
    }
  };

  const back = () => {
    setError(null);
    if (stepIndex === 0) router.back();
    else setStepIndex(stepIndex - 1);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen leaves="high" scroll className="items-center px-6 pb-8 pt-2">
        <WalletHero size={210} />
        <AppText weight="bold" className="text-[26px]">
          {t('auth.signUpTitle')}
        </AppText>

        <View
          className="my-4 flex-row gap-2"
          accessibilityRole="progressbar"
          accessibilityLabel={t('auth.stepOf', { step: stepIndex + 1, total: STEPS.length })}
          accessibilityValue={{ min: 1, max: STEPS.length, now: stepIndex + 1 }}>
          {STEPS.map((s, i) => (
            <View
              key={s}
              className={`h-[6px] w-10 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </View>

        <View className="w-full gap-4">
          {step === 'name' && (
            <TextField
              key="name"
              label={t('auth.fullName')}
              value={name}
              onChangeText={setName}
              error={error}
              autoFocus
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={next}
            />
          )}
          {step === 'email' && (
            <TextField
              key="email"
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              error={error}
              autoFocus
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={next}
            />
          )}
          {step === 'password' && (
            <TextField
              key="password"
              label={t('auth.choosePassword', { min: MIN_PASSWORD_LENGTH })}
              value={password}
              onChangeText={setPassword}
              error={error}
              autoFocus
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={next}
            />
          )}
          <Button
            label={step === 'password' ? t('auth.createAccount') : t('common.next')}
            onPress={next}
            loading={busy}
          />
          <Button label={t('common.back')} variant="outline" onPress={back} disabled={busy} />
        </View>

        <Pressable
          accessibilityRole="link"
          onPress={() => router.replace('/sign-in')}
          className="mt-5 min-h-[44px] justify-center">
          <AppText tone="primary" weight="medium" className="text-[15px]">
            {t('auth.haveAccount')}
          </AppText>
        </Pressable>
      </Screen>
    </KeyboardAvoidingView>
  );
}
