"use client";

import { motion } from "framer-motion";
import { CheckCircle, Clock, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export interface StageStatus {
  id: string;
  title: string;
  status: "completed" | "current" | "locked";
  progress?: number; // 0-100
}

interface StageProgressProps {
  stages: StageStatus[];
  className?: string;
}

export default function StageProgress({ stages, className = "" }: StageProgressProps) {
  const completedStages = stages.filter(stage => stage.status === "completed").length;
  const totalProgress = (completedStages / stages.length) * 100;

  const getStatusIcon = (status: StageStatus["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "current":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "locked":
        return <Lock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: StageStatus["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "current":
        return "text-blue-600";
      case "locked":
        return "text-gray-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-surface/50 backdrop-blur-sm border border-surface rounded-xl p-6 ${className}`}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-surface">Overall Progress</h3>
          <Badge variant="outline" className="text-xs">
            {completedStages} of {stages.length} stages completed
          </Badge>
        </div>
        
        <Progress value={totalProgress} className="h-2" />
        
        <p className="text-sm text-surface-muted mt-2">
          {Math.round(totalProgress)}% complete
        </p>
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-surface"
          >
            <div className="flex-shrink-0">
              {getStatusIcon(stage.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-medium ${getStatusColor(stage.status)}`}>
                {stage.title}
              </h4>
              
              {stage.progress !== undefined && stage.status === "current" && (
                <div className="mt-1">
                  <Progress value={stage.progress} className="h-1" />
                  <span className="text-xs text-surface-muted">
                    {stage.progress}% complete
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-shrink-0">
              <span className={`text-xs font-medium ${getStatusColor(stage.status)}`}>
                {stage.status === "completed" ? "Done" : 
                 stage.status === "current" ? "Active" : "Locked"}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
