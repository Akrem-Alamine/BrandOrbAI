"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Construction, 
  ArrowRight, 
  Clock,
  CheckCircle,
  Lock
} from "lucide-react";

interface StageSkeleton {
  title: string;
  description: string;
  status: "completed" | "current" | "locked";
  features?: string[];
  estimatedTime?: string;
  actionText?: string;
  onAction?: () => void;
}

interface StagePlaceholderProps {
  stage: StageSkeleton;
  className?: string;
}

export default function StageSkeleton({ stage, className = "" }: StagePlaceholderProps) {
  const getStatusIcon = () => {
    switch (stage.status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "current":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "locked":
        return <Lock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (stage.status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case "current":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Current Stage</Badge>;
      case "locked":
        return <Badge variant="outline" className="text-gray-500">Locked</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`${className}`}
    >
      <Card className={`${
        stage.status === "locked" ? "opacity-60" : ""
      } bg-surface/30 backdrop-blur-sm border-surface shadow-card`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <CardTitle className="text-xl text-surface">{stage.title}</CardTitle>
              </div>
              <CardDescription className="text-surface-muted">
                {stage.description}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Placeholder content */}
          <div className="text-center py-12">
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="w-16 h-16 bg-surface-muted/30 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Construction className="h-8 w-8 text-surface-muted" />
            </motion.div>
            
            <h3 className="text-lg font-semibold text-surface mb-2">
              Coming Soon
            </h3>
            <p className="text-surface-muted max-w-md mx-auto">
              This stage is currently under development. Our AI-powered tools will guide you through this process once available.
            </p>
          </div>

          {/* Features list */}
          {stage.features && stage.features.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-surface">What you'll get:</h4>
              <div className="grid gap-2">
                {stage.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="flex items-center gap-2 text-sm text-surface-muted"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {feature}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Estimated time */}
          {stage.estimatedTime && (
            <div className="flex items-center gap-2 text-sm text-surface-muted">
              <Clock className="h-4 w-4" />
              <span>Estimated completion time: {stage.estimatedTime}</span>
            </div>
          )}

          {/* Action button */}
          <div className="pt-4">
            <Button
              onClick={stage.onAction}
              disabled={stage.status === "locked"}
              className={`w-full ${
                stage.status === "current" 
                  ? "bg-primary hover:bg-primary/90 text-white" 
                  : "bg-surface-muted hover:bg-surface-muted/80"
              }`}
            >
              {stage.status === "locked" ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Complete previous stages first
                </>
              ) : (
                <>
                  {stage.actionText || "Get Started"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
