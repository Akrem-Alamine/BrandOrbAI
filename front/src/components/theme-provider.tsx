"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ 
  children, 
  ...props 
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false} // Enable transitions for smoother theme switching
      storageKey="brandorb-theme"
      themes={['light', 'dark', 'system']}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
