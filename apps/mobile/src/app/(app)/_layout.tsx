import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import { materializeRecurring } from '@/data/queries';
import { WalletProvider } from '@/data/WalletProvider';
import { NotificationSetup } from '@/notifications/NotificationSetup';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Everything in here needs an active subscription (guard in the root layout).
 * The data cache lives and dies with this layout, so signing out drops it.
 */
export default function AppLayout() {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <WalletProvider>
        <AppStack />
      </WalletProvider>
    </QueryClientProvider>
  );
}

function AppStack() {
  const { colors } = useTheme();
  const client = useQueryClient();

  // Recurring transactions that came due since the last visit become real rows.
  useEffect(() => {
    void materializeRecurring().then((added) => {
      if (added > 0) void client.invalidateQueries();
    });
  }, [client]);

  return (
    <>
    <NotificationSetup />
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        // Swipe sideways to go back, from anywhere on the screen (iOS) or the edge (Android).
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
          fullScreenGestureEnabled: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack>
    </>
  );
}
