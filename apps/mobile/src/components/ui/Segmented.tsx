import { Pressable, View } from 'react-native';

import { AppText } from './AppText';

/** Two-or-more option switch, as in the stats mockup. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row rounded-lg bg-surface-muted p-1" accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={`min-h-[44px] flex-1 items-center justify-center rounded-md ${selected ? 'bg-primary' : ''}`}>
            <AppText weight="medium" tone={selected ? 'onPrimary' : 'text'} className="text-[15px]">
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
