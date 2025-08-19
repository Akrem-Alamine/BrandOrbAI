const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export interface AgentOutput {
  output: string;
}

export interface WorkflowStatus {
  ideation: 'completed' | 'available' | 'in_progress' | 'locked';
  viability_assessment: 'completed' | 'available' | 'in_progress' | 'locked';
  swot_analysis: 'completed' | 'available' | 'in_progress' | 'locked';
  bmc: 'completed' | 'available' | 'in_progress' | 'locked';
  brand_identity: 'completed' | 'available' | 'in_progress' | 'locked';
  marketing_strategy: 'completed' | 'available' | 'in_progress' | 'locked';
  pitch_deck: 'completed' | 'available' | 'in_progress' | 'locked';
}

// Workflow Management
export async function getWorkflowStatus(): Promise<WorkflowStatus> {
  // Get from localStorage or default to initial state
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('brandorb_workflow_status');
    if (saved) {
      return JSON.parse(saved);
    }
  }
  
  return {
    ideation: 'completed', // Ideation is always completed since user finished onboarding
    viability_assessment: 'locked',
    swot_analysis: 'locked',
    bmc: 'locked',
    brand_identity: 'locked',
    marketing_strategy: 'locked',
    pitch_deck: 'locked',
  };
}

export function updateWorkflowStatus(status: Partial<WorkflowStatus>): void {
  if (typeof window !== 'undefined') {
    const current = JSON.parse(localStorage.getItem('brandorb_workflow_status') || '{}');
    const updated = { ...current, ...status };
    localStorage.setItem('brandorb_workflow_status', JSON.stringify(updated));
    
    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('workflowUpdated'));
  }
}

export function markStepAsCompleted(step: keyof WorkflowStatus): void {
  if (typeof window !== 'undefined') {
    const current = JSON.parse(localStorage.getItem('brandorb_workflow_status') || '{}');
    
    // Only mark as completed if it's currently available
    if (current[step] === 'available') {
      current[step] = 'completed';
      localStorage.setItem('brandorb_workflow_status', JSON.stringify(current));
      
      // Dispatch custom event to notify components
      window.dispatchEvent(new CustomEvent('workflowUpdated'));
    }
  }
}

export async function runAllAgents(businessIdea: string): Promise<{ message: string }> {
  if (!businessIdea.trim()) {
    throw new Error('Business idea is required');
  }

  const response = await fetch(`${BACKEND_URL}/run-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ business_idea: businessIdea }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to run agents: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  if (!result || result.message !== 'done') {
    throw new Error('Agents execution did not complete successfully');
  }
  
  return result;
}

export async function getBusinessSummary(): Promise<string> {
  try {
    const result = await getAgentOutput('business_summary');
    return result.output;
  } catch (error) {
    // If no business summary file exists, return empty string
    console.log('No business summary found:', error);
    return '';
  }
}

export async function getAgentOutput(agent: string): Promise<AgentOutput> {
  if (!agent) {
    throw new Error('Agent name is required');
  }

  const response = await fetch(`${BACKEND_URL}/agent-output?agent=${agent}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get output for agent: ${agent} - ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  if (!result || !result.output) {
    throw new Error(`No output received from agent: ${agent}`);
  }
  
  return result;
}

export async function runBMCExtraction(): Promise<{ status: string }> {
  const response = await fetch(`${BACKEND_URL}/bmc/run`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to run BMC extraction: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  if (!result || !result.status) {
    throw new Error('BMC extraction did not complete successfully');
  }
  
  return result;
}

export async function getBMCOutput(): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/bmc/output`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get BMC output: ${response.status} - ${errorText}`);
  }
  
  const result = await response.text();
  
  if (!result || result.trim().length === 0) {
    throw new Error('No BMC output received');
  }
  
  return result;
}

