"use client";

import { motion } from "framer-motion";
import { 
  Lightbulb, 
  FileText, 
  Grid3X3, 
  Target, 
  Calendar,
  CheckCircle,
  Clock,
  Lock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface Stage {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "completed" | "current" | "locked";
  href: string;
  steps?: { id: string; title: string; status: "completed" | "current" | "locked" }[];
}

interface SidebarNavProps {
  stages: Stage[];
}

export default function SidebarNav({ stages }: SidebarNavProps) {
  const pathname = usePathname();

  const getStatusIcon = (status: Stage["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "current":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "locked":
        return <Lock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Stage["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700";
      case "current":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700";
      case "locked":
        return "bg-gray-100 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700";
    }
  };

  return (
    <div className="w-80 bg-surface/50 backdrop-blur-sm border-r border-surface h-full overflow-y-auto">
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-surface mb-2">Your Journey</h2>
          <p className="text-sm text-surface-muted">
            Transform your idea into a market-ready product
          </p>
        </motion.div>

        <div className="space-y-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = pathname === stage.href || 
              (stage.steps && stage.steps.some(step => pathname.includes(step.id)));
            const isLocked = stage.status === "locked";

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Link
                  href={isLocked ? "#" : stage.href}
                  className={`block p-4 rounded-xl border transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 border-primary/30 shadow-sm"
                      : isLocked
                      ? "bg-surface border-surface cursor-not-allowed opacity-60"
                      : "bg-surface border-surface hover:bg-surface-hover hover:border-surface-accent/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      isActive 
                        ? "bg-primary/20" 
                        : isLocked 
                        ? "bg-gray-100 dark:bg-gray-800" 
                        : "bg-surface-muted/50"
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        isActive 
                          ? "text-primary" 
                          : isLocked 
                          ? "text-gray-400" 
                          : "text-surface-muted"
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold text-sm ${
                          isLocked ? "text-gray-400" : "text-surface"
                        }`}>
                          {stage.title}
                        </h3>
                        {getStatusIcon(stage.status)}
                      </div>
                      
                      <p className={`text-xs mb-3 ${
                        isLocked ? "text-gray-400" : "text-surface-muted"
                      }`}>
                        {stage.description}
                      </p>
                      
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(stage.status)}`}
                      >
                        {stage.status === "completed" ? "Completed" : 
                         stage.status === "current" ? "In Progress" : "Locked"}
                      </Badge>
                    </div>
                  </div>

                  {/* Steps progress */}
                  {stage.steps && stage.steps.length > 0 && (
                    <div className="mt-3 pl-10">
                      <div className="space-y-1">
                        {stage.steps.map((step, stepIndex) => (
                          <div key={step.id} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              step.status === "completed" ? "bg-green-500" :
                              step.status === "current" ? "bg-blue-500" :
                              "bg-gray-300"
                            }`} />
                            <span className={`text-xs ${
                              isLocked ? "text-gray-400" : "text-surface-muted"
                            }`}>
                              {step.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
