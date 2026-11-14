# Design rules

- Global style lives in `packages/tokens`. Mobile (NativeWind) and web (Tailwind) both read it. No raw hex in components.
- Light: primary `#4A7C6F`, secondary `#A8C5B4`, background `#F5F1E8`, accent `#E8A87C`, text `#2E3D38`.
- Dark: primary `#7FBCA3`, secondary `#3D6B58`, background `#16211C`, accent `#E8A87C`, text `#E9F0EA`.
- Over budget = bold red amount + red progress bar. Red is used for nothing else except destructive actions.
- Nature feel, kept sparse (owner asked for much fewer leaves): a small leaf cluster in the bottom corners of main screens, in the style of the owner's SVGs in `refreal imgs and svgs/`. Leaves sit behind content, never under text, never block touches (`pointerEvents="none"`).
- Wallet illustration, moving in 3D and with no leaves on it, appears on login and all register steps. The app icon is the wallet alone too. A small moving 3D wallet is the logo on the home header.
- Motion is slow and calm (2–4 s loops). Respect the OS "reduce motion" setting: stop loops, keep the art.
- Adding money must be fast: home → tap Income or Expense → amount → category → save. No extra screens.
- Touch targets at least 44×44 pt. Text contrast at least 4.5:1 in both themes.
- Font: Rubik (Hebrew + Latin).
- Every screen handles loading, empty, error and success states.
