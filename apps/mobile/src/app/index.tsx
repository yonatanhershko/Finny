import { colors } from '@finny/tokens';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

type Check = 'checking' | 'ok' | 'failed';

/** Phase 1 placeholder: proves env, shared tokens and the Supabase connection work. */
export default function InfraCheckScreen() {
  const theme = colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [check, setCheck] = useState<Check>('checking');

  useEffect(() => {
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ error }) => alive && setCheck(error ? 'failed' : 'ok'))
      .catch(() => alive && setCheck('failed'));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.primary }]}>Finny</Text>
      <Text style={[styles.line, { color: theme.text }]}>Environment: {env.appEnv}</Text>
      <Text style={[styles.line, { color: check === 'failed' ? theme.danger : theme.text }]}>
        Supabase client: {check}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 36, fontWeight: '700' },
  line: { fontSize: 15 },
});
