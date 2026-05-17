import { create } from 'zustand';
import i18n from '../lib/i18n';

interface UIState {
  language: 'en' | 'ar';
  sidebarOpen: boolean;
  setLanguage: (lang: 'en' | 'ar') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

// Apply fixed arena CSS variables for consistent styling
(function applyTheme() {
  const root = document.documentElement;
  const vars: Record<string, string> = {
    '--mode-bg': '#0a1628',
    '--mode-bg-card': '#132042',
    '--mode-bg-glass': 'rgba(255,255,255,0.04)',
    '--mode-text': '#ffffff',
    '--mode-text-secondary': 'rgba(255,255,255,0.4)',
    '--mode-border': 'rgba(255,255,255,0.08)',
    '--mode-primary': '#0f8cff',
    '--mode-secondary': '#39ff14',
    '--mode-accent': '#f59e0b',
    '--mode-header-bg': '#07111f',
    '--mode-card-radius': '1rem',
    '--mode-card-shadow': '0 4px 24px rgba(0,0,0,0.3)',
  };
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
})();

export const useUI = create<UIState>((set) => ({
  language: 'en',
  sidebarOpen: false,
  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    set({ language: lang });
  },
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
