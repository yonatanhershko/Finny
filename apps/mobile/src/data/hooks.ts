import {
  type Category,
  type Currency,
  formatMoney,
  type ISODate,
  type Period,
  periodFor,
  todayISO,
} from '@finny/shared';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/i18n';

import { useSettings } from './queries';

/** Left-to-right mark: keeps "₪ 1,850" in that order inside Hebrew text, on iPhone and Android. */
const LRM = '\u200E';

/**
 * Money formatting with the user's chosen sign. The sign is display only.
 * The sign always sits left of the number, in Hebrew and in English.
 */
export function useMoney() {
  const { data } = useSettings();
  const currency: Currency = data?.currency ?? 'ILS';
  return { currency, format: (minor: number) => `${LRM}${formatMoney(minor, currency)}${LRM}` };
}

/** The budget month that contains today, by the user's start day. */
export function useCurrentPeriod(): { period: Period; startDay: number; today: ISODate } {
  const { data } = useSettings();
  const startDay = data?.month_start_day ?? 1;
  const today = todayISO();
  return { period: periodFor(today, startDay), startDay, today };
}

/** A category's display name: the user's own, or the translated default. */
export function useCategoryName() {
  const { t } = useTranslation();
  return (category: Pick<Category, 'name' | 'default_key'> | undefined): string => {
    if (!category) return t('categories.unknown');
    if (category.name) return category.name;
    return t(`categories.defaults.${category.default_key}`, { defaultValue: category.default_key ?? '' });
  };
}

/** Date formatting in the active language. Input is a YYYY-MM-DD calendar date. */
export function useDateFormat() {
  const language = useLanguage();
  const locale = language === 'he' ? 'he-IL' : 'en-GB';
  const make = (options: Intl.DateTimeFormatOptions) => {
    const format = new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
    // Parse as UTC and print as UTC so the calendar day never shifts.
    return (iso: ISODate) => format.format(new Date(`${iso}T00:00:00Z`));
  };
  return {
    dayMonth: make({ day: 'numeric', month: 'long' }),
    monthYear: make({ month: 'long', year: 'numeric' }),
    short: make({ day: '2-digit', month: '2-digit', year: 'numeric' }),
    dayMonthShort: make({ day: 'numeric', month: 'short' }),
  };
}
