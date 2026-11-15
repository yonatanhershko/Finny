import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Platform } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Dialog } from '@/components/ui/Dialog';
import { useLanguage } from '@/i18n';

import {
  getPermission,
  markAsked,
  NOTIFICATION_ROUTES,
  type NotificationRoute,
  refreshNotifications,
  requestPermission,
  wasAsked,
} from './index';

/**
 * Mounted once inside the signed-in app. Keeps reminders and the push token
 * fresh, asks for permission once (own explanation first, then the system
 * prompt), and opens the right screen when a notification is tapped.
 */
export function NotificationSetup() {
  const { t } = useTranslation();
  const language = useLanguage();
  const [asking, setAsking] = useState(false);

  // On open, on return to the front, and when the language changes (new texts).
  useEffect(() => {
    void refreshNotifications();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshNotifications();
    });
    return () => sub.remove();
  }, [language]);

  // First arrival at home: explain, then let the user decide.
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      if ((await getPermission()) !== 'undetermined' || (await wasAsked())) return;
      if (alive) setAsking(true);
    }, 1200);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const open = (response: Notifications.NotificationResponse | null) => {
      const url = response?.notification.request.content.data?.url;
      const route = NOTIFICATION_ROUTES.find((known) => known === url) as NotificationRoute | undefined;
      if (!route) return;
      Notifications.clearLastNotificationResponse();
      router.push(route);
    };
    // The tap that started the app, then taps while it runs.
    open(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);

  const later = () => {
    setAsking(false);
    void markAsked();
  };
  const allow = () => {
    setAsking(false);
    void requestPermission().then(() => refreshNotifications());
  };

  return (
    <Dialog
      visible={asking}
      title={t('notifications.ask.title')}
      onClose={later}
      actions={[
        { label: t('notifications.ask.allow'), onPress: allow },
        { label: t('notifications.ask.later'), variant: 'outline', onPress: later },
      ]}>
      <AppText className="text-[15px] leading-[22px]">{t('notifications.ask.body')}</AppText>
    </Dialog>
  );
}
