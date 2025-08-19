"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Send, Loader2 } from "lucide-react";
import { OnboardingStep, Question } from "@/types";

interface QuestionCardProps {
  step: OnboardingStep;
  responses: Record<string, string | string[]>;
  onResponseChange: (questionId: string, value: string | string[]) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isProcessing: boolean;
}

export default function QuestionCard({
  step,
  responses,
  onResponseChange,
  onNext,
  onPrevious,
  onSubmit,
  isFirstStep,
  isLastStep,
  isProcessing,
}: QuestionCardProps) {
  const renderQuestionInput = (question: Question) => {
    const value = responses[question.id] || "";

    switch (question.type) {
      case "text":
        return (
          <Input
            placeholder={question.placeholder}
            value={value as string}
            onChange={(e) => onResponseChange(question.id, e.target.value)}
            className="mt-2"
          />
        );
      
      case "textarea":
        return (
          <Textarea
            placeholder={question.placeholder}
            value={value as string}
            onChange={(e) => onResponseChange(question.id, e.target.value)}
            className="mt-2 min-h-[120px]"
          />
        );
      
      case "select":
        return (
          <Select
            value={value as string}
            onValueChange={(selectedValue) => onResponseChange(question.id, selectedValue)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return null;
    }
  };

  const canProceed = step.questions.every(question => {
    if (!question.required) return true;
    const response = responses[question.id];
    return response && response !== "";
  });

  const handleSubmitClick = () => {
    if (isLastStep) {
      onSubmit();
    } else {
      onNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl"
    >
      <Card className="border bg-card dark:bg-card shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-surface">
            {step.title}
          </CardTitle>
          {step.description && (
            <p className="text-surface-muted mt-2">
              {step.description}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step.questions.map((question) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <label className="block text-sm font-medium text-surface mb-2">
                {question.text}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {renderQuestionInput(question)}
              
              {/* Suggested answers for certain questions */}
              {question.type === "text" && question.id === "target-audience" && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Suggestions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Small businesses", "Entrepreneurs", "Students", "Professionals"].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => onResponseChange(question.id, suggestion)}
                        className="text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {/* Navigation buttons */}
          <motion.div
            className="flex items-center justify-between pt-6 border-t border-surface"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={isFirstStep || isProcessing}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex-1 text-center">
              <span className="text-sm text-surface-muted">
                Step {step.id} of 5
              </span>
            </div>

            <Button
              onClick={handleSubmitClick}
              disabled={!canProceed || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : isLastStep ? (
                <>
                  <Send className="h-4 w-4" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            className="w-full bg-muted rounded-full h-2 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <motion.div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              initial={{ width: 0 }}
              animate={{ width: `${(step.id / 5) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
