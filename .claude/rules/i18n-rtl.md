# Language and RTL rules

- Languages: Hebrew (`he`, RTL) and English (`en`, LTR).
- First launch: Hebrew phone → `he`. Any other phone language → `en`. The user can change it in More → Language; that choice is saved and wins.
- No hard-coded user-facing strings in components. Every string comes from `apps/mobile/src/i18n/{he,en}.json`. Add both languages in the same change.
- Layout uses logical direction: `start` / `end`, `ms-` / `me-`, `ps-` / `pe-`, `text-start`. Never `left` / `right` for layout that should flip.
- Icons that show direction (back arrow, chevron) flip in RTL. Numbers, currency amounts and charts do not.
- Switching between RTL and LTR needs an app reload. Tell the user before doing it.
- Dates and numbers format with `Intl` using the active locale.
- Admin web is English only for now.
