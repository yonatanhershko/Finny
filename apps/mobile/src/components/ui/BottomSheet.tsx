import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useKeyboardVisible } from '@/lib/keyboard';
import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressScale } from './PressScale';

const OPEN_MS = 320;
const CLOSE_MS = 220;

/**
 * Sheet that slides up from the bottom over a fading backdrop. Closes by the X,
 * a tap on the backdrop, Android back, or dragging the top bar down.
 * "Reduce motion": appears and disappears without sliding.
 * On wide screens (tablets, landscape) it stays a centered column, never edge to edge.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardVisible();
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  // Stays mounted while the close animation runs.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  const progress = useSharedValue(0);
  const drag = useSharedValue(0);

  useEffect(() => {
    if (!mounted) return;
    if (visible) {
      drag.set(0);
      progress.set(
        withTiming(1, { duration: reduceMotion ? 0 : OPEN_MS, easing: Easing.out(Easing.cubic) }),
      );
    } else {
      progress.set(
        withTiming(0, { duration: reduceMotion ? 0 : CLOSE_MS, easing: Easing.in(Easing.cubic) }, (done) => {
          if (done) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [visible, mounted, reduceMotion, progress, drag]);

  // A drag far enough down asks to close; the effect below passes it on.
  const [dragClose, setDragClose] = useState(0);
  useEffect(() => {
    if (dragClose > 0) onClose();
    // Only a new drag closes; a new onClose function alone must not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragClose]);
  const [pan] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => drag.set(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 90 || g.vy > 0.8) setDragClose((n) => n + 1);
        else drag.set(withSpring(0, { damping: 20, stiffness: 220 }));
      },
      onPanResponderTerminate: () => drag.set(withSpring(0)),
    }),
  );

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const sheet = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.get()) * height + drag.get() }],
  }));

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
        </Animated.View>
        <View style={styles.bottom} pointerEvents="box-none">
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background,
                maxHeight: height - insets.top - 24,
                paddingBottom: keyboardOpen ? 12 : insets.bottom + 16,
              },
              sheet,
            ]}>
            <View {...pan.panHandlers}>
              <View className="items-center pb-1 pt-2">
                <View style={[styles.handle, { backgroundColor: colors.border }]} />
              </View>
              <View className="min-h-[48px] flex-row items-center px-3">
                <View className="w-11" />
                <AppText
                  weight="bold"
                  className="flex-1 text-center text-[18px]"
                  numberOfLines={1}
                  accessibilityRole="header">
                  {title}
                </AppText>
                <PressScale
                  accessibilityRole="button"
                  accessibilityLabel={t('common.close')}
                  onPress={onClose}
                  className="h-11 w-11 items-center justify-center">
                  <Icon name="close" tone="muted" />
                </PressScale>
              </View>
            </View>
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerClassName="px-5 pb-1">
              {children}
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.4)' },
  bottom: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: 560,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: { width: 40, height: 5, borderRadius: 3 },
});
