"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { OnboardingStep } from "@/types";

interface StepIndicatorProps {
  steps: OnboardingStep[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const isCompleted = step.completed;
          const isCurrent = step.id === currentStep;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <motion.div
                className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : isCurrent
                    ? "bg-primary border-primary text-white"
                    : "bg-surface border-surface text-surface-muted dark:bg-muted dark:border-muted"
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
                
                {/* Pulse animation for current step */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [1, 0, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "loop",
                    }}
                  />
                )}
              </motion.div>

              {/* Step Title */}
              <div className="ml-3 hidden sm:block">
                <motion.h3
                  className={`text-sm font-medium ${
                    isCompleted
                      ? "text-green-600 dark:text-green-400"
                      : isCurrent
                      ? "text-surface-accent"
                      : "text-surface-muted"
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 + 0.1 }}
                >
                  {step.title}
                </motion.h3>
                {step.description && (
                  <motion.p
                    className="text-xs text-surface-muted mt-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                  >
                    {step.description}
                  </motion.p>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <motion.div
                  className={`flex-1 h-0.5 mx-4 ${
                    isCompleted
                      ? "bg-green-500"
                      : isCurrent
                      ? "bg-gradient-to-r from-primary to-border"
                      : "bg-border"
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Step Indicator */}
      <div className="sm:hidden">
        <motion.div
          className="flex items-center justify-center space-x-2 text-sm text-surface-muted"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span>Step {currentStep} of {steps.length}</span>
          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>
        
        <motion.div
          className="text-center mt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="text-lg font-medium text-surface">
            {steps.find(s => s.id === currentStep)?.title}
          </h3>
          <p className="text-sm text-surface-muted">
            {steps.find(s => s.id === currentStep)?.description}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