export async function runSWOTAnalysis(): Promise<{ message: string; status: string }> {
  const response = await fetch(`${BACKEND_URL}/run-swot`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to run SWOT analysis: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  if (!result || result.status !== 'success') {
    throw new Error('SWOT analysis did not complete successfully');
  }
  
  return result;
}

export async function saveBusinessSummary(summary: string): Promise<{ message: string }> {
  const response = await fetch(`${BACKEND_URL}/save-business-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save business summary: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

export async function runViabilityAssessment(): Promise<{ message: string; status: string; data: any }> {
  const response = await fetch(`${BACKEND_URL}/run-viability`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to run viability assessment: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  if (!result || result.status !== 'success') {
    throw new Error('Viability assessment did not complete successfully');
  }
  
  return result;
}

export async function getViabilityOutput(): Promise<{ data: any }> {
  const response = await fetch(`${BACKEND_URL}/viability-output`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get viability output: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  if (!result || !result.data) {
    throw new Error('No viability assessment data received');
  }
  
  return result;
}

export async function getSWOTOutput(): Promise<{ content: any }> {
  const response = await fetch(`${BACKEND_URL}/swot-output`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get SWOT output: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  if (!result || !result.content) {
    throw new Error('No SWOT output received');
  }
  
  return result;
}

// Helper functions to parse specific outputs
export function parseFinancialAssessment(output: string) {
  try {
    // Try to parse as JSON first
    let jsonData: any = null;
    
    // Handle markdown code blocks
    let cleanOutput = output;
    if (output.includes("```")) {
      const jsonMatch = output.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        cleanOutput = jsonMatch[1];
      }
    }
    
    // Try to parse the cleaned output
    try {
      jsonData = JSON.parse(cleanOutput);
    } catch {
      // If that fails, try to find JSON within the text
      const jsonMatch = cleanOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[0]);
      }
    }
    
    if (jsonData) {
      // Extract financial assessment data from structured JSON
      const fa = jsonData.financial_assessment || jsonData;
      
      const startupCosts = parseInt(fa.estimated_initial_funding?.amount || 
                                   fa.funding_breakdown?.reduce((sum: number, item: any) => 
                                     sum + parseInt(item.amount || 0), 0) || 0);
      
      const monthlyExpenses = parseInt(fa.estimated_monthly_burn_rate?.amount || 
                                      fa.cost_breakdown_monthly?.reduce((sum: number, item: any) => 
                                        sum + parseInt(item.amount || 0), 0) || 0);
      
      const breakEvenMonths = parseInt(fa.estimated_time_to_break_even_months?.months || 0);
      
      const profitMargin = fa.three_year_projections ? 
        (parseFloat(fa.three_year_projections.estimated_annual_profit_y3?.amount || 0) / 
         parseFloat(fa.three_year_projections.estimated_annual_revenue_y3?.amount || 1)) * 100 : 0;
      
      // Generate realistic revenue projections based on business model
      const revenueProjections = [];
      if (fa.cash_flow_projection_annual) {
        // Use existing cash flow data
        for (const year of fa.cash_flow_projection_annual) {
          const yearlyRevenue = parseInt(year.inflow || 0);
          const monthlyRevenue = yearlyRevenue / 12;
          for (let month = 0; month < 12; month++) {
            revenueProjections.push(Math.round(monthlyRevenue * (1 + month * 0.05))); // 5% monthly growth
          }
          if (revenueProjections.length >= 12) break; // Only show first year
        }
      } else {
        // Generate based on break-even and expenses
        const baseRevenue = monthlyExpenses > 0 ? monthlyExpenses * 1.3 : 15000;
        for (let i = 0; i < 12; i++) {
          revenueProjections.push(Math.round(baseRevenue * (1 + (i * 0.08)))); // 8% growth per month
        }
      }
      
      return {
        startup_costs: startupCosts || 200000,
        monthly_expenses: monthlyExpenses || 30000,
        revenue_projections: revenueProjections.length > 0 ? revenueProjections : 
          Array.from({ length: 12 }, (_, i) => Math.round(35000 * (1 + i * 0.08))),
        break_even_month: breakEvenMonths || 9,
        funding_needed: startupCosts || 200000,
        profit_margin: Math.round(profitMargin) || 20,
        roi: parseInt(fa.three_year_projections?.expected_roi_3_years_percent?.percentage || 0) || 200,
        text: output
      };
    }
    
    // Fallback to text parsing if JSON parsing fails
    const lines = output.split('\n');
    let financialData = {
      startup_costs: 0,
      monthly_expenses: 0,
      revenue_projections: [] as number[],
      break_even_month: 0,
      funding_needed: 0,
      profit_margin: 0,
      roi: 0,
      text: output
    };

    // Extract numbers from the text using regex
    for (const line of lines) {
      if (line.toLowerCase().includes('startup') && line.toLowerCase().includes('cost')) {
        const match = line.match(/\$?([\d,]+)/);
        if (match) financialData.startup_costs = parseInt(match[1].replace(/,/g, ''));
      }
      if (line.toLowerCase().includes('monthly') && line.toLowerCase().includes('expense')) {
        const match = line.match(/\$?([\d,]+)/);
        if (match) financialData.monthly_expenses = parseInt(match[1].replace(/,/g, ''));
      }
      if (line.toLowerCase().includes('break') && line.toLowerCase().includes('even')) {
        const match = line.match(/(\d+)/);
        if (match) financialData.break_even_month = parseInt(match[1]);
      }
      if (line.toLowerCase().includes('profit') && line.toLowerCase().includes('margin')) {
        const match = line.match(/(\d+)%/);
        if (match) financialData.profit_margin = parseInt(match[1]);
      }
      if (line.toLowerCase().includes('funding') && line.toLowerCase().includes('need')) {
        const match = line.match(/\$?([\d,]+)/);
        if (match) financialData.funding_needed = parseInt(match[1].replace(/,/g, ''));
      }
      if (line.toLowerCase().includes('roi') || line.toLowerCase().includes('return on investment')) {
        const match = line.match(/(\d+)%/);
        if (match) financialData.roi = parseInt(match[1]);
      }
    }

    // Generate sample revenue projections if not found
    if (financialData.revenue_projections.length === 0) {
      const baseRevenue = financialData.monthly_expenses > 0 ? financialData.monthly_expenses * 1.3 : 15000;
      for (let i = 0; i < 12; i++) {
        financialData.revenue_projections.push(Math.round(baseRevenue * (1 + (i * 0.08)))); // 8% growth per month
      }
    }

    // Set defaults if nothing was extracted
    if (financialData.startup_costs === 0) financialData.startup_costs = 200000;
    if (financialData.monthly_expenses === 0) financialData.monthly_expenses = 30000;
    if (financialData.break_even_month === 0) financialData.break_even_month = 9;
    if (financialData.funding_needed === 0) financialData.funding_needed = 200000;
    if (financialData.profit_margin === 0) financialData.profit_margin = 20;
    if (financialData.roi === 0) financialData.roi = 200;

    return financialData;
  } catch (error) {
    console.error('Error parsing financial assessment:', error);
    return {
      startup_costs: 200000,
      monthly_expenses: 30000,
      revenue_projections: Array.from({ length: 12 }, (_, i) => Math.round(39000 * (1 + i * 0.08))),
      break_even_month: 9,
      funding_needed: 200000,
      profit_margin: 20,
      roi: 200,
      text: output
    };
  }
}

