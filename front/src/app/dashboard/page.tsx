"use client";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex flex-col items-center justify-center h-full">
        <h3 className="text-2xl font-semibold text-blue-800 dark:text-blue-300 mb-2">
          Welcome to BrandOrbAI Dashboard!
        </h3>
        <p className="text-blue-700 dark:text-blue-400 text-base">
          Use the sidebar to navigate through your business planning tools and reports.
        </p>
      </div>
    </motion.div>
  );
}