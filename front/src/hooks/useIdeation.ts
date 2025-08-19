// Custom React Hook for Ideation Agent Integration
// This hook manages the entire ideation flow state and API interactions

import { useState, useCallback, useEffect } from 'react';
import { 
  IdeationAgentService, 
  SessionResponse,
  AnswerResponse,
  SuggestAnswerResponse,
  KeywordsResponse,
  QuestionData,
  IdeationAgentApiError,
  checkApiHealth
} from '@/services/ideation';

// Generate a unique session ID
const generateSessionId = (): string => {
  return 'brandorb-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

// Helper function to generate a comprehensive business plan summary
const generateBusinessPlanSummary = (businessIdea: string, questions: DynamicQuestion[]): string => {
  const answeredQuestions = questions.filter(q => q.answer?.trim());
  
  let summary = `# Business Plan Summary\n\n`;
  summary += `## Business Idea\n${businessIdea}\n\n`;
  
  if (answeredQuestions.length > 0) {
    summary += `## Detailed Analysis\n\n`;
    answeredQuestions.forEach((q, index) => {
      summary += `### ${index + 1}. ${q.question}\n`;
      summary += `**Answer:** ${q.answer}\n\n`;
      
      if (q.isSatisfactory === false && q.satisfactionReason) {
        summary += `*Note: ${q.satisfactionReason}*\n\n`;
      }
    });
  }
  
  summary += `## Summary\n`;
  summary += `This business plan was developed through ${answeredQuestions.length} comprehensive questions, `;
  summary += `providing a detailed analysis of your business idea. Each aspect has been carefully considered `;
  summary += `to help you understand the key components needed for success.\n\n`;
  
  const satisfactoryAnswers = answeredQuestions.filter(q => q.isSatisfactory === true).length;
  if (satisfactoryAnswers > 0) {
    summary += `**Completion Status:** ${satisfactoryAnswers} out of ${answeredQuestions.length} questions `;
    summary += `have received satisfactory detailed responses.\n\n`;
  }
  
  summary += `**Next Steps:** Review each section and consider expanding on areas that need more detail. `;
  summary += `Use this plan as a foundation for further business development and planning.`;
  
  return summary;
};

// Enhanced Question interface with additional UI properties
export interface DynamicQuestion {
  index: number;
  question: string;
  answer?: string;
  keywords?: string[];
  suggestedAnswer?: string;
  isLoadingSuggestion?: boolean;
  isLoadingKeywords?: boolean;
  isSatisfactory?: boolean;
  satisfactionReason?: string;
  type?: 'text' | 'textarea' | 'yesno' | 'number' | 'date' | 'location';
}

export interface UseIdeationProps {
  onComplete?: (summary: string) => void;
  maxQuestions?: number;
}

export interface UseIdeationReturn {
  // State
  businessIdea: string;
  sessionId: string | null;
  questions: DynamicQuestion[];
  currentQuestionIndex: number;
  isGeneratingQuestions: boolean;
  isComplete: boolean;
  finalSummary: string;
  error: IdeationAgentApiError | null;
  isApiHealthy: boolean;
  isLoadingSummary: boolean;
  
  // Actions
  setBusinessIdea: (idea: string) => void;
  startJourney: () => Promise<void>;
  updateAnswer: (questionIndex: number, answer: string) => void;
  requestKeywords: (questionIndex: number) => Promise<void>;
  requestSuggestion: (questionIndex: number, keywords: string[]) => Promise<void>;
  submitAnswer: (questionIndex: number) => Promise<void>;
  resetFromIndex: (index: number) => Promise<void>;
  resetOnboarding: () => void;
  generateSummary: () => Promise<void>;
  
  // Utilities
  getCurrentQuestion: () => DynamicQuestion | null;
  canProceed: (questionIndex: number) => boolean;
  getSessionState: () => Promise<void>;
}

export function useIdeation({
  onComplete,
  maxQuestions = 10
}: UseIdeationProps = {}): UseIdeationReturn {
  // Core state
  const [businessIdea, setBusinessIdea] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<DynamicQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [finalSummary, setFinalSummary] = useState('');
  const [error, setError] = useState<IdeationAgentApiError | null>(null);
  const [isApiHealthy, setIsApiHealthy] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Check API health on mount
  useEffect(() => {
    checkApiHealth().then(setIsApiHealthy);
  }, []);

  // Convert backend questions to frontend format
  const convertQuestions = useCallback((backendQuestions: QuestionData[]): DynamicQuestion[] => {
    return backendQuestions.map((q, index) => ({
      index,
      question: q.question,
      answer: q.response || undefined,
      keywords: q.keywords || undefined,
      isSatisfactory: q.is_satisfactory,
      satisfactionReason: q.satisfaction_reason || undefined,
      type: 'textarea' as const // Default type for AI-generated questions
    }));
  }, []);

  // Helper function to get current question
  const getCurrentQuestion = useCallback((): DynamicQuestion | null => {
    return questions[currentQuestionIndex] || null;
  }, [questions, currentQuestionIndex]);

  // Helper function to check if user can proceed
  const canProceed = useCallback((questionIndex: number): boolean => {
    const question = questions.find(q => q.index === questionIndex);
    return Boolean(question?.answer?.trim());
  }, [questions]);

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Initialize from localStorage if available
  useEffect(() => {
    const savedSessionId = localStorage.getItem('brandorb_session_id');
    const savedBusinessIdea = localStorage.getItem('brandorb_business_idea');
    const savedSummary = localStorage.getItem('brandorb_summary');

    console.log('Initializing from localStorage:', {
      savedSessionId,
      savedBusinessIdea: savedBusinessIdea ? 'exists' : 'missing',
      savedSummary: savedSummary ? 'exists' : 'missing'
    });

    if (savedSessionId && savedBusinessIdea) {
      setSessionId(savedSessionId);
      setBusinessIdea(savedBusinessIdea);
      
      if (savedSummary) {
        setFinalSummary(savedSummary);
        setIsComplete(true);
      }
    }
  }, []);

  // Start the ideation journey by initializing a session
  const startJourney = useCallback(async () => {
    if (!businessIdea.trim() || isGeneratingQuestions) return;

    try {
      setIsGeneratingQuestions(true);
      setError(null);

      // Generate new session ID
      const newSessionId = generateSessionId();
      console.log('Generated session ID:', newSessionId);

      const response = await IdeationAgentService.initSession({
        session_id: newSessionId,
        description: businessIdea
      });

      console.log('Init session response:', response);

      // Set session ID and save to localStorage
      setSessionId(response.session_id);
      localStorage.setItem('brandorb_session_id', response.session_id);
      localStorage.setItem('brandorb_business_idea', businessIdea);

      const convertedQuestions = convertQuestions(response.questions);
      setQuestions(convertedQuestions);
      setCurrentQuestionIndex(0);

      // Check if we're already complete (edge case)
      if (convertedQuestions.length === 0) {
        setIsComplete(true);
        setFinalSummary('Session completed');
        localStorage.setItem('brandorb_summary', 'Session completed');
        onComplete?.('Session completed');
      }
    } catch (err) {
      const apiError = err instanceof IdeationAgentApiError 
        ? err 
        : new IdeationAgentApiError('Failed to start ideation journey');
      setError(apiError);
      console.error('Failed to start ideation journey:', err);
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [businessIdea, isGeneratingQuestions, onComplete, convertQuestions]);

  // Update answer for a specific question (local state only)
  const updateAnswer = useCallback((questionIndex: number, answer: string) => {
    setQuestions(prev => prev.map(q => 
      q.index === questionIndex ? { ...q, answer } : q
    ));
  }, []);

  // Request keywords for a question
  const requestKeywords = useCallback(async (questionIndex: number) => {
    if (!sessionId) return;
    
    const question = questions.find(q => q.index === questionIndex);
    if (!question || question.isLoadingKeywords || question.keywords) return;

    try {
      setQuestions(prev => prev.map(q => 
        q.index === questionIndex ? { ...q, isLoadingKeywords: true } : q
      ));
      setError(null);

      const response = await IdeationAgentService.getKeywords(sessionId, questionIndex);

      setQuestions(prev => prev.map(q => 
        q.index === questionIndex 
          ? { ...q, keywords: response.keywords, isLoadingKeywords: false }
          : q
      ));
    } catch (err) {
      const apiError = err instanceof IdeationAgentApiError 
        ? err 
        : new IdeationAgentApiError('Failed to get keywords');
      setError(apiError);
      console.error('Failed to get keywords:', err);
      
      setQuestions(prev => prev.map(q => 
        q.index === questionIndex ? { ...q, isLoadingKeywords: false } : q
      ));
    }
  }, [sessionId, questions]);

  // Request AI suggestion for an answer
  const requestSuggestion = useCallback(async (questionIndex: number, keywords: string[]) => {
    if (!sessionId) {
      console.error('No session ID available for suggestion request');
      return;
    }
    
    console.log('Requesting suggestion with session ID:', sessionId, 'for question:', questionIndex);
    
    const question = questions.find(q => q.index === questionIndex);
    if (!question || question.isLoadingSuggestion) return;

    try {
      setQuestions(prev => prev.map(q => 
        q.index === questionIndex ? { ...q, isLoadingSuggestion: true } : q
      ));
      setError(null);

      const response = await IdeationAgentService.suggestAnswer({
        session_id: sessionId,
        question_index: questionIndex,
        selected_keywords: keywords
      });

      console.log('Suggestion response:', response);

      setQuestions(prev => prev.map(q => 
        q.index === questionIndex 
          ? { 
              ...q, 
              suggestedAnswer: response.answer,
              answer: response.answer, // Auto-apply the suggested answer
              isLoadingSuggestion: false,
              isSatisfactory: undefined, // Reset satisfaction status for new AI-generated answer
              satisfactionReason: undefined // Clear any previous feedback
            }
          : q
      ));
    } catch (err) {
      const apiError = err instanceof IdeationAgentApiError 
        ? err 
        : new IdeationAgentApiError('Failed to get suggestion');
      setError(apiError);
      console.error('Failed to get suggestion:', err);
      
      setQuestions(prev => prev.map(q => 
        q.index === questionIndex ? { ...q, isLoadingSuggestion: false } : q
      ));
    }
  }, [sessionId, questions]);

  // Submit answer and get next question
  const submitAnswer = useCallback(async (questionIndex: number) => {
    if (!sessionId) return;
    
    const question = questions.find(q => q.index === questionIndex);
    if (!question?.answer?.trim()) return;

    try {
      setIsGeneratingQuestions(true);
      setError(null);

      const response = await IdeationAgentService.submitAnswer({
        session_id: sessionId,
        question_index: questionIndex,
        response: question.answer
      });

      // Update the question's satisfaction status
      setQuestions(prev => prev.map(q => 
        q.index === questionIndex 
          ? { 
              ...q, 
              isSatisfactory: response.question_satisfaction.is_satisfactory,
              satisfactionReason: response.question_satisfaction.reason
            }
          : q
      ));

      // Check for specific completion signal from backend
      if (response.question === "NO_MORE_QUESTIONS_NEEDED" || 
          (response.question && response.question.includes("NO_MORE_QUESTIONS_NEEDED"))) {
        // Backend explicitly signals completion - go to dashboard with summary
        setIsComplete(true);
        return; // Exit early to trigger dashboard navigation
      }

      // If there's a new question, add it to the list
      if (response.has_more_questions && response.question && 
          response.question !== "NO_MORE_QUESTIONS_NEEDED" && 
          !response.question.includes("NO_MORE_QUESTIONS_NEEDED")) {
        const newQuestion: DynamicQuestion = {
          index: questions.length,
          question: response.question,
          type: 'textarea'
        };
        
        setQuestions(prev => [...prev, newQuestion]);
        setCurrentQuestionIndex(questions.length);
      } else if (!response.has_more_questions && !response.question) {
        // No more questions AND no new question = check if all questions are satisfactory
        // This means either:
        // 1. We need to improve unsatisfactory answers, or
        // 2. We're truly done (backend decides when to stop generating questions)
        
        // Update current question satisfaction status first
        const updatedQuestions = questions.map(q => 
          q.index === questionIndex 
            ? { 
                ...q, 
                isSatisfactory: response.question_satisfaction.is_satisfactory,
                satisfactionReason: response.question_satisfaction.reason
              }
            : q
        );
        
        // Check if this was the backend's way of saying "we're done"
        // The backend stops generating questions when it decides the session is complete
        const allQuestionsAnswered = updatedQuestions.every(q => q.answer?.trim());
        const hasAnyUnsatisfactoryQuestions = updatedQuestions.some(q => q.isSatisfactory === false);
        
        // Only complete if all questions are answered and we have no unsatisfactory ones
        // OR if the backend explicitly signals completion (no new question generated after satisfactory answers)
        if (allQuestionsAnswered && !hasAnyUnsatisfactoryQuestions) {
          // Don't generate summary here anymore - will be done separately with loading screen
          setIsComplete(true);
          // Don't call onComplete with local summary - will be called after backend summary
        }
        // Otherwise, just continue - user needs to improve unsatisfactory answers
      }
    } catch (err) {
      const apiError = err instanceof IdeationAgentApiError 
        ? err 
        : new IdeationAgentApiError('Failed to submit answer');
      setError(apiError);
      console.error('Failed to submit answer:', err);
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [sessionId, questions, onComplete]);

  // Get current session state from backend
  const getSessionState = useCallback(async () => {
    if (!sessionId) return;

    try {
      setError(null);
      const response = await IdeationAgentService.getSession(sessionId);
      const convertedQuestions = convertQuestions(response.questions);
      setQuestions(convertedQuestions);
      setBusinessIdea(response.description);
    } catch (err) {
      const apiError = err instanceof IdeationAgentApiError 
        ? err 
        : new IdeationAgentApiError('Failed to get session state');
      setError(apiError);
      console.error('Failed to get session state:', err);
    }
  }, [sessionId, convertQuestions]);

  // Reset questions from a specific index
  const resetFromIndex = useCallback(async (index: number) => {
    if (!sessionId) return;

    try {
      setIsGeneratingQuestions(true);
      setError(null);

      const response = await IdeationAgentService.resetSession({
        session_id: sessionId,
        index
      });

      const convertedQuestions = convertQuestions(response.questions);
      setQuestions(convertedQuestions);
      setCurrentQuestionIndex(Math.min(index, convertedQuestions.length - 1));
      setIsComplete(false);
      setFinalSummary('');
    } catch (err) {
      const apiError = err instanceof IdeationAgentApiError 
        ? err 
        : new IdeationAgentApiError('Failed to reset session');
      setError(apiError);
      console.error('Failed to reset session:', err);
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [sessionId, convertQuestions]);

  // Reset the entire ideation flow
  const resetOnboarding = useCallback(() => {
    // Delete session if exists
    if (sessionId) {
      IdeationAgentService.deleteSession(sessionId).catch(console.error);
    }
    // Remove from localStorage
    localStorage.removeItem('brandorb_session_id');
    localStorage.removeItem('brandorb_business_idea');
    localStorage.removeItem('brandorb_summary');
    setBusinessIdea('');
    setSessionId(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setIsGeneratingQuestions(false);
    setIsComplete(false);
    setFinalSummary('');
    setError(null);
  }, [sessionId]);

  // Generate summary from the backend
  const generateSummary = useCallback(async () => {
    if (!sessionId) {
      console.error('No session ID available for summary generation');
      return;
    }

    try {
      setIsLoadingSummary(true);
      setError(null);

      console.log('Generating summary with image for session:', sessionId);
      
      // Use the new endpoint that includes image generation
      const response = await IdeationAgentService.getSummaryWithImage(sessionId);
      
      console.log('Summary with image response:', response);

      setFinalSummary(response.summary);
      localStorage.setItem('brandorb_summary', response.summary);

      if (onComplete) {
        onComplete(response.summary);
      }

      setIsComplete(true);
    } catch (err) {
      const apiError = err instanceof IdeationAgentApiError 
        ? err 
        : new IdeationAgentApiError('Failed to generate summary');
      setError(apiError);
      console.error('Failed to generate summary:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [sessionId, onComplete]);

  return {
    // State
    businessIdea,
    sessionId,
    questions,
    currentQuestionIndex,
    isGeneratingQuestions,
    isComplete,
    finalSummary,
    error,
    isApiHealthy,
    isLoadingSummary,
    
    // Actions
    setBusinessIdea,
    startJourney,
    updateAnswer,
    requestKeywords,
    requestSuggestion,
    submitAnswer,
    resetFromIndex,
    resetOnboarding,
    generateSummary,
    
    // Utilities
    getCurrentQuestion,
    canProceed,
    getSessionState
  };
}
