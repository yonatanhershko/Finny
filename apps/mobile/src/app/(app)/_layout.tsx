import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import { materializeRecurring } from '@/data/queries';
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
      <AppStack />
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
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack>
  );
}
