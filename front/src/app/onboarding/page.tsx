"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, X, MapPin, Calendar, Hash, AlertCircle, Wifi, WifiOff } from "lucide-react";
import Header from "@/components/landing/Header";
import SummaryLoading from "@/components/loading/SummaryLoading";
import dynamic from "next/dynamic";
import { useIdeation } from "@/hooks/useIdeation";
import { IdeationAgentApiError } from "@/services/ideation";

// Dynamically import the map component to avoid SSR issues
const LocationMap = dynamic(() => import("@/components/ui/map"), {
  ssr: false,
  loading: () => (
    <div className="h-40 bg-gradient-to-br from-surface-muted to-surface-muted/50 rounded-xl flex items-center justify-center text-surface-muted border-2 border-dashed border-surface-muted/50">
      <div className="text-center space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm">Loading Map...</p>
      </div>
    </div>
  ),
});

interface Question {
  index: number;
  question: string;
  type?: "text" | "textarea" | "yesno" | "number" | "date" | "location";
  answer?: string;
  keywords?: string[];
  isSatisfactory?: boolean;
  satisfactionReason?: string;
}

export default function OnboardingPage() {
  const {
    businessIdea,
    setBusinessIdea,
    sessionId,
    questions,
    currentQuestionIndex,
    isGeneratingQuestions,
    isComplete,
    finalSummary,
    error,
    isApiHealthy,
    isLoadingSummary,
    startJourney,
    updateAnswer,
    requestKeywords,
    requestSuggestion,
    submitAnswer,
    resetOnboarding,
    generateSummary,
    canProceed,
    getCurrentQuestion
  } = useIdeation({
    onComplete: (summary) => {
      console.log('Business plan completed!', summary);
    },
    maxQuestions: 10
  });

  const [newKeyword, setNewKeyword] = useState("");
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [unansweredQuestions, setUnansweredQuestions] = useState<number[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<{[questionIndex: number]: string[]}>({});
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  // Track open questions by index (accordion control)
  const [openQuestions, setOpenQuestions] = useState<number[]>([]);
  // Track validated questions (locked/read-only)
  const [validatedQuestions, setValidatedQuestions] = useState<number[]>([]);

  // No session persistence on onboarding - always start fresh
  // Users should come here only to do onboarding, completed sessions go to /dashboard

  // Check for reset parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      resetOnboarding();
      setShowDashboard(false);
      setShowLoadingScreen(false);
      localStorage.removeItem('brandorb_session_id');
      localStorage.removeItem('brandorb_summary');
      localStorage.removeItem('brandorb_business_idea');
      localStorage.removeItem('brandorb_dashboard_timestamp');
      // Clean up URL
      window.history.replaceState({}, '', '/onboarding');
    }
  }, [resetOnboarding]);

  // Watch for completion to trigger summary loading
  useEffect(() => {
    // Only trigger completion flow once when isComplete becomes true
    if (isComplete && !showLoadingScreen && !showDashboard && sessionId) {
      console.log('Completion detected, starting summary flow...');
      setShowLoadingScreen(true);
      
      // Generate the summary from backend
      setTimeout(async () => {
        try {
          await generateSummary();
          setShowLoadingScreen(false);
          
          // Store completion data in localStorage
          if (sessionId && finalSummary && businessIdea) {
            localStorage.setItem('brandorb_session_id', sessionId);
            localStorage.setItem('brandorb_summary', finalSummary);
            localStorage.setItem('brandorb_business_idea', businessIdea);
            localStorage.setItem('brandorb_dashboard_timestamp', new Date().toISOString());
          }
          
          // Redirect to main dashboard
          window.location.href = '/dashboard/ideation';
        } catch (error) {
          console.error('Failed to generate summary:', error);
          setShowLoadingScreen(false);
        }
      }, 2000);
    }
  }, [isComplete, showLoadingScreen, showDashboard, sessionId, generateSummary, finalSummary, businessIdea]);

  // Handle initial business idea submission - now uses API
  const handleBusinessIdeaSubmit = async () => {
    if (!businessIdea.trim() || isGeneratingQuestions) return;
    await startJourney();
  };

  // Handle question answer submission - now uses API with completion handling
  const handleQuestionSubmit = async (questionIndex: number) => {
    if (!canProceed(questionIndex)) return;
    
    // Submit the answer - completion will be handled by the useEffect above
    await submitAnswer(questionIndex);
  };

  // Handle keyword addition
  const addKeyword = async (questionIndex: number) => {
    if (!newKeyword.trim()) return;
    
    // Add keyword to selected keywords
    const currentSelected = selectedKeywords[questionIndex] || [];
    if (!currentSelected.includes(newKeyword.trim())) {
      setSelectedKeywords(prev => ({
        ...prev,
        [questionIndex]: [...currentSelected, newKeyword.trim()]
      }));
    }
    setNewKeyword("");
  };

  // Toggle keyword selection
  const toggleKeyword = (questionIndex: number, keyword: string) => {
    setSelectedKeywords(prev => {
      const currentSelected = prev[questionIndex] || [];
      const isSelected = currentSelected.includes(keyword);
      
      if (isSelected) {
        // Remove keyword
        return {
          ...prev,
          [questionIndex]: currentSelected.filter(k => k !== keyword)
        };
      } else {
        // Add keyword
        return {
          ...prev,
          [questionIndex]: [...currentSelected, keyword]
        };
      }
    });
  };

  // Load keywords automatically when question is rendered
  const loadKeywordsAutomatically = async (questionIndex: number) => {
    const question = questions.find(q => q.index === questionIndex);
    if (!question || question.keywords) return;
    
    await requestKeywords(questionIndex);
  };

  // Generate AI answer from keywords - now uses API suggestion
  const generateAIAnswer = async (questionIndex: number) => {
    const question = questions.find(q => q.index === questionIndex);
    if (!question) return;

    setIsGeneratingAnswer(true);
    try {
      // Use only selected keywords for AI generation
      const selectedKeywordsForQuestion = selectedKeywords[questionIndex] || [];
      if (selectedKeywordsForQuestion.length > 0) {
        await requestSuggestion(questionIndex, selectedKeywordsForQuestion);
      }
    } catch (error) {
      console.error('Failed to generate AI answer:', error);
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  // Update answer - now uses the hook's updateAnswer
  const handleUpdateAnswer = (questionIndex: number, answer: string) => {
    updateAnswer(questionIndex, answer);
    
    // Clear validation error when user starts typing
    if (answer.trim()) {
      setUnansweredQuestions(prev => prev.filter(index => index !== questionIndex));
    }
  };

  // Load keywords for a question
  const loadKeywords = async (questionIndex: number) => {
    const question = questions.find(q => q.index === questionIndex);
    if (!question || question.keywords) return;
    
    await requestKeywords(questionIndex);
  };

  // Auto-load keywords when question is displayed
  useEffect(() => {
    questions.forEach(question => {
      if (!question.keywords) {
        loadKeywordsAutomatically(question.index);
      }
    });
  }, [questions]);

  // When questions change, open the first unanswered question by default
  useEffect(() => {
    if (questions.length > 0) {
      // Find first unanswered question
      const firstUnanswered = questions.find(q => !q.answer)?.index;
      if (typeof firstUnanswered === 'number') {
        setOpenQuestions([firstUnanswered]);
      }
    }
  }, [questions.length]);

  // When a question is validated, lock it and allow expanding for review
  const handleQuestionSubmitAndCollapse = async (questionIndex: number) => {
    await handleQuestionSubmit(questionIndex);
    
    // Check if the question was actually validated (satisfactory)
    const question = questions.find(q => q.index === questionIndex);
    if (question && question.isSatisfactory === true) {
      // Mark as validated only if satisfactory
      setValidatedQuestions(prev => [...prev, questionIndex]);
      // After validation, close this question and open the next unanswered (if any)
      setOpenQuestions(prev => {
        const nextUnanswered = questions.find(
          (q, i) => i > questionIndex && !validatedQuestions.includes(q.index)
        )?.index;
        let newOpen = prev.filter(idx => idx !== questionIndex);
        if (typeof nextUnanswered === 'number') {
          newOpen = [...newOpen, nextUnanswered];
        }
        return newOpen;
      });
    }
    // If not satisfactory, keep the question open for re-editing
    // Don't regenerate the question, just show feedback and allow editing
  };

  // Accordion open/close handler
  const handleAccordionChange = (values: string[]) => {
    // Allow opening any question - remove the filtering that was preventing validated questions from opening
    setOpenQuestions(
      values.map(val => parseInt(val.replace('question-', '')))
    );
  };

  // Render input based on question type
  const renderQuestionInput = (question: Question) => {
    switch (question.type) {
      case "textarea":
        return (
          <div className="space-y-4">
            <Textarea
              value={question.answer || ""}
              onChange={(e) => handleUpdateAnswer(question.index, e.target.value)}
              placeholder="Your answer..."
              className="min-h-[120px] bg-surface border-surface focus:border-surface-accent text-lg resize-none outline-none focus:outline-none transition-colors"
            />
            
            {/* Keywords Section */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-surface-muted">
                Keywords (optional) - Select keywords to generate AI-powered answers
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Add your own keywords..."
                  className="flex-1 bg-surface border-surface focus:border-surface-accent outline-none focus:outline-none transition-colors"
                  onKeyPress={(e) => e.key === "Enter" && addKeyword(question.index)}
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => addKeyword(question.index)}
                    variant="outline"
                    size="sm"
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    Add
                  </Button>
                </motion.div>
              </div>
              
              {/* Display all available keywords (API + user-added) with checkboxes */}
              {(question.keywords || selectedKeywords[question.index]) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <div className="text-sm font-medium text-surface-muted">Available Keywords:</div>
                  <div className="flex flex-wrap gap-2">
                    {/* Combine API keywords and user-added keywords */}
                    {(() => {
                      const apiKeywords = question.keywords || [];
                      const userKeywords = selectedKeywords[question.index] || [];
                      const allKeywords = [...new Set([...apiKeywords, ...userKeywords])]; // Remove duplicates
                      const currentSelected = selectedKeywords[question.index] || [];
                      
                      return allKeywords.map((keyword, index) => {
                        const isSelected = currentSelected.includes(keyword);
                        return (
                          <motion.div
                            key={keyword}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05, duration: 0.2 }}
                            whileHover={{ scale: 1.02 }}
                          >
                            <label className="flex items-center cursor-pointer">
                              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                                isSelected 
                                  ? 'bg-surface-accent/10 border-surface-accent text-surface-accent' 
                                  : 'bg-surface border-surface text-surface-muted hover:border-surface-accent/50 hover:bg-surface-accent/5'
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleKeyword(question.index, keyword)}
                                  className="w-4 h-4 text-surface-accent border-surface rounded focus:ring-surface-accent focus:ring-2 outline-none focus:outline-none"
                                />
                                <span className="text-sm font-medium">{keyword}</span>
                              </div>
                            </label>
                          </motion.div>
                        );
                      });
                    })()}
                  </div>
                  
                  {/* Show count of selected keywords */}
                  {selectedKeywords[question.index] && selectedKeywords[question.index].length > 0 && (
                    <div className="text-xs text-surface-accent">
                      {selectedKeywords[question.index].length} keyword(s) selected for AI generation
                    </div>
                  )}
                </motion.div>
              )}
              
              <div className="flex gap-2">
                {selectedKeywords[question.index] && selectedKeywords[question.index].length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => generateAIAnswer(question.index)}
                      disabled={isGeneratingAnswer}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
                      variant="outline"
                    >
                      <motion.div
                        animate={isGeneratingAnswer ? { rotate: 360 } : { rotate: 0 }}
                        transition={{ duration: 1, repeat: isGeneratingAnswer ? Infinity : 0, ease: "linear" }}
                      >
                        <Sparkles className="h-4 w-4" />
                      </motion.div>
                      {isGeneratingAnswer ? "Generating..." : "Generate AI Answer"}
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        );

      case "yesno":
        return (
          <div className="flex justify-center">
            <div className="flex gap-3 max-w-md">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                <Button
                  variant={question.answer === "yes" ? "default" : "outline"}
                  onClick={() => handleUpdateAnswer(question.index, "yes")}
                  className={`w-full py-3 text-base font-medium transition-all duration-200 ${
                    question.answer === "yes" 
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground border-primary" 
                      : "border-primary/30 text-surface hover:bg-primary/10 hover:border-primary/50"
                  }`}
                >
                  ✓ Yes
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                <Button
                  variant={question.answer === "no" ? "default" : "outline"}
                  onClick={() => handleUpdateAnswer(question.index, "no")}
                  className={`w-full py-3 text-base font-medium transition-all duration-200 ${
                    question.answer === "no" 
                      ? "bg-red-500 hover:bg-red-600 text-white border-red-500" 
                      : "border-primary/30 text-surface hover:bg-red-100 hover:border-red-500"
                  }`}
                >
                  ✗ No
                </Button>
              </motion.div>
            </div>
          </div>
        );

      case "number":
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <Input
              type="number"
              value={question.answer || ""}
              onChange={(e) => handleUpdateAnswer(question.index, e.target.value)}
              placeholder="Enter a number..."
              className="flex-1 bg-surface border-surface focus:border-surface-accent text-lg py-3 outline-none focus:outline-none transition-colors"
            />
          </div>
        );

      case "date":
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <Input
              type="date"
              value={question.answer || ""}
              onChange={(e) => handleUpdateAnswer(question.index, e.target.value)}
              className="flex-1 bg-surface border-surface focus:border-surface-accent text-lg py-3 outline-none focus:outline-none transition-colors"
            />
          </div>
        );

      case "location":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <Input
                value={question.answer || ""}
                onChange={(e) => handleUpdateAnswer(question.index, e.target.value)}
                placeholder="Enter location or address..."
                className="flex-1 bg-surface border-surface focus:border-surface-accent text-lg py-3 outline-none focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-surface-muted">Click on the map to select a location</p>
              <LocationMap
                onLocationSelect={(location) => handleUpdateAnswer(question.index, location)}
                initialLocation={question.answer}
                className="w-full"
              />
            </div>
          </div>
        );

      default:
        return (
          <Input
            value={question.answer || ""}
            onChange={(e) => handleUpdateAnswer(question.index, e.target.value)}
            placeholder="Type your answer here..."
            className="bg-surface border-surface focus:border-surface-accent text-lg py-3 outline-none focus:outline-none transition-colors"
          />
        );
    }
  };

  return (
    <>
      {/* Show Loading Screen during summary generation */}
      {showLoadingScreen && (
        <SummaryLoading
          onComplete={() => {
            // This will be handled by the useEffect above
            console.log('Loading complete, redirecting...');
          }}
          duration={12000}
        />
      )}

      {/* Show Onboarding if not in loading */}
      {!showLoadingScreen && (
        <>
          <Header />
          <div className="min-h-screen bg-surface dark:bg-surface pt-20">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
          
          {/* API Health Indicator */}
          <div className="fixed top-20 right-4 z-40">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium ${
                isApiHealthy 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
              }`}
            >
              {isApiHealthy ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {isApiHealthy ? 'AI Connected' : 'AI Offline'}
            </motion.div>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800 dark:text-red-300">
                      {error instanceof IdeationAgentApiError ? 'API Error' : 'Error'}
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {error.message}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="text-red-600 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Retry
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        
        {/* Initial Business Idea Input - Cool Design */}
        {questions.length === 0 && !isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center justify-center min-h-[70vh] space-y-12"
          >
            {/* Hero Section */}
            <div className="text-center space-y-6 max-w-4xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="inline-flex items-center gap-3 bg-surface/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-soft border border-surface"
              >
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-primary font-semibold">AI-Powered Business Planning</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent leading-tight"
              >
                What's Your
                <br />
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-800 bg-clip-text text-transparent">
                  Big Idea?
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="text-xl md:text-xl text-surface-muted max-w-3xl mx-auto leading-relaxed"
              >
                Share your business vision and let our AI create a personalized roadmap to turn your idea into reality.
              </motion.p>
            </div>

            {/* Large Unboxed Input */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="w-full max-w-4xl space-y-6"
            >
              <div className="relative">
                <Textarea
                  value={businessIdea}
                  onChange={(e) => setBusinessIdea(e.target.value)}
                  placeholder="Describe your business idea in detail... What problem does it solve? Who is your target audience? What makes it unique?"
                  className="w-full min-h-[200px] text-xl md:text-xl p-8 bg-surface border-2 border-surface rounded-2xl shadow-sm focus:border-surface-accent resize-none placeholder:text-surface-muted transition-all duration-300 outline-none focus:outline-none"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
              </div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex justify-center"
              >
                <Button
                  onClick={handleBusinessIdeaSubmit}
                  disabled={!businessIdea.trim() || isGeneratingQuestions || !isApiHealthy}
                  className="px-12 py-6 text-lg font bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-gentle border-0 transition-all duration-300 min-w-[200px] disabled:opacity-50"
                  size="lg"
                >
                  {isGeneratingQuestions ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-3 text-white"
                      >
                        <Sparkles className="h-6 w-6 text-white" />
                      </motion.div>
                      <span className="text-white">Getting AI Questions...</span>
                    </>
                  ) : !isApiHealthy ? (
                    <>
                      <WifiOff className="h-6 w-6 mr-3 text-white" />
                      <span className="text-white">AI Unavailable</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-6 w-6 mr-3 text-white" />
                      <span className="text-white">Start Your Journey</span>
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Questions in Accordion Format */}
        {questions.length > 0 && !isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <Accordion
              type="multiple"
              value={openQuestions.map(idx => `question-${idx}`)}
              onValueChange={handleAccordionChange}
              className="space-y-4"
            >
              {questions.map((question, index) => {
                const isValidated = validatedQuestions.includes(question.index);
                return (
                  <motion.div
                    key={question.index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <AccordionItem
                      value={`question-${index}`}
                      className={`border rounded-xl overflow-hidden bg-card dark:bg-card hover:border-surface-accent/50 transition-all duration-300 shadow-sm hover:shadow-md ${
                        unansweredQuestions.includes(question.index)
                          ? "border-red-500"
                          : "border-surface"
                      }`}
                    >
                      <AccordionTrigger
                        className="px-6 py-4 hover:bg-surface-hover transition-all duration-200"
                        // All questions can be opened - for review or editing
                        disabled={false}
                      >
                        <div className="flex flex-col gap-3 w-full text-left">
                          {/* Question Counter on top */}
                          <div className="text-sm text-surface-muted font-medium">
                            Question {index + 1} of 5
                          </div>
                          {/* Status Badges */}
                          <div className="flex items-center gap-2 justify-start">
                            {!question.answer && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                                  Awaiting Answer
                                </Badge>
                              </motion.div>
                            )}
                            {question.answer && question.isSatisfactory === true && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Badge variant="secondary" className="bg-green-50 text-green-600 border-green-200">
                                  ✓ Validated
                                </Badge>
                              </motion.div>
                            )}
                            {question.answer && question.isSatisfactory === false && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                                  ⚠ Needs Improvement
                                </Badge>
                              </motion.div>
                            )}
                            {question.answer && question.isSatisfactory === undefined && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                                  ⏳ Pending Validation
                                </Badge>
                              </motion.div>
                            )}
                            {unansweredQuestions.includes(question.index) && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Badge variant="destructive" className="bg-red-50 text-red-800 border-red-200">
                                  Required
                                </Badge>
                              </motion.div>
                            )}
                          </div>
                          {/* Question text on bottom */}
                          <span className="font-medium text-surface text-left text-xl">{question.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                        <motion.div
                          className="space-y-6 pt-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* Show read-only view if question has a satisfactory answer */}
                          {question.answer && question.isSatisfactory === true ? (
                            <div className="rounded-lg p-4 bg-surface-muted/30">
                              <div className="mb-2 text-base font-semibold text-surface">Your Answer:</div>
                              <div className="whitespace-pre-line text-base text-surface-muted">{question.answer}</div>
                            </div>
                          ) : (
                            <>
                              <div className="rounded-lg p-4 bg-surface-muted/30">
                                {renderQuestionInput({
                                  index: question.index,
                                  question: question.question,
                                  type: question.type || "textarea",
                                  answer: question.answer,
                                  keywords: question.keywords,
                                  isSatisfactory: question.isSatisfactory,
                                  satisfactionReason: question.satisfactionReason
                                })}
                              </div>
                              
                              {/* Show feedback if answer is not satisfactory */}
                              {question.answer && question.isSatisfactory === false && question.satisfactionReason && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-800 rounded-lg p-4 shadow-sm"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2">
                                        AI Feedback - Please improve your answer:
                                      </p>
                                      <p className={`text-sm leading-relaxed mb-3 ${
                                        question.satisfactionReason?.includes('The answer does not directly address the question about the go-to-market strategy and pricing model')
                                          ? 'text-orange-300 dark:text-orange-800' 
                                          : 'text-orange-700 dark:text-orange-200'
                                      }`}>
                                        {question.satisfactionReason}
                                      </p>
                                      <p className="text-xs text-orange-600 dark:text-orange-400 italic">
                                        Edit your answer above and submit again for validation.
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                              
                              {/* Submit/Validate button */}
                              <div className="flex items-center justify-end pt-4 border-t border-surface">
                                <div className="flex gap-3">
                                  <Button
                                    onClick={() => handleQuestionSubmitAndCollapse(question.index)}
                                    disabled={!canProceed(question.index) || isGeneratingQuestions}
                                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 rounded-lg transition-all duration-300 disabled:opacity-50"
                                  >
                                    {isGeneratingQuestions ? (
                                      <>
                                        <motion.div
                                          animate={{ rotate: 360 }}
                                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                          <Sparkles className="h-4 w-4 text-white" />
                                        </motion.div>
                                        <span className="text-white">Validating...</span>
                                      </>
                                    ) : question.answer && question.isSatisfactory === false ? (
                                      <>
                                        <Send className="h-4 w-4 text-white" />
                                        <span className="text-white">Resubmit Answer</span>
                                      </>
                                    ) : (
                                      <>
                                        <Send className="h-4 w-4 text-white" />
                                        <span className="text-white">Submit Answer</span>
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </motion.div>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                );
              })}
            </Accordion>
          </motion.div>
        )}

        {/* Completion Screen */}
        {isComplete && finalSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-3 bg-green-50 dark:bg-green-900/50 px-6 py-3 rounded-full shadow-soft border border-green-200 dark:border-green-700/50 mb-6">
                <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-green-800 dark:text-green-300 font-semibold">Journey Complete!</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-surface mb-4">
                Your Business Plan Summary
              </h1>
              <p className="text-lg text-surface-muted max-w-2xl mx-auto">
                Here's your AI-generated business plan based on your responses
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="bg-surface/30 backdrop-blur-sm border border-surface rounded-xl p-8 shadow-card"
            >
              <div className="prose max-w-none text-surface">
                <div className="whitespace-pre-wrap text-base leading-relaxed">
                  {finalSummary}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                onClick={resetOnboarding}
                variant="outline"
                className="px-8 py-3 font-medium"
              >
                Start New Plan
              </Button>
              <Button
                onClick={() => window.print()}
                className="px-8 py-3 font-medium"
              >
                <span className="text-white">Download Plan</span>
              </Button>
            </motion.div>
          </motion.div>
        )}
            </div>
          </div>
        </>
      )}
    </>
  );
}


