'use client';

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getBusinessSummary, markStepAsCompleted, updateWorkflowStatus } from "@/services/agents";
import BrandWizard from "@/components/brand/BrandWizard";
import BrandResults from "@/components/brand/BrandResults";
import Image from "next/image";

export default function BrandIdentityPage() {
  const [businessData, setBusinessData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [brandData, setBrandData] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadBusinessData();
    // Check if there's existing brand data
    const existingBrand = localStorage.getItem('brandorb_brand_data');
    if (existingBrand) {
      setBrandData(JSON.parse(existingBrand));
      setShowResults(true);
    }
  }, []);

  const loadBusinessData = async () => {
    try {
      setIsLoading(true);

      // Load all business data from localStorage and backend
      const businessSummary = localStorage.getItem('brandorb_summary') || await getBusinessSummary();
      const bmcData = localStorage.getItem('brandorb_bmc_data');
      const swotData = localStorage.getItem('brandorb_swot_data');
      const viabilityData = localStorage.getItem('brandorb_viability_data');
      const assessmentData = localStorage.getItem('brandorb_assessment_data');

      // Parse and structure the data
      const data = {
        summary: businessSummary,
        bmc: bmcData ? JSON.parse(bmcData) : null,
        swot: swotData ? JSON.parse(swotData) : null,
        viability: viabilityData ? JSON.parse(viabilityData) : null,
        assessment: assessmentData ? JSON.parse(assessmentData) : null
      };

      setBusinessData(data);
    } catch (error) {
      console.error('Error loading business data:', error);
      toast.error('Failed to load business data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrandComplete = (newBrandData: any) => {
    // Save the brand data to localStorage
    localStorage.setItem('brandorb_brand_data', JSON.stringify(newBrandData));
    
    // Mark step as completed
    markStepAsCompleted('brand_identity');
    updateWorkflowStatus({ 
      brand_identity: 'completed',
      marketing_strategy: 'available'
    });
    
    setBrandData(newBrandData);
    setShowResults(true);
    toast.success('Brand identity created successfully!');
  };

  const handleEditBrand = () => {
    setShowResults(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your business data...</p>
        </div>
      </div>
    );
  }

  // Show results if brand data exists
  if (showResults && brandData) {
    return (
      <div className="min-h-screen bg-background">
        <BrandResults brandData={brandData} onEdit={handleEditBrand} />
      </div>
    );
  }

  // Show brand creation wizard
  return (
    <div className="min-h-screen bg-background">
      {!businessData ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading business information...</p>
          </div>
        </div>
      ) : (
        <BrandWizard businessData={businessData} onComplete={handleBrandComplete} />
      )}
    </div>
  );
}
