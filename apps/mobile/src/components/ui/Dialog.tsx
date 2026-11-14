import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';

import { AppText } from './AppText';
import { Button, type ButtonProps } from './Button';

/**
 * Centered dialog. Used for confirmations and short forms; works the same on
 * iOS, Android and web (the system Alert does not exist on web).
 */
export function Dialog({
  visible,
  title,
  onClose,
  children,
  actions,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children?: ReactNode;
  actions: (Pick<ButtonProps, 'label' | 'variant' | 'loading' | 'disabled'> & { onPress: () => void })[];
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-6"
          onPress={onClose}
          accessibilityLabel={title}>
          <Pressable
            className="w-full max-w-[420px] gap-4 rounded-xl bg-background p-5"
            onPress={(e) => e.stopPropagation()}
            accessibilityViewIsModal>
            <AppText weight="bold" className="text-[19px]" accessibilityRole="header">
              {title}
            </AppText>
            {children}
            <View className="gap-2">
              {actions.map((action) => (
                <Button key={action.label} {...action} />
              ))}
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
