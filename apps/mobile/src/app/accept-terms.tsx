import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/auth/AuthProvider';
import { TermsView } from '@/components/TermsView';
import { AppText } from '@/components/ui/AppText';
import { PressScale } from '@/components/ui/PressScale';

/**
 * First Google sign-in: the account exists but the terms were never accepted.
 * Accept to continue, or sign out. The guard in the root layout moves on by itself.
 */
export default function AcceptTermsScreen() {
  const { t } = useTranslation();
  const { acceptTerms, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async () => {
    setBusy(true);
    setError(null);
    const code = await acceptTerms();
    setBusy(false);
    if (code) setError(t(`auth.errors.${code}`));
  };

  return (
    <TermsView
      back={false}
      onAccept={accept}
      busy={busy}
      footer={
        <>
          {error ? (
            <AppText tone="danger" className="mt-2 text-center text-[14px]" accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}
          <PressScale
            accessibilityRole="button"
            onPress={() => void signOut()}
            className="mt-2 min-h-[44px] items-center justify-center">
            <AppText tone="muted" className="text-center text-[15px]">
              {t('auth.declineTerms')}
            </AppText>
          </PressScale>
        </>
      }
    />
  );
}
