# Language and RTL rules

- Languages: Hebrew (`he`, RTL) and English (`en`, LTR).
- First launch: Hebrew phone → `he`. Any other phone language → `en`. The user can change it in More → Language; that choice is saved and wins.
- No hard-coded user-facing strings in components. Every string comes from `apps/mobile/src/i18n/{he,en}.json`. Add both languages in the same change.
- Layout never mirrors (owner decision 2026-11-15): the app is always laid out left-to-right on iPhone and Android, so Hebrew and English look the same. Native RTL is switched off (`I18nManager.allowRTL(false)`).
- Language only changes text and icon/text row order. All text goes through `AppText`, which starts Hebrew at the right and English at the left (centered text stays centered). Text that is only a number (amount, date, time, phone) is always left-aligned and left-to-right, in both languages; `AppText` detects it. The currency sign sits left of the number. Rows of icon + text use `useRowAlign()` from `@/i18n` (Hebrew: icon at the right). Never hand-roll `textAlign` / `flex-row-reverse` in a screen.
- Direction icons (back chevron, arrows) keep their left-to-right meaning. Numbers, currency amounts and charts never flip.
- Changing the language needs no app reload.
- Dates and numbers format with `Intl` using the active locale.
- Admin web is English only for now.
