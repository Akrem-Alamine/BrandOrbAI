"use client";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ButtomBar } from "@/components/dashboard/ButtomBar";
import { toast } from "sonner";
import clsx from "clsx";

// Dynamically import react-markdown to avoid SSR issues
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

const bentoColors = [
  "bg-yellow-100/60 dark:bg-yellow-900/10",
  "bg-purple-100/60 dark:bg-purple-900/10",
  "bg-blue-100/60 dark:bg-blue-900/10",
  "bg-pink-100/60 dark:bg-pink-900/10",
  "bg-orange-100/60 dark:bg-orange-900/10",
  "bg-green-100/60 dark:bg-green-900/10",
];

function extractTitlesFromSummary(summary: string): { businessTitle: string; shortTitle: string } {
  if (!summary) return { businessTitle: '', shortTitle: '' };
  
  const lines = summary.split('\n');
  let businessTitle = '';
  let shortTitle = '';
  
  for (const line of lines) {
    if (line.startsWith('**Business Title:**')) {
      businessTitle = line.replace('**Business Title:**', '').trim();
    } else if (line.startsWith('**Short Title:**')) {
      shortTitle = line.replace('**Short Title:**', '').trim();
    }
  }
  
  return { businessTitle, shortTitle };
}

function parseSummaryToBlocks(summary: string): { title: string; content: string }[] {
  const blocks: { title: string; content: string }[] = [];
  
  // First, clean up the summary and handle different formats
  let content = summary.trim();
  
  // Remove main title if it starts with #
  content = content.replace(/^#\s+[^\n]+\n/, '');
  
  // Try different parsing approaches in order of preference
  
  // 1. Parse ## markdown headings
  const markdownSections = content.split(/\n##\s+/).filter(s => s.trim());
  if (markdownSections.length > 1) {
    markdownSections.forEach((section, index) => {
      const lines = section.split('\n');
      const title = lines[0].trim();
      const sectionContent = lines.slice(1).join('\n').trim();
      
      if (title && sectionContent) {
        blocks.push({ title, content: sectionContent });
      }
    });
  }
  
  // 2. If no markdown sections, try **bold titles**
  if (blocks.length === 0) {
    // Split by **Title** pattern but keep the titles
    const parts = content.split(/(\*\*[^*]+\*\*)/).filter(s => s.trim());
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      
      if (part.startsWith('**') && part.endsWith('**')) {
        // This is a title
        const title = part.replace(/\*\*/g, '').trim();
        const nextPart = parts[i + 1];
        
        if (nextPart && nextPart.trim()) {
          blocks.push({
            title: title,
            content: nextPart.trim()
          });
        }
      }
    }
  }
  
  // 3. If still no blocks, try to detect common business plan section titles
  if (blocks.length === 0) {
    const commonTitles = [
      'Business Idea',
      'Business Overview', 
      'Executive Summary',
      'Market Analysis',
      'Business Model',
      'Revenue Model',
      'Strengths & Opportunities',
      'Strengths and Opportunities',
      'Challenges & Risks',
      'Challenges and Risks',
      'Strategic Recommendations',
      'Financial Outlook',
      'Financial Analysis',
      'Detailed Analysis',
      'Implementation Plan',
      'Marketing Strategy',
      'Target Market',
      'Competitive Analysis'
    ];
    
    // Find all title positions
    const titleMatches: { title: string; index: number; matchLength: number }[] = [];
    commonTitles.forEach(title => {
      const regex = new RegExp(`(^|\\n)\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:?\\s*\\n`, 'gi');
      let match;
      while ((match = regex.exec(content)) !== null) {
        titleMatches.push({
          title: title,
          index: match.index + match[1].length,
          matchLength: match[0].length - match[1].length
        });
      }
    });
    
    // Sort by position and extract content
    titleMatches.sort((a, b) => a.index - b.index);
    
    for (let i = 0; i < titleMatches.length; i++) {
      const current = titleMatches[i];
      const next = titleMatches[i + 1];
      
      const startIndex = current.index + current.matchLength;
      const endIndex = next ? next.index : content.length;
      
      const sectionContent = content.slice(startIndex, endIndex).trim();
      
      if (sectionContent && sectionContent.length > 10) {
        blocks.push({
          title: current.title,
          content: sectionContent
        });
      }
    }
  }
  
  // 4. Final fallback: split by double line breaks and try to identify sections
  if (blocks.length === 0) {
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
    
    for (const paragraph of paragraphs) {
      const lines = paragraph.split('\n');
      const firstLine = lines[0].trim();
      
      // Check if first line looks like a title (short, no period at end, etc.)
      if (firstLine.length < 50 && !firstLine.endsWith('.') && lines.length > 1) {
        const title = firstLine.replace(/^[\*\#\-\s]+/, '').replace(/[\*\#\-\s]+$/, '');
        const content = lines.slice(1).join('\n').trim();
        
        if (title && content && content.length > 20) {
          blocks.push({ title, content });
        }
      }
    }
  }
  
  // 5. Ultimate fallback: return the whole content as one block
  if (blocks.length === 0) {
    return [{ title: "Business Plan Summary", content: summary }];
  }
  
  return blocks;
}

export default function IdeationPage() {
  // Check for real session data
  const [mounted, setMounted] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageGenerationAttempted, setImageGenerationAttempted] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const router = useRouter();

  const savedSummary = typeof window !== 'undefined' ? localStorage.getItem('brandorb_summary') : null;
  const savedBusinessIdea = typeof window !== 'undefined' ? localStorage.getItem('brandorb_business_idea') : null;
  const hasRealData = savedSummary && savedBusinessIdea;

  useEffect(() => { 
    setMounted(true); 
    
    // Check if validation has already been done by checking if all 3 steps are completed
    if (typeof window !== 'undefined') {
      // Check if all 3 steps have been completed successfully
      const financialData = localStorage.getItem('brandorb_financial_data');
      const marketData = localStorage.getItem('brandorb_market_data');
      const swotData = localStorage.getItem('brandorb_swot_data');
      const bmcData = localStorage.getItem('brandorb_bmc_data');
      
      console.log('Validation check:', {
        financialData: !!financialData,
        marketData: !!marketData,
        swotData: !!swotData,
        bmcData: !!bmcData,
        savedSummary: !!savedSummary,
        savedBusinessIdea: !!savedBusinessIdea
      });
      
      // Validation is complete when we have all 3 main data sets
      const allStepsCompleted = financialData && marketData && swotData && bmcData;
      setValidated(!!allStepsCompleted);
      
      console.log('Validate button should be visible:', !allStepsCompleted && savedSummary && savedBusinessIdea);
      
      // Also check legacy session storage for backward compatibility
      const legacyValidated = sessionStorage.getItem('brandorb_validated') === 'true';
      if (legacyValidated && !allStepsCompleted) {
        // Legacy validation flag exists but data is missing - reset the flag
        sessionStorage.removeItem('brandorb_validated');
      }
      
      // Check for existing image from multiple sources in priority order
      const checkForExistingImage = () => {
        if (!savedSummary || !savedBusinessIdea) return false;
        
        // Import utility functions
        import('@/services/agents').then(({ getImageCacheKey, parseImageFromSummary }) => {
          // 0. FIRST PRIORITY: Check for embedded image URL in summary
          const embeddedImageData = parseImageFromSummary(savedSummary);
          if (embeddedImageData?.imageUrl && !backgroundImage) {
            setBackgroundImage(embeddedImageData.imageUrl);
            console.log('Loaded image from embedded summary metadata:', embeddedImageData.imageUrl);
            
            // Also cache it for quick access
            const summaryImageKey = getImageCacheKey(savedBusinessIdea, savedSummary);
            localStorage.setItem(summaryImageKey, embeddedImageData.imageUrl);
            return;
          }
          
          // 1. Second priority: Check for summary-linked cached image
          const summaryImageKey = getImageCacheKey(savedBusinessIdea, savedSummary);
          const summaryLinkedImage = localStorage.getItem(summaryImageKey);
          
          if (summaryLinkedImage && !backgroundImage) {
            setBackgroundImage(summaryLinkedImage);
            console.log('Loaded summary-linked cached image from localStorage');
            return;
          }
          
          // 2. Third priority: Check if run-all included image data
          try {
            const runAllData = localStorage.getItem('brandorb_run_state') || localStorage.getItem('brandorb_run_data');
            if (runAllData) {
              const parsedData = JSON.parse(runAllData);
              
              // Check if this is the new format with data property
              const stateData = parsedData.data || parsedData;
              
              if (stateData.background_image && stateData.background_image.status === 'success') {
                const imageData = stateData.background_image;
                
                // Priority order: serve_url (direct backend) > base64_data > image_url
                if (imageData.serve_url) {
                  setBackgroundImage(imageData.serve_url);
                  console.log('Loaded image from backend serve URL:', imageData.serve_url);
                  return;
                } else if (imageData.filename) {
                  // Build serve URL from filename if serve_url is not provided
                  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
                  const serveUrl = `${backendUrl}/images/${imageData.filename}`;
                  setBackgroundImage(serveUrl);
                  console.log('Loaded image from constructed serve URL:', serveUrl);
                  return;
                } else if (imageData.base64_data && imageData.base64_data.length > 50) {
                  // Only use base64 if it's actually complete
                  setBackgroundImage(imageData.base64_data);
                  // Cache it with summary-linked key for future use
                  localStorage.setItem(summaryImageKey, imageData.base64_data);
                  console.log('Loaded image from run-all data and cached with summary link');
                  return;
                } else if (imageData.image_url) {
                  setBackgroundImage(imageData.image_url);
                  console.log('Loaded image URL from run-all data');
                  return;
                }
              }
            }
          } catch (error) {
            console.error('Error parsing run-all data:', error);
            toast.error("Data Parsing Error", {
              description: "Unable to parse business analysis data. Some features may not work correctly.",
              duration: 4000,
            });
          }
          
          // 3. Fourth priority: Legacy - check old business-idea-based cache
          const legacyImageKey = `brandorb_image_${savedBusinessIdea}`;
          const legacyCachedImage = localStorage.getItem(legacyImageKey);
          if (legacyCachedImage && !backgroundImage) {
            setBackgroundImage(legacyCachedImage);
            // Migrate to new summary-linked cache
            localStorage.setItem(summaryImageKey, legacyCachedImage);
            // Remove old cache entry
            localStorage.removeItem(legacyImageKey);
            console.log('Migrated legacy cached image to summary-linked cache');
            return;
          }
          
          // 4. No existing image found - need to generate one (only if not already attempted)
          if (!backgroundImage && !imageLoading && !imageGenerationAttempted) {
            console.log('No existing image found, generating new one...');
            setImageGenerationAttempted(true);
            generateNewImage();
          }
        });
      };
      
      // Generate a new image when no cached version exists
      const generateNewImage = async () => {
        if (savedSummary && savedBusinessIdea && !backgroundImage && !imageLoading && !imageGenerationAttempted) {
          setImageLoading(true);
          setImageError(null);
          try {
            // Import the generateBusinessImage function dynamically
            const { generateBusinessImage, getImageCacheKey } = await import('@/services/agents');
            
            const result = await generateBusinessImage({
              business_idea: savedBusinessIdea,
              business_summary: savedSummary
            });
            
            console.log('Image generation result:', result);
            
            // Get the summary-based cache key
            const summaryImageKey = getImageCacheKey(savedBusinessIdea, savedSummary);
            
            // Priority order: serve_url (direct backend) > base64_data > image_url > download and convert
            if (result.serve_url) {
              setBackgroundImage(result.serve_url);
              console.log('Using direct serve URL from backend:', result.serve_url);
              // Cache the serve URL for quick access
              localStorage.setItem(summaryImageKey, result.serve_url);
            } else if (result.filename) {
              // Build serve URL from filename if serve_url is not provided
              const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
              const serveUrl = `${backendUrl}/images/${result.filename}`;
              setBackgroundImage(serveUrl);
              console.log('Using constructed serve URL from filename:', serveUrl);
              // Cache the serve URL
              localStorage.setItem(summaryImageKey, serveUrl);
            } else if (result.base64_data && result.base64_data.length > 50) {
              // Only use base64 if it's actually complete (more than 50 chars)
              setBackgroundImage(result.base64_data);
              console.log('Using base64 image data from backend');
              localStorage.setItem(summaryImageKey, result.base64_data);
            } else if (result.image_url) {
              // Download the image and convert to blob URL as fallback
              try {
                const imageResponse = await fetch(result.image_url);
                if (imageResponse.ok) {
                  const imageBlob = await imageResponse.blob();
                  
                  // Create a local blob URL for the image
                  const localImageUrl = URL.createObjectURL(imageBlob);
                  setBackgroundImage(localImageUrl);
                  console.log('Downloaded and cached background image from URL');
                  
                  // Convert to base64 and save to localStorage for persistence
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64String = reader.result as string;
                    localStorage.setItem(summaryImageKey, base64String);
                  };
                  reader.readAsDataURL(imageBlob);
                } else {
                  console.error('Failed to download image:', imageResponse.statusText);
                  // Fallback to direct URL if download fails
                  setBackgroundImage(result.image_url);
                }
              } catch (downloadError) {
                console.error('Error downloading image:', downloadError);
                // Fallback to direct URL if download fails
                setBackgroundImage(result.image_url);
              }
            }
          } catch (error) {
            console.error('Error generating image:', error);
            setImageError(error instanceof Error ? error.message : 'Failed to generate image');
          } finally {
            setImageLoading(false);
          }
        }
      };
      
      // Start the image checking process
      checkForExistingImage();
      
      // Listen for changes in localStorage to detect validation completion
      const handleStorageChange = () => {
        const financialData = localStorage.getItem('brandorb_financial_data');
        const marketData = localStorage.getItem('brandorb_market_data');
        const swotData = localStorage.getItem('brandorb_swot_data');
        const bmcData = localStorage.getItem('brandorb_bmc_data');
        
        const allStepsCompleted = financialData && marketData && swotData && bmcData;
        if (allStepsCompleted && !validated) {
          console.log('Validation completed detected via localStorage');
          setValidated(true);
          sessionStorage.setItem('brandorb_validated', 'true');
        }
      };
      
      // Listen for storage events
      window.addEventListener('storage', handleStorageChange);
      
      // Also check periodically in case storage events don't fire (same-origin issue)
      const storageCheckInterval = setInterval(handleStorageChange, 1000);
      
      // Cleanup listeners
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(storageCheckInterval);
      };
    }
    
    // Cleanup function to revoke blob URLs (base64 data doesn't need cleanup)
    const cleanup = () => {
      if (backgroundImage && backgroundImage.startsWith('blob:')) {
        URL.revokeObjectURL(backgroundImage);
      }
    };

    return cleanup;
  }, [savedSummary, savedBusinessIdea]); // Remove backgroundImage and imageLoading from dependencies to prevent loops

  // Clean up the summary to remove unwanted sections
  const cleanedSummary = useMemo(() => {
    if (!savedSummary) return '';
    
    let content = savedSummary.trim();
    
    // Remove "Business Summary: Pet ecommerce Platform" section
    content = content.replace(/\*\*Business Summary: {title}\*\*/gi, '');
    
    // Remove the title lines from the content (they'll be displayed separately)
    content = content.replace(/\*\*Business Title:\*\*[^\n]*\n?/gi, '');
    content = content.replace(/\*\*Short Title:\*\*[^\n]*\n?/gi, '');
    
    // Remove the Generated Visual Assets section (this is metadata, not for display)
    content = content.replace(/\n\n---\n\n## Generated Visual Assets[\s\S]*?$/, '');
    
    // Remove any leading/trailing whitespace and extra line breaks
    content = content.replace(/^\s*\n+/, '').replace(/\n+\s*$/, '');
    
    return content;
  }, [savedSummary]);

  // Extract titles from summary
  const { businessTitle, shortTitle } = useMemo(() => {
    return extractTitlesFromSummary(savedSummary || '');
  }, [savedSummary]);

  // Use short title if available, fallback to business title, then savedBusinessIdea
  const displayTitle = shortTitle || businessTitle || savedBusinessIdea || "Your Business Idea";

  const handleValidate = useCallback(async () => {
    // This will be handled by the ButtomBar component
    console.log('Validation started via ButtomBar');
  }, []);

  const clearValidationData = useCallback(() => {
    // Clear all validation-related data for testing
    localStorage.removeItem('brandorb_financial_data');
    localStorage.removeItem('brandorb_market_data');
    localStorage.removeItem('brandorb_swot_data');
    localStorage.removeItem('brandorb_bmc_data');
    localStorage.removeItem('brandorb_run_data');
    localStorage.removeItem('brandorb_run_state');
    sessionStorage.removeItem('brandorb_validated');
    setValidated(false);
    console.log('Validation data cleared');
  }, []);

  const handleValidationComplete = useCallback(() => {
    // Called when all validation steps are completed
    console.log('All validation steps completed!');
    setValidated(true);
    // Optionally set a flag in sessionStorage for persistence
    sessionStorage.setItem('brandorb_validated', 'true');
  }, []);

  const blocks = useMemo(() => (savedSummary ? parseSummaryToBlocks(savedSummary) : []), [savedSummary]);
  
  // Filter out unwanted titles and show remaining blocks as cards
  const contentBlocks = blocks.filter(block => 
    block.title !== "Business Summary: {title}" && 
    block.title !== "Business Overview"
  );

  // Enhanced grid layout: create more interesting bento patterns based on content
  function getCardGridClass(i: number, totalCards: number) {
    // Adjust layout based on total number of cards
    if (totalCards <= 3) {
      // For 3 or fewer cards, make them larger
      return i === 0 ? "md:col-span-2" : "md:col-span-1";
    } else if (totalCards <= 6) {
      // For 4-6 cards, create varied layout
      if (i === 0) return "md:col-span-2"; // First card spans 2 columns
      if (i === totalCards - 1 && totalCards % 2 === 0) return "md:col-span-2"; // Last card spans 2 if even total
      return "md:col-span-1";
    } else {
      // For many cards, create complex bento pattern
      if (i === 0) return "md:col-span-2 lg:col-span-2"; // First card spans 2 columns
      if (i === 1 || i === 2) return "md:col-span-1"; // Second and third normal size
      if (i === 3) return "md:col-span-2 lg:col-span-1"; // Fourth card different size
      if (i % 6 === 4) return "lg:col-span-2"; // Every 5th card spans 2 columns
      if (i % 6 === 5) return "lg:row-span-2"; // Every 6th card spans 2 rows
      return "";
    }
  }

  return (
    <div className="flex flex-col min-h-[70vh] w-full px-4 relative overflow-hidden">
      {/* Show skeleton while data is loading */}
      {!mounted && (
        <div className="w-full max-w-7xl mx-auto flex-1">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header skeleton */}
            <div className="w-full max-w-4xl mx-auto">
              <Card className="rounded-xl shadow-sm border border-border/50 bg-background overflow-hidden p-0">
                <div className="relative h-80 md:h-96 bg-muted animate-pulse rounded-xl flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/30 to-transparent animate-shimmer" />
                  <div className="flex flex-col items-center justify-center h-full space-y-4 relative z-10">
                    <div className="h-12 w-12 bg-muted-foreground/20 animate-pulse rounded-lg"></div>
                    <div className="space-y-2 text-center">
                      <div className="h-6 w-48 bg-muted-foreground/20 animate-pulse rounded"></div>
                      <div className="h-4 w-32 bg-muted-foreground/20 animate-pulse rounded"></div>
                    </div>
                    <div className="flex items-center space-x-1 mt-4">
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Content skeleton */}
            <div className="w-full max-w-4xl mx-auto">
              <Card className="rounded-xl shadow-sm border border-border/50 bg-background overflow-hidden">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Header skeleton */}
                    <div className="space-y-3">
                      <div className="h-8 w-3/4 bg-muted animate-pulse rounded"></div>
                      <div className="h-px bg-border w-full"></div>
                    </div>
                    
                    {/* Paragraph skeletons */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                        <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                        <div className="h-4 w-5/6 bg-muted animate-pulse rounded"></div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                        <div className="h-4 w-4/5 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                    
                    {/* List skeleton */}
                    <div className="space-y-2 ml-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                        <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                        <div className="h-4 w-2/3 bg-muted animate-pulse rounded"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                        <div className="h-4 w-4/5 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>

                    {/* Additional sections */}
                    <div className="space-y-3 pt-4">
                      <div className="h-6 w-1/2 bg-muted animate-pulse rounded"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                        <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                        <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom bar skeleton */}
            <div className="w-full max-w-7xl mx-auto">
              <Card className="rounded-xl border border-border/50 bg-background">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-5 w-32 bg-muted animate-pulse rounded"></div>
                      <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
                    </div>
                    <div className="h-10 w-24 bg-muted animate-pulse rounded-md"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      )}

      {hasRealData && mounted && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="w-full max-w-7xl mx-auto flex-1"
          >
            
            
            {/* Background Image Card */}
            <div className="w-full max-w-4xl mx-auto mb-6">
              <Card className="rounded-xl shadow-sm border border-border/50 bg-background overflow-hidden p-0">
                <div 
                  className="relative h-80 md:h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center justify-center rounded-xl"
                  style={{
                    backgroundImage: backgroundImage && !imageLoading ? `url(${backgroundImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  {/* Enhanced Skeleton loading state */}
                  {imageLoading && (
                    <div className="absolute inset-0 bg-muted animate-pulse">
                      {/* Shimmer overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/30 to-transparent animate-shimmer" />
                      
                      {/* Content skeleton */}
                      <div className="flex flex-col items-center justify-center h-full space-y-4 p-6 relative z-10">
                        {/* Icon placeholder */}
                        <div className="h-12 w-12 bg-muted-foreground/30 animate-pulse rounded-lg"></div>
                        
                        {/* Title skeleton */}
                        <div className="space-y-2 text-center">
                          <div className="h-6 w-48 bg-muted-foreground/30 animate-pulse rounded"></div>
                          <div className="h-4 w-32 bg-muted-foreground/30 animate-pulse rounded"></div>
                        </div>
                        
                        {/* Loading indicator */}
                        <div className="flex items-center space-x-2 mt-4">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground animate-pulse mt-2">
                          Generating visual...
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Show skeleton even when not loading if no image */}
                  {!imageLoading && !backgroundImage && !imageError && (
                    <div className="absolute inset-0 bg-muted/50 animate-pulse">
                      <div className="flex flex-col items-center justify-center h-full space-y-4 p-6">
                        <div className="h-12 w-12 bg-muted-foreground/20 animate-pulse rounded-lg"></div>
                        <div className="space-y-2 text-center">
                          <div className="h-6 w-48 bg-muted-foreground/20 animate-pulse rounded"></div>
                          <div className="h-4 w-32 bg-muted-foreground/20 animate-pulse rounded"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay for better text readability */}
                  {backgroundImage && !imageLoading && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"></div>
                  )}
                  
                  {/* Content overlay */}
                  <div className="relative z-10 text-center">
                    <h2 className={`text-2xl font-bold mb-2 ${backgroundImage && !imageLoading ? 'text-white drop-shadow-lg' : 'text-foreground'}`}>
                      {displayTitle}
                    </h2>
                    <p className={`text-sm ${backgroundImage && !imageLoading ? 'text-white/90 drop-shadow' : 'text-muted-foreground'}`}>
                      Generated on {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* Loading animation */}
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-sm">
                      <div className="flex flex-col items-center space-y-3">
                        {/* Animated loading spinner */}
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-muted rounded-full"></div>
                          <div className="w-12 h-12 border-4 border-primary rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
                        </div>
                        
                        {/* Loading text with typewriter effect */}
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground animate-pulse">
                            Generating visual assets...
                          </p>
                          <div className="flex justify-center space-x-1 mt-2">
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Error state with retry button */}
                  {imageError && !imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-sm">
                      <div className="flex flex-col items-center space-y-4 text-center p-4">
                        <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">
                            Failed to generate image
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {imageError}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={retryLoading}
                          onClick={() => {
                            setRetryLoading(true);
                            setImageError(null);
                            setBackgroundImage(null);
                            setImageGenerationAttempted(false);
                            
                            // Trigger regeneration with updated caching system
                            const generateImage = async () => {
                              if (savedSummary && savedBusinessIdea) {
                                setImageLoading(true);
                                setImageError(null);
                                try {
                                  const { generateBusinessImage, getImageCacheKey } = await import('@/services/agents');
                                  const result = await generateBusinessImage({
                                    business_idea: savedBusinessIdea,
                                    business_summary: savedSummary
                                  });
                                  
                                  // Get the summary-based cache key
                                  const summaryImageKey = getImageCacheKey(savedBusinessIdea, savedSummary);
                                  
                                  // Priority order: serve_url > filename > base64_data > image_url
                                  if (result.serve_url) {
                                    setBackgroundImage(result.serve_url);
                                    console.log('Using direct serve URL from backend:', result.serve_url);
                                    localStorage.setItem(summaryImageKey, result.serve_url);
                                  } else if (result.filename) {
                                    // Build serve URL from filename
                                    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
                                    const serveUrl = `${backendUrl}/images/${result.filename}`;
                                    setBackgroundImage(serveUrl);
                                    console.log('Using constructed serve URL from filename:', serveUrl);
                                    localStorage.setItem(summaryImageKey, serveUrl);
                                  } else if (result.base64_data && result.base64_data.length > 50) {
                                    setBackgroundImage(result.base64_data);
                                    localStorage.setItem(summaryImageKey, result.base64_data);
                                  } else if (result.image_url) {
                                    setBackgroundImage(result.image_url);
                                  }
                                } catch (error) {
                                  setImageError(error instanceof Error ? error.message : 'Failed to generate image');
                                } finally {
                                  setImageLoading(false);
                                  setRetryLoading(false);
                                }
                              } else {
                                setRetryLoading(false);
                              }
                            };
                            generateImage();
                          }}
                        >
                          {retryLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                              Retrying...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Try Again
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Business Plan Content Card */}
            <div className="w-full max-w-4xl mx-auto mb-6">
              <Card className="rounded-xl shadow-sm border border-border/50 bg-background overflow-hidden">
                <CardContent className="p-8 max-w-none text-foreground">
                  {!cleanedSummary ? (
                    /* Enhanced content skeleton with staggered animations */
                    <div className="space-y-6">
                      {/* Header skeleton */}
                      <div className="space-y-3">
                        <div className="h-8 w-3/4 bg-muted animate-pulse"></div>
                        <div className="h-px bg-border w-full"></div>
                      </div>
                      
                      {/* Paragraph skeletons with staggered delays */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-muted animate-pulse animate-delay-100"></div>
                          <div className="h-4 w-full bg-muted animate-pulse animate-delay-200"></div>
                          <div className="h-4 w-5/6 bg-muted animate-pulse animate-delay-300"></div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-muted animate-pulse animate-delay-100"></div>
                          <div className="h-4 w-4/5 bg-muted animate-pulse animate-delay-200"></div>
                        </div>
                      </div>
                      
                      {/* List skeleton */}
                      <div className="space-y-2 ml-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                          <div className="h-4 w-3/4 bg-muted animate-pulse animate-delay-100"></div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                          <div className="h-4 w-2/3 bg-muted animate-pulse animate-delay-200"></div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                          <div className="h-4 w-4/5 bg-muted animate-pulse animate-delay-300"></div>
                        </div>
                      </div>
                      
                      {/* Another section */}
                      <div className="space-y-3 pt-4">
                        <div className="h-6 w-1/2 bg-muted animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-muted animate-pulse animate-delay-100"></div>
                          <div className="h-4 w-full bg-muted animate-pulse animate-delay-200"></div>
                          <div className="h-4 w-3/4 bg-muted animate-pulse animate-delay-300"></div>
                        </div>
                      </div>
                      
                      {/* Final section */}
                      <div className="space-y-3 pt-4">
                        <div className="h-6 w-2/3 bg-muted animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-muted animate-pulse animate-delay-100"></div>
                          <div className="h-4 w-5/6 bg-muted animate-pulse animate-delay-200"></div>
                        </div>
                      </div>

                      {/* Loading indicator at bottom */}
                      <div className="flex items-center justify-center pt-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        </div>
                        <span className="ml-3 text-sm text-muted-foreground animate-pulse">
                          Loading content...
                        </span>
                      </div>
                    </div>
                  ) : (
                    <ReactMarkdown 
                      components={{
                        // GitHub-style headings
                        h1: ({ children }) => <h1 className="text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-semibold text-foreground mb-3 mt-6 pb-1 border-b border-border">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-semibold text-foreground mb-2 mt-4">{children}</h3>,
                        h4: ({ children }) => <h4 className="text-base font-semibold text-foreground mb-2 mt-3">{children}</h4>,
                        h5: ({ children }) => <h5 className="text-sm font-semibold text-foreground mb-2 mt-3">{children}</h5>,
                        h6: ({ children }) => <h6 className="text-sm font-medium text-muted-foreground mb-2 mt-3">{children}</h6>,
                        
                        // GitHub-style paragraphs
                        p: ({ children }) => <p className="mb-4 leading-6 text-foreground">{children}</p>,
                        
                        // GitHub-style lists (no bold, proper spacing)
                        ol: ({ children }) => <ol className="list-decimal ml-6 mb-4 space-y-1">{children}</ol>,
                        ul: ({ children }) => <ul className="list-disc ml-6 mb-4 space-y-1">{children}</ul>,
                        li: ({ children }) => <li className="leading-6 text-foreground">{children}</li>,
                        
                        // GitHub-style emphasis
                        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                        em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                        
                        // GitHub-style code
                        code: ({ children, ...props }) => {
                          const isInline = !props.className?.includes('language-');
                          return isInline ? (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">{children}</code>
                          ) : (
                            <code className="block bg-muted p-3 rounded-md text-sm font-mono text-foreground overflow-x-auto">{children}</code>
                          );
                        },
                        
                        // GitHub-style blockquotes
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-border pl-4 py-1 my-4 text-muted-foreground italic">{children}</blockquote>
                        ),
                        
                        // GitHub-style horizontal rule
                        hr: () => <hr className="my-6 border-t border-border" />,
                        
                        // GitHub-style links
                        a: ({ children, href }) => (
                          <a href={href} className="text-primary hover:underline underline-offset-2">{children}</a>
                        )
                      }}
                    >
                      {cleanedSummary}
                    </ReactMarkdown>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
          
          {/* Bottom Bar integrated within page */}
          <div className="w-full max-w-7xl mx-auto">
            <ButtomBar 
              showValidate={!validated} 
              onValidate={handleValidate}
              onValidationComplete={handleValidationComplete}
            />
          </div>
        </>
      )}

      {/* Show empty state when mounted but no data */}
      {mounted && !hasRealData && (
        <div className="w-full max-w-4xl mx-auto flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <CardContent>
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Business Plan Found</h3>
                  <p className="text-muted-foreground">
                    Please generate a business plan first to view the ideation page.
                  </p>
                </div>
                <Button 
                  onClick={() => router.push('/dashboard')}
                  className="mt-4"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