export function parseMarketAnalysis(output: string) {
  const sections = output.split(/#{1,2}\s+/);
  const parsed = {
    marketAnalysis: '',
    competitorAnalysis: '',
    charts: [] as any[]
  };
  
  sections.forEach(section => {
    if (section.toLowerCase().includes('market analysis')) {
      parsed.marketAnalysis = section;
    } else if (section.toLowerCase().includes('competitor')) {
      parsed.competitorAnalysis = section;
    }
  });
  
  // Extract any JSON data for charts
  const jsonMatch = output.match(/\{[\s\S]*\}/g);
  if (jsonMatch) {
    jsonMatch.forEach(json => {
      try {
        parsed.charts.push(JSON.parse(json));
      } catch {}
    });
  }
  
  return parsed;
}

export function parseBMCOutput(output: string) {
  const sections = output.split(/\n\n/);
  const bmc: Record<string, string> = {};
  
  sections.forEach(section => {
    const lines = section.split('\n');
    if (lines.length > 0 && lines[0].endsWith(':')) {
      const key = lines[0].replace(':', '');
      const content = lines.slice(1).join('\n').trim();
      bmc[key] = content;
    }
  });
  
  return bmc;
}

export function parseSWOTOutput(output: any) {
  // Initialize the parsed structure
  const parsed = {
    strengths: '',
    weaknesses: '',
    opportunities: '',
    threats: '',
    fullAnalysis: output
  };
  
  // If output is not a string, convert it or handle it appropriately
  if (typeof output !== 'string') {
    if (typeof output === 'object' && output !== null) {
      // If it's already an object with SWOT structure, use it directly
      if (output.strengths || output.weaknesses || output.opportunities || output.threats) {
        parsed.strengths = Array.isArray(output.strengths) ? output.strengths.join('\n\n') : (output.strengths || '');
        parsed.weaknesses = Array.isArray(output.weaknesses) ? output.weaknesses.join('\n\n') : (output.weaknesses || '');
        parsed.opportunities = Array.isArray(output.opportunities) ? output.opportunities.join('\n\n') : (output.opportunities || '');
        parsed.threats = Array.isArray(output.threats) ? output.threats.join('\n\n') : (output.threats || '');
        return parsed;
      }
      // Try to stringify the object
      output = JSON.stringify(output);
    } else {
      // Convert to string
      output = String(output);
    }
  }
  
  try {
    // Try to parse as JSON first if it looks like JSON
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonData = JSON.parse(jsonMatch[0]);
      
      // Handle structured JSON SWOT data
      if (jsonData.swot_analysis) {
        const swot = jsonData.swot_analysis;
        parsed.strengths = Array.isArray(swot.strengths) ? swot.strengths.join('\n\n') : (swot.strengths || '');
        parsed.weaknesses = Array.isArray(swot.weaknesses) ? swot.weaknesses.join('\n\n') : (swot.weaknesses || '');
        parsed.opportunities = Array.isArray(swot.opportunities) ? swot.opportunities.join('\n\n') : (swot.opportunities || '');
        parsed.threats = Array.isArray(swot.threats) ? swot.threats.join('\n\n') : (swot.threats || '');
      } else if (jsonData.strengths || jsonData.weaknesses || jsonData.opportunities || jsonData.threats) {
        // Direct SWOT structure
        parsed.strengths = Array.isArray(jsonData.strengths) ? jsonData.strengths.join('\n\n') : (jsonData.strengths || '');
        parsed.weaknesses = Array.isArray(jsonData.weaknesses) ? jsonData.weaknesses.join('\n\n') : (jsonData.weaknesses || '');
        parsed.opportunities = Array.isArray(jsonData.opportunities) ? jsonData.opportunities.join('\n\n') : (jsonData.opportunities || '');
        parsed.threats = Array.isArray(jsonData.threats) ? jsonData.threats.join('\n\n') : (jsonData.threats || '');
      }
      
      return parsed;
    }
  } catch (error) {
    // If JSON parsing fails, fall back to text parsing
    console.warn('Failed to parse SWOT as JSON, using text parsing');
  }
  
  // Text-based parsing for markdown or plain text format
  const sections = output.split(/(?:^|\n)(?:#{1,3}\s*|## )/i);
  
  sections.forEach((section: string) => {
    const sectionLower = section.toLowerCase();
    
    if (sectionLower.includes('strength') && !sectionLower.includes('weakness')) {
      parsed.strengths = section.replace(/^strength[s]?[:\s]*/i, '').trim();
    } else if (sectionLower.includes('weakness') && !sectionLower.includes('strength')) {
      parsed.weaknesses = section.replace(/^weakness[es]*[:\s]*/i, '').trim();
    } else if (sectionLower.includes('opportunit')) {
      parsed.opportunities = section.replace(/^opportunit[ies]*[:\s]*/i, '').trim();
    } else if (sectionLower.includes('threat')) {
      parsed.threats = section.replace(/^threat[s]*[:\s]*/i, '').trim();
    }
  });
  
  // If no sections were found, try bullet point parsing
  if (!parsed.strengths && !parsed.weaknesses && !parsed.opportunities && !parsed.threats) {
    const lines = output.split('\n');
    let currentSection = '';
    
    lines.forEach((line: string) => {
      const lineLower = line.toLowerCase().trim();
      
      if (lineLower.includes('strength') && !lineLower.includes('weakness')) {
        currentSection = 'strengths';
      } else if (lineLower.includes('weakness') && !lineLower.includes('strength')) {
        currentSection = 'weaknesses';
      } else if (lineLower.includes('opportunit')) {
        currentSection = 'opportunities';
      } else if (lineLower.includes('threat')) {
        currentSection = 'threats';
      } else if (line.trim() && currentSection) {
        // Add content to current section
        if (parsed[currentSection as keyof typeof parsed]) {
          parsed[currentSection as keyof typeof parsed] += '\n' + line;
        } else {
          parsed[currentSection as keyof typeof parsed] = line;
        }
      }
    });
  }
  
  return parsed;
}

// Image generation types and functions
export interface ImageGenerationRequest {
  business_idea: string;
  business_summary: string;
}

export interface ImageGenerationResponse {
  image_url: string;
  business_idea: string;
  generated_at: string;
  status: string;
  base64_data?: string;
  local_path?: string;
  filename?: string;
  file_size?: number;
  serve_url?: string;  // Direct URL to serve the image
}

export async function generateBusinessImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  const response = await fetch(`${BACKEND_URL}/generate-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate business image');
  }
  
  return response.json();
}

export async function getImageOutput(): Promise<ImageGenerationResponse> {
  const response = await fetch(`${BACKEND_URL}/image-output`);
  
  if (!response.ok) {
    throw new Error('Failed to get image output');
  }
  
  return response.json();
}

// Utility functions for image handling
export function isBase64Image(imageString: string): boolean {
  return imageString.startsWith('data:image/');
}

export function isBlobUrl(imageString: string): boolean {
  return imageString.startsWith('blob:');
}

export function isHttpUrl(imageString: string): boolean {
  return imageString.startsWith('http://') || imageString.startsWith('https://');
}

// Generate a unique hash for business summary content
export function generateSummaryHash(businessIdea: string, businessSummary: string): string {
  const content = `${businessIdea}||${businessSummary}`;
  // Simple hash function for creating unique IDs
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36); // Convert to base36 string
}

// Get image cache key based on summary hash
export function getImageCacheKey(businessIdea: string, businessSummary: string): string {
  const summaryHash = generateSummaryHash(businessIdea, businessSummary);
  return `brandorb_image_${summaryHash}`;
}

export async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error downloading image as base64:', error);
    throw error;
  }
}

// Parse image metadata from summary markdown
export function parseImageFromSummary(summary: string): {
  imageUrl?: string;
  filename?: string;
  generatedAt?: string;
  originalSource?: string;
} | null {
  if (!summary) return null;
  
  const result: any = {};
  
  // Look for the Generated Visual Assets section
  const imageSection = summary.match(/## Generated Visual Assets[\s\S]*?(?=\n## |$)/);
  if (!imageSection) return null;
  
  const imageContent = imageSection[0];
  
  // Extract Background Image URL
  const imageUrlMatch = imageContent.match(/\*\*Background Image URL:\*\*\s*(.+)/);
  if (imageUrlMatch) {
    result.imageUrl = imageUrlMatch[1].trim();
  }
  
  // Extract Image Filename
  const filenameMatch = imageContent.match(/\*\*Image Filename:\*\*\s*(.+)/);
  if (filenameMatch) {
    result.filename = filenameMatch[1].trim();
  }
  
  // Extract Generated timestamp
  const generatedMatch = imageContent.match(/\*\*Generated:\*\*\s*(.+)/);
  if (generatedMatch) {
    result.generatedAt = generatedMatch[1].trim();
  }
  
  // Extract Original Source
  const sourceMatch = imageContent.match(/\*\*Original Source:\*\*\s*(.+)/);
  if (sourceMatch) {
    result.originalSource = sourceMatch[1].trim();
  }
  
  return Object.keys(result).length > 0 ? result : null;
}

// Generate summary with embedded image
export async function generateSummaryWithImage(sessionId: string): Promise<{ summary: string }> {
  const response = await fetch(`${BACKEND_URL}/summary-with-image/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate summary with image');
  }
  
  return response.json();
}

// Brand Identity Types and Functions
export interface BrandChatbotData {
  company_name: string;
  brand_values: string[];
  target_audience: string;
  brand_personality: string;
  visual_preferences: Record<string, any>;
  voice_tone_preferences: string;
  mission_input: string;
  vision_input: string;
}

export interface BrandIdentityRequest {
  business_summary: string;
  chatbot_data?: BrandChatbotData;
}

export interface BrandIdentityResponse {
  status: string;
  message: string;
  analysis_id: string;
  data?: any;
}

export interface ColorPaletteRequest {
  brand_name: string;
  brand_personality: string;
  target_audience: string;
  style_preferences?: string;
}

export interface LogoConceptRequest {
  brand_name: string;
  industry: string;
  brand_personality: string;
  style_preferences?: string;
}

export interface LogoImageRequest {
  concept: string;
  brand_name: string;
  style?: string;
}

export interface BrandAssetsRequest {
  brand_name: string;
  brand_colors: string[];
  logo_style: string;
  asset_types: string[];
}

// Run Brand Identity Analysis
export async function runBrandIdentity(request: BrandIdentityRequest): Promise<BrandIdentityResponse> {
  const response = await fetch(`${BACKEND_URL}/run-brand-identity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to run brand identity analysis: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  if (!result || result.status !== 'success') {
    throw new Error('Brand identity analysis did not complete successfully');
  }
  
  return result;
}

// Get Brand Identity Output
export async function getBrandIdentityOutput(): Promise<{ content: any }> {
  const response = await fetch(`${BACKEND_URL}/brand-identity-output`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get brand identity output: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  // Return result even if content is null (no brand identity exists yet)
  return result;
}

// Generate Brand Color Palettes
export async function generateBrandPalettes(request: ColorPaletteRequest): Promise<{ palettes: any[] }> {
  const response = await fetch(`${BACKEND_URL}/generate-brand-palettes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate brand palettes: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

// Generate Logo Concepts
export async function generateLogoConcepts(request: LogoConceptRequest): Promise<{ concepts: any[] }> {
  const response = await fetch(`${BACKEND_URL}/generate-logo-concepts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate logo concepts: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

// Generate Logo Image
export async function generateLogoImage(request: LogoImageRequest): Promise<{ image_url: string; filename: string }> {
  const response = await fetch(`${BACKEND_URL}/generate-logo-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate logo image: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

// Generate Brand Assets
export async function generateBrandAssets(request: BrandAssetsRequest): Promise<{ assets: any[] }> {
  const response = await fetch(`${BACKEND_URL}/generate-brand-assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate brand assets: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

// List Available Brand Identity Analyses
export async function listBrandIdentityAnalyses(): Promise<{ analyses: any[] }> {
  const response = await fetch(`${BACKEND_URL}/brand-identity-list`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list brand identity analyses: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

// =============================================
// Logo Generation API Functions
// =============================================

export interface LogoColorPalette {
  name: string;
  colors: string[];
  description: string;
  mood: string;
}

export interface LogoSuggestion {
  suggested_styles: string[];
  suggested_keywords: string[];
  style_descriptions: Record<string, string>;
}

export interface LogoGenerationRequest {
  business_description: string;
  logo_description: string;
  color_palette: string[];
  style?: string;
}

export interface LogoGenerationResponse {
  success: boolean;
  url?: string;
  prompt?: string;
  error?: string;
}

// Generate Brand Names
export async function generateBrandNames(business_description: string): Promise<{ success: boolean; names: string[] }> {
  const response = await fetch(`${BACKEND_URL}/logo/generate-names`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ business_description }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate brand names: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

// Generate Color Palettes for Logo
export async function generateLogoPalettes(business_description: string): Promise<{ success: boolean; palettes: { palettes: LogoColorPalette[] } }> {
  const response = await fetch(`${BACKEND_URL}/logo/generate-palettes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ business_description }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate logo palettes: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

// Generate Logo Suggestions
export async function generateLogoSuggestions(business_description: string): Promise<{success: boolean, suggestions: LogoSuggestion}> {
  const response = await fetch(`${BACKEND_URL}/logo/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ business_description }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate logo suggestions: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

// Generate Logo
export async function generateLogo(request: LogoGenerationRequest): Promise<LogoGenerationResponse> {
  const response = await fetch(`${BACKEND_URL}/logo/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate logo: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

// Generate 3D Logo
export async function generate3DLogo(request: LogoGenerationRequest): Promise<LogoGenerationResponse> {
  const response = await fetch(`${BACKEND_URL}/logo/generate-3d`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate 3D logo: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

// =============================================
// Vectorization API Functions
// =============================================

export interface VectorizationRequest {
  imageUrl: string;
  mode?: 'production' | 'preview' | 'test' | 'test_preview';
  maxColors?: number;
  outputFormat?: 'svg' | 'eps' | 'pdf' | 'dxf' | 'png';
}

export interface VectorizationResponse {
  success: boolean;
  vectorizedUrl?: string;
  error?: string;
}

// Vectorize image using Vectorizer.AI
export async function vectorizeImage(request: VectorizationRequest): Promise<VectorizationResponse> {
  try {
    // This would be implemented in the backend to avoid CORS issues
    const response = await fetch(`${BACKEND_URL}/vectorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Vectorization failed: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Vectorization error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// =============================================
// Stock Images API Functions (Pexels)
// =============================================

export interface StockImageRequest {
  query: string;
  perPage?: number;
  page?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
}

export interface StockImageResponse {
  photos: Array<{
    id: number;
    url: string;
    src: {
      original: string;
      large2x: string;
      large: string;
      medium: string;
      small: string;
      portrait: string;
      landscape: string;
      tiny: string;
    };
    photographer: string;
    photographer_url: string;
    alt: string;
  }>;
  total_results: number;
  page: number;
  per_page: number;
}

// Get stock images from Pexels
export async function getStockImages(request: StockImageRequest): Promise<StockImageResponse> {
  const response = await fetch(`${BACKEND_URL}/stock-images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch stock images: ${response.statusText}`);
  }

  return response.json();
}

// =============================================
// Mockup Generation API Functions
// =============================================

export interface MockupRequest {
  logoUrl: string;
  mockupTypes?: string[];
  brandColors?: string[];
}

export interface MockupResponse {
  mockups: Array<{
    id: string;
    name: string;
    imageUrl: string;
    downloadUrl: string;
  }>;
  success: boolean;
  error?: string;
}

// Generate mockups using Dynamic Mockups
export async function generateMockups(request: MockupRequest): Promise<MockupResponse> {
  const response = await fetch(`${BACKEND_URL}/mockups/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate mockups: ${response.statusText}`);
  }

  return response.json();
}

// =============================================
// Brand Guidelines Export Functions
// =============================================

export interface BrandGuidelinesExportRequest {
  brandData: {
    name: string;
    colors: string[];
    personality: string[];
    logoUrl?: string;
    vectorizedLogoUrl?: string;
    businessSummary?: string;
    customDescription?: string;
  };
  format: 'pdf' | 'html' | 'json';
}

export interface BrandGuidelinesExportResponse {
  success: boolean;
  downloadUrl?: string;
  error?: string;
}

// Export brand guidelines
export async function exportBrandGuidelines(request: BrandGuidelinesExportRequest): Promise<BrandGuidelinesExportResponse> {
  const response = await fetch(`${BACKEND_URL}/brand-guidelines/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to export brand guidelines: ${response.statusText}`);
  }

  return response.json();
}

// =============================================
// Marketing Strategy API Functions
// =============================================

export interface MarketingAnalysisRequest {
  competitors: string[];
  business_summary?: string;
  brand_identity?: any;
  viability_data?: any;
}

export interface MarketingAnalysisResponse {
  analysis_id: string;
  status: string;
  linkedin_analysis?: {
    session_id: string;
    status: string;
    companies: string[];
    current_status?: any;
  };
  tiktok_analysis?: {
    session_id: string;
    status: string;
    profiles: string[];
    current_status?: any;
  };
  business_context: {
    summary: string;
    brand_identity: any;
    viability: any;
    market_analysis: string;
    financial_assessment: string;
    swot_analysis: any;
    business_model: string;
  };
}

export interface MarketingInsightsResponse {
  analysis_id: string;
  linkedin_insights?: {
    insights: string;
    rules?: any;
    recommendations?: string[];
  };
  tiktok_insights?: {
    insights: string;
    rules?: any;
    recommendations?: string[];
  };
  combined_strategy?: {
    content_strategy: any;
    timing_strategy: any;
    engagement_tactics: any;
    platform_specific: any;
    business_alignment?: any;
  };
  posting_calendar?: any;
  engagement_heatmap?: any;
  overall_insights?: {
    engagement_metrics?: {
      average_engagement_rate?: string;
      best_posting_times?: {
        linkedin?: any;
        tiktok?: any;
      };
    };
    content_insights?: {
      total_posts?: number;
    };
    strategic_recommendations?: any;
    key_insights?: string[];
  };
}

export interface TopPostsResponse {
  success: boolean;
  data: {
    linkedin_posts: any[];
    tiktok_posts: any[];
  };
  total_linkedin_posts: number;
  total_tiktok_posts: number;
}

export interface AddCompetitorRequest {
  url: string;
  platform: 'linkedin' | 'tiktok';
}

// Start comprehensive marketing analysis
export async function startMarketingAnalysis(request: MarketingAnalysisRequest): Promise<MarketingAnalysisResponse> {
  const response = await fetch(`${BACKEND_URL}/marketing-strategy/comprehensive-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to start marketing analysis: ${error}`);
  }
  
  return response.json();
}

// Get marketing analysis status
export async function getMarketingAnalysisStatus(analysisId: string): Promise<MarketingAnalysisResponse> {
  const response = await fetch(`${BACKEND_URL}/marketing-strategy/analysis/${analysisId}/status`);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get analysis status: ${error}`);
  }
  
  return response.json();
}

// Get comprehensive marketing insights
export async function getMarketingInsights(analysisId: string): Promise<MarketingInsightsResponse> {
  const response = await fetch(`${BACKEND_URL}/marketing-strategy/analysis/${analysisId}/insights`);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get marketing insights: ${error}`);
  }
  
  return response.json();
}

// Get top engaging posts from competitors
export async function getTopEngagingPosts(): Promise<TopPostsResponse> {
  const response = await fetch(`${BACKEND_URL}/marketing-strategy/get-top-posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get top posts: ${error}`);
  }
  
  return response.json();
}

// Add new competitor for analysis
export async function addCompetitor(request: AddCompetitorRequest): Promise<{ success: boolean; competitor: any; message: string }> {
  const response = await fetch(`${BACKEND_URL}/marketing-strategy/add-competitor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add competitor: ${error}`);
  }
  
  return response.json();
}

// =============================================================================
// SOCIAL MEDIA MANAGEMENT API FUNCTIONS
// =============================================================================

export interface SocialMediaPostRequest {
  business_summary: string;
  marketing_insights: any;
  platform: string;
  count: number;
  generate_images: boolean;
  brand_identity?: {
    name?: string;
    colors?: string[];
    personality?: string[];
    customDescription?: string;
    logoUrl?: string;
  };
  include_scheduling?: boolean;
  staggered_loading?: boolean;
}

export interface SocialMediaPostResponse {
  posts: any[];
  scheduled_posts: any[];
  generated_images: any;
}

export interface PlatformStatus {
  [key: string]: {
    configured: boolean;
    missing_fields: string[];
    configured_fields: string[];
    total_fields: number;
  };
}

// Generate social media posts
export async function generateSocialMediaPosts(request: SocialMediaPostRequest): Promise<SocialMediaPostResponse> {
  const response = await fetch(`${BACKEND_URL}/social-media/generate-posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to generate social media posts: ${response.statusText}`);
  }
  
  return response.json();
}

// Get platform configuration status
export async function getPlatformStatus(): Promise<{ platforms: PlatformStatus }> {
  const response = await fetch(`${BACKEND_URL}/social-media/platforms/status`);
  
  if (!response.ok) {
    throw new Error(`Failed to get platform status: ${response.statusText}`);
  }
  
  return response.json();
}

// Get platform setup help
export async function getPlatformHelp(platform: string): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/social-media/platforms/${platform}/help`);
  
  if (!response.ok) {
    throw new Error(`Failed to get platform help: ${response.statusText}`);
  }
  
  return response.json();
}

// Configure platform credentials
export async function configurePlatform(platform: string, config: any): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${BACKEND_URL}/social-media/platforms/${platform}/configure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to configure platform: ${response.statusText}`);
  }
  
  return response.json();
}

// Configure all platform credentials at once
export async function configureAllPlatforms(configurations: Record<string, any>): Promise<{ success: boolean; message: string }> {
  const results = [];
  
  for (const [platform, config] of Object.entries(configurations)) {
    if (config && Object.keys(config).length > 0) {
      try {
        const result = await configurePlatform(platform, config);
        results.push({ platform, ...result });
      } catch (error) {
        results.push({ platform, success: false, message: `Failed to configure ${platform}` });
      }
    }
  }
  
  const allSuccessful = results.every(r => r.success);
  return {
    success: allSuccessful,
    message: allSuccessful 
      ? 'All platforms configured successfully' 
      : `Some platforms failed: ${results.filter(r => !r.success).map(r => r.platform).join(', ')}`
  };
}

// Schedule posts
export async function schedulePosts(posts: any[], platform: string, scheduleType: string = 'optimal', startDate?: string): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/social-media/schedule-posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      posts,
      platform,
      schedule_type: scheduleType,
      start_date: startDate
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to schedule posts: ${response.statusText}`);
  }
  
  return response.json();
}

// Post immediately to social media
export async function postToSocialMedia(postId: string, platform: string, immediate: boolean = true, content?: string, imageData?: string, title?: string): Promise<any> {
  const requestBody: any = {
    post_id: postId,
    platform,
    immediate
  };
  
  // Include content and image data if provided (for posts not yet scheduled)
  if (content) {
    requestBody.content = content;
  }
  if (imageData) {
    requestBody.image_data = imageData;
  }
  if (title) {
    requestBody.title = title;
  }
  
  const response = await fetch(`${BACKEND_URL}/social-media/post-now`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to post to social media: ${response.statusText}`);
  }
  
  return response.json();
}

// Get upcoming posts
export async function getUpcomingPosts(platform?: string, limit: number = 10): Promise<any> {
  const params = new URLSearchParams();
  if (platform) params.append('platform', platform);
  params.append('limit', limit.toString());
  
  const response = await fetch(`${BACKEND_URL}/social-media/upcoming-posts?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get upcoming posts: ${response.statusText}`);
  }
  
  return response.json();
}

// Load business data from output files and brand identity storage
export async function loadBusinessData(): Promise<{ 
  success: boolean; 
  data: any; 
  has_business_summary: boolean;
  has_financial_data: boolean;
  has_market_data: boolean;
  has_legal_data: boolean;
  has_brand_identity_data: boolean;
}> {
  const response = await fetch(`${BACKEND_URL}/social-media/load-business-data`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// Cancel scheduled post
export async function cancelScheduledPost(postId: string): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/social-media/posts/${postId}/cancel`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to cancel scheduled post: ${response.statusText}`);
  }
  
  return response.json();
}

// LinkedIn specific functions
export async function getLinkedInAuthUrl(): Promise<{ auth_url: string }> {
  const response = await fetch(`${BACKEND_URL}/linkedin/auth`);
  
  if (!response.ok) {
    throw new Error(`Failed to get LinkedIn auth URL: ${response.statusText}`);
  }
  
  return response.json();
}

export async function postToLinkedIn(content: string, imageData?: string, accessToken?: string): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/linkedin/post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      image_data: imageData,
      access_token: accessToken
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to post to LinkedIn: ${response.statusText}`);
  }
  
  return response.json();
}

// =============================================
// INVESTOR RECOMMENDATION API FUNCTIONS
// =============================================

export interface InvestorRecommendation {
  rank: number;
  investor_name: string;
  fund_name: string;
  score: number;
  explanation: string;
  logo: string;
  overview: string;
  who_we_are?: string;
  value_add?: string;
  firm_type: string;
  headquarters_address: string;
  funding_requirements: string;
  funding_stages: string[];
  lead_investor?: string;
  check_size: string;
  target_countries: string[];
  team_members: TeamMember[];
  linkedin_link: string;
  website_link: string;
}

export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
}

export interface InvestorAnalysisResponse {
  success: boolean;
  data: {
    recommendations: InvestorRecommendation[];
    readiness_score: number;
    total_investors_analyzed: number;
    top_matches: number;
  };
  message: string;
}

export interface InvestorRequest {
  business_summary: string;
}

// Analyze business for investor recommendations
export async function analyzeForInvestors(businessSummary: string): Promise<InvestorAnalysisResponse> {
  if (!businessSummary.trim()) {
    throw new Error('Business summary is required');
  }

  const response = await fetch(`${BACKEND_URL}/investors/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ business_summary: businessSummary }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to analyze for investors');
  }
  
  return response.json();
}

// Get saved investor recommendations
export async function getInvestorRecommendations(): Promise<InvestorAnalysisResponse> {
  const response = await fetch(`${BACKEND_URL}/investors/recommendations`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to get investor recommendations');
  }
  
  return response.json();
}

// Get all available investors
export async function getAllInvestors(): Promise<{ 
  success: boolean; 
  data: InvestorRecommendation[]; 
  total: number;
  message: string; 
}> {
  const response = await fetch(`${BACKEND_URL}/investors/all`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to get all investors');
  }
  
  return response.json();
}

// Save investor analysis results
export async function saveInvestorAnalysis(analysisData: any): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${BACKEND_URL}/investors/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(analysisData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to save investor analysis');
  }
  
  return response.json();
}
