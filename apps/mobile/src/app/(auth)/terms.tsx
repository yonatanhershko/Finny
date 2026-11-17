import { router } from 'expo-router';

import { markTermsRead } from '@/auth/terms';
import { TermsView } from '@/components/TermsView';

/** The terms of use, opened from the last sign-up step. */
export default function TermsScreen() {
  return (
    <TermsView
      onAccept={() => {
        markTermsRead();
        router.back();
      }}
    />
  );
}
