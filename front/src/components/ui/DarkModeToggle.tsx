"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DarkModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render after hydration to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="p-2 rounded-lg bg-surface-muted w-9 h-9 animate-pulse" />
    );
  }

  const isDark = resolvedTheme === 'dark';

  const toggleDarkMode = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <motion.button
      onClick={toggleDarkMode}
      className="relative p-2 rounded-lg bg-surface-muted hover:bg-surface-hover transition-colors duration-200 focus:outline-none border-none outline-none"
      style={{ border: 'none', outline: 'none' }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.1 }}
    >
      <div className="relative w-5 h-5">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{ 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
                rotate: { duration: 0.4 },
              }}
              className="absolute inset-0"
            >
              <Moon className="w-5 h-5 text-blue-400" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={{ 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
                rotate: { duration: 0.4 },
              }}
              className="absolute inset-0"
            >
              <Sun className="w-5 h-5 text-yellow-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        initial={false}
        animate={{
          background: isDark 
            ? "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%)"
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}
