import { Button } from "@/components/ui/button";
import { Download, Edit, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  runAllAgents, 
  runSWOTAnalysis, 
  runBMCExtraction, 
  runViabilityAssessment,
  updateWorkflowStatus,
  getAgentOutput,
  getSWOTOutput,
  getBMCOutput,
  getViabilityOutput,
  parseFinancialAssessment,
  parseMarketAnalysis,
  parseSWOTOutput,
  parseBMCOutput
} from "@/services/agents";

export function ButtomBar({ 
  showValidate = true, 
  onValidate, 
  onValidationComplete 
}: { 
  showValidate?: boolean, 
  onValidate?: () => Promise<void>,
  onValidationComplete?: () => void 
}) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleValidate = async () => {
    if (isProcessing) return; // Prevent multiple clicks
    
    setLoading(true);
    setIsProcessing(true);
    
    try {
      // Get business idea from localStorage
      const businessIdea = localStorage.getItem('brandorb_business_idea') || '';
      
      if (!businessIdea) {
        throw new Error('No business idea found');
      }
      
      if (onValidate) {
        await onValidate();
      }
      
      // Step 1: Start all three processes in parallel (set to in_progress)
      setCurrentStep('Initializing analysis processes...');
      updateWorkflowStatus({ 
        viability_assessment: 'in_progress',
        swot_analysis: 'in_progress', 
        bmc: 'in_progress'
      });
      
      // Step 2: Run all agents (Financial, Legal, Market Analysis)
      setCurrentStep('Running financial and market analysis...');
      console.log('Running all agents...');
      const agentResults = await runAllAgents(businessIdea);
      
      // Step 3: Parse and validate financial assessment data
      setCurrentStep('Processing financial data...');
      const financialOutput = await getAgentOutput('financial_assessment');
      const financialData = parseFinancialAssessment(financialOutput.output);
      
      if (!financialData || (!financialData.startup_costs && !financialData.text)) {
        const errorMsg = 'Failed to parse financial assessment data';
        toast.error("Financial Analysis Error", {
          description: "Unable to process financial assessment data. Please try again.",
        });
        throw new Error(errorMsg);
      }
      
      // Step 4: Parse and validate market analysis data
      setCurrentStep('Processing market analysis...');
      const marketOutput = await getAgentOutput('market_analysis_competitors');
      const marketData = parseMarketAnalysis(marketOutput.output);
      
      if (!marketData || (!marketData.marketAnalysis && !marketData.competitorAnalysis)) {
        const errorMsg = 'Failed to parse market analysis data';
        toast.error("Market Analysis Error", {
          description: "Unable to process market analysis data. Please try again.",
        });
        throw new Error(errorMsg);
      }
      
      // Step 5: Run comprehensive viability assessment
      setCurrentStep('Running viability assessment...');
      console.log('Running viability assessment...');
      
      // Save financial and market data before viability assessment
      localStorage.setItem('brandorb_financial_data', JSON.stringify(financialData));
      localStorage.setItem('brandorb_market_data', JSON.stringify(marketData));
      
      await runViabilityAssessment();
      
      // Step 6: Complete viability assessment - make it available
      setCurrentStep('Viability assessment completed...');
      const viabilityOutput = await getViabilityOutput();
      localStorage.setItem('brandorb_viability_data', JSON.stringify(viabilityOutput.data));
      
      updateWorkflowStatus({ 
        viability_assessment: 'completed' // Mark as completed when data is ready
      });
      
      // Step 7: Run SWOT analysis
      setCurrentStep('Running SWOT analysis...');
      console.log('Running SWOT analysis...');
      await runSWOTAnalysis();
      
      // Step 8: Parse and validate SWOT data
      setCurrentStep('Processing SWOT analysis...');
      const swotOutput = await getSWOTOutput();
      const swotData = parseSWOTOutput(swotOutput.content);
      
      if (!swotData || (!swotData.strengths && !swotData.weaknesses && !swotData.opportunities && !swotData.threats)) {
        const errorMsg = 'Failed to parse SWOT analysis data';
        toast.error("SWOT Analysis Error", {
          description: "Unable to process SWOT analysis data. Please try again.",
        });
        throw new Error(errorMsg);
      }
      
      // Step 9: Complete SWOT analysis - make it available
      setCurrentStep('SWOT analysis completed...');
      localStorage.setItem('brandorb_swot_data', JSON.stringify(swotData));
      
      updateWorkflowStatus({ 
        swot_analysis: 'completed' // Mark as completed when data is ready
      });
      
      // Step 10: Run BMC extraction
      setCurrentStep('Generating Business Model Canvas...');
      console.log('Running BMC extraction...');
      await runBMCExtraction();
      
      // Step 11: Parse and validate BMC data
      setCurrentStep('Processing Business Model Canvas...');
      const bmcOutput = await getBMCOutput();
      const bmcData = parseBMCOutput(bmcOutput);
      
      if (!bmcData || Object.keys(bmcData).length === 0) {
        const errorMsg = 'Failed to parse BMC data';
        toast.error("Business Model Canvas Error", {
          description: "Unable to process Business Model Canvas data. Please try again.",
        });
        throw new Error(errorMsg);
      }
      
      // Step 12: Complete BMC - make it available
      setCurrentStep('Business Model Canvas completed...');
      localStorage.setItem('brandorb_bmc_data', JSON.stringify(bmcData));
      
      updateWorkflowStatus({ 
        bmc: 'completed' // Mark as completed when data is ready
      });
      
      setCurrentStep('All analyses completed! You can now review each section.');
      console.log('All analyses completed and ready for user review!');
      
      // Show success toast
      toast.success("Validation Complete", {
        description: "All business analyses have been completed successfully. You can now review each section.",
        duration: 4000,
      });
      
      // Call completion callback to notify parent component
      if (onValidationComplete) {
        onValidationComplete();
      }
      
      // Show success message longer
      setTimeout(() => {
        setCurrentStep('');
        setLoading(false);
        setIsProcessing(false);
        // No automatic page reload - user navigates manually
      }, 2000);
      
    } catch (error) {
      console.error('Validation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      
      // Show error toast
      toast.error("Validation Failed", {
        description: errorMessage,
        duration: 5000,
      });
      
      setCurrentStep(`Error: ${errorMessage}`);
      
      // Reset workflow status on error
      updateWorkflowStatus({ 
        viability_assessment: 'locked',
        swot_analysis: 'locked',
        bmc: 'locked'
      });
      
      // Reset after showing error
      setTimeout(() => {
        setCurrentStep('');
        setLoading(false);
        setIsProcessing(false);
      }, 3000);
    }
  };

  const handleDownload = () => {
    // Get the summary and business idea from localStorage
    const savedSummary = localStorage.getItem('brandorb_summary');
    const savedBusinessIdea = localStorage.getItem('brandorb_business_idea');
    
    if (!savedSummary || !savedBusinessIdea) {
      console.error('No summary data found to download');
      return;
    }

    // Create the content for the download
    const content = `# Business Plan Summary

## Business Idea
${savedBusinessIdea}

## Detailed Analysis
${savedSummary}

---
Generated by BrandOrb AI on ${new Date().toLocaleDateString()}
`;

    // Create a blob and download link
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `business-plan-summary-${new Date().toISOString().split('T')[0]}.md`;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEdit = () => {
    // Redirect to onboarding page to edit answers
    router.push('/onboarding');
  };

  return (
    <div className="w-full h-auto shrink-0 bg-surface dark:bg-surface border-t border-border transition-[width,height] ease-linear">
      {/* Loading Progress Indicator */}
      {loading && currentStep && (
        <div className="px-4 py-2 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{currentStep}</span>
          </div>
        </div>
      )}
      
      {/* Button Bar */}
      <div className="flex items-center gap-2 px-4 py-3 flex-1 justify-end w-full h-12">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDownload}
          disabled={isProcessing}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleEdit}
          disabled={isProcessing}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        {showValidate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleValidate}
            disabled={isProcessing}
            className="bg-primary hover:bg-primary/90 text-white hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Validate
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
