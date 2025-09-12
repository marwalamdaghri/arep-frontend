'use client';

import { ThemeProvider } from '@/components/ThemeProvider';

export default function DashboardThemeWrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
