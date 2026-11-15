import { createContext, use } from 'react';

/** Height of the floating bottom tab bar, 0 on screens outside the tabs. */
export const TabBarHeightContext = createContext(0);
export const TAB_BAR_CONTENT_HEIGHT = 56;
export const useTabBarHeight = () => use(TabBarHeightContext);
