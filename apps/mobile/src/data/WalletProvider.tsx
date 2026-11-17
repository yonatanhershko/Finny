import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { ErrorState, Loading } from '@/components/ui/States';
import { loadLastWallet, saveLastWallet } from '@/lib/preferences';

import { useWallets } from './queries';
import { WalletContext, type WalletState } from './walletContext';

/**
 * Holds the current wallet for the signed-in app. Opens on the wallet used last on
 * this device; if that one is gone (deleted, other device), on the first wallet.
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const wallets = useWallets(!!userId);
  // undefined = still reading the device; null = nothing saved.
  const [chosen, setChosen] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    void loadLastWallet(userId).then((id) => {
      if (alive) setChosen(id);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  const list = wallets.data;
  const state = useMemo<WalletState | null>(() => {
    if (!list || list.length === 0 || chosen === undefined) return null;
    const wallet = list.find((w) => w.id === chosen) ?? list[0];
    return {
      wallet,
      wallets: list,
      select: (id: string) => {
        setChosen(id);
        if (userId) void saveLastWallet(userId, id);
      },
    };
  }, [list, chosen, userId]);

  if (!state) {
    const failed = wallets.isError || (wallets.isSuccess && wallets.data.length === 0);
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        {failed ? <ErrorState onRetry={() => void wallets.refetch()} /> : <Loading />}
      </View>
    );
  }
  return <WalletContext.Provider value={state}>{children}</WalletContext.Provider>;
}
