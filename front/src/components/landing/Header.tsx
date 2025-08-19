"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const isOnboardingPage = pathname === "/onboarding";

  // Only render after hydration to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const navigationItems = [
    { name: "How It Works", href: "#how-it-works" },
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "About", href: "#about" },
  ];

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-surface/20"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative h-9 w-auto">
                {!mounted ? (
                  // Placeholder during hydration
                  <div className="h-9 w-[138px] bg-surface-muted animate-pulse rounded" />
                ) : (
                  <Image
                    src={resolvedTheme === 'dark' ? '/logo/dark.svg' : '/logo/white.svg'}
                    alt="BrandOrb AI"
                    width={138}
                    height={36}
                    className="h-9 w-[138px] object-contain"
                    priority
                  />
                )}
              </div>
            </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-surface-muted hover:text-surface-accent font-medium transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <DarkModeToggle />
            <Button variant="ghost" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
            {isOnboardingPage ? (
              <Button
                className="text-white"
                onClick={() => {
                  // Clear all onboarding/session data
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('brandorb_session_id');
                    localStorage.removeItem('brandorb_summary');
                    localStorage.removeItem('brandorb_business_idea');
                    localStorage.removeItem('brandorb_dashboard_timestamp');
                  }
                  // Force reload to onboarding with reset param
                  window.location.href = '/onboarding?reset=true';
                }}
              >
                <span className="text-white">Start Again</span>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/onboarding" className="text-white">
                  <span className="text-white">Get Started</span>
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-surface-hover transition-colors duration-200"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-surface-muted" />
            ) : (
              <Menu className="h-6 w-6 text-surface-muted" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            className="md:hidden py-4 border-t border-surface"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <nav className="flex flex-col space-y-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-surface-muted hover:text-surface-accent font-medium transition-colors duration-200 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex flex-col space-y-2 pt-4 border-t border-surface">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-muted">Theme</span>
                  <DarkModeToggle />
                </div>
                <Button variant="ghost" asChild>
                  <Link href="/signin">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href={isOnboardingPage ? "/onboarding?reset=true" : "/onboarding"} className="text-white">
                    <span className="text-white">{isOnboardingPage ? "Start Again" : "Get Started"}</span>
                  </Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
