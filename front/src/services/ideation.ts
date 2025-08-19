// Ideation Agent API Service
// This service handles all communication with the backend API for ideation and business plan generation

// Types matching the backend Pydantic models
export interface InitSessionRequest {
  session_id: string;
  description: string;
}

export interface AnswerRequest {
  session_id: string;
  question_index: number;
  response: string;
}

export interface SuggestAnswerRequest {
  session_id: string;
  question_index: number;
  selected_keywords: string[];
}

export interface ResetRequest {
  session_id: string;
  index: number;
}

export interface QuestionData {
  question: string;
  response: string | null;
  keywords: string[] | null;
  is_satisfactory: boolean;
  satisfaction_reason: string | null;
}

export interface SessionResponse {
  session_id: string;
  description: string;
  questions: QuestionData[];
  summary?: string;
}

export interface AnswerResponse {
  question: string | null;
  has_more_questions: boolean;
  question_satisfaction: {
    is_satisfactory: boolean;
    reason: string;
  };
}

export interface KeywordsResponse {
  keywords: string[];
}

export interface SuggestAnswerResponse {
  answer: string;
}

export interface SummaryResponse {
  summary: string;
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

// Custom error class for API errors
export class IdeationAgentApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'IdeationAgentApiError';
  }
}

// Utility function for making API requests with error handling
async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: any
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new IdeationAgentApiError(
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof IdeationAgentApiError) {
      throw error;
    }
    
    // Network or parsing errors
    throw new IdeationAgentApiError(
      'Network error or server unavailable',
      0,
      error
    );
  }
}

// Ideation Agent API Service Class
export class IdeationAgentService {
  /**
   * Initialize a new ideation session with business idea
   */
  static async initSession(request: InitSessionRequest): Promise<SessionResponse> {
    return apiRequest<SessionResponse>('/init', 'POST', request);
  }

  /**
   * Submit an answer to a question by index
   */
  static async submitAnswer(request: AnswerRequest): Promise<AnswerResponse> {
    return apiRequest<AnswerResponse>('/respond', 'POST', request);
  }

  /**
   * Get keywords for a specific question
   */
  static async getKeywords(sessionId: string, questionIndex: number): Promise<KeywordsResponse> {
    return apiRequest<KeywordsResponse>(`/keywords/${sessionId}/${questionIndex}`);
  }

  /**
   * Generate suggested answer using keywords
   */
  static async suggestAnswer(request: SuggestAnswerRequest): Promise<SuggestAnswerResponse> {
    return apiRequest<SuggestAnswerResponse>('/suggest', 'POST', request);
  }

  /**
   * Get current session state
   */
  static async getSession(sessionId: string): Promise<SessionResponse> {
    return apiRequest<SessionResponse>(`/session/${sessionId}`);
  }

  /**
   * Get summary for a session
   */
  static async getSummary(sessionId: string): Promise<SummaryResponse> {
    return apiRequest<SummaryResponse>(`/summary/${sessionId}`);
  }

  /**
   * Get summary with embedded image metadata for a session
   */
  static async getSummaryWithImage(sessionId: string): Promise<SummaryResponse> {
    return apiRequest<SummaryResponse>(`/summary-with-image/${sessionId}`, 'POST');
  }

  /**
   * Reset questions after a specific index
   */
  static async resetSession(request: ResetRequest): Promise<SessionResponse> {
    return apiRequest<SessionResponse>('/reset', 'POST', request);
  }

  /**
   * Delete a session
   */
  static async deleteSession(sessionId: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/session/${sessionId}`, 'DELETE');
  }

  /**
   * Health check endpoint
   */
  static async healthCheck(): Promise<{ status: string; service: string }> {
    return apiRequest<{ status: string; service: string }>('/health');
  }
}

// Utility function to check API health
export async function checkApiHealth(): Promise<boolean> {
  try {
    const health = await IdeationAgentService.healthCheck();
    return health.status === 'healthy';
  } catch {
    return false;
  }
}
