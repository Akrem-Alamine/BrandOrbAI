'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Download, 
  Share2, 
  Edit, 
  Copy, 
  Image as ImageIcon,
  Palette,
  Type,
  Eye,
  FileText,
  Layers,
  Zap,
  Play,
  Loader2,
  Wand2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Image,
  Sparkles
} from 'lucide-react';
import AIImageSwitcher from './AIImageSwitcher';

interface BrandResultsProps {
  brandData: any;
  onEdit: () => void;
}

interface StockImage {
  id: number;
  url: string;
  photographer: string;
  alt: string;
}

interface MockupRender {
  uuid: string;
  imageUrl: string;
  name: string;
}

const BrandResults: React.FC<BrandResultsProps> = ({ brandData, onEdit }) => {
  const [mounted, setMounted] = useState(false);
  const [vectorizedLogo, setVectorizedLogo] = useState<string | null>(null);
  const [logoVariations, setLogoVariations] = useState<any>(null);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [stockImages, setStockImages] = useState<StockImage[]>([]);
  const [mockupRenders, setMockupRenders] = useState<MockupRender[]>([]);
  const [loadingStockImages, setLoadingStockImages] = useState(false);
  const [loadingMockups, setLoadingMockups] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'guidelines' | 'mockups' | 'assets' | 'variations' | 'ai-images'>('guidelines');

  useEffect(() => {
    setMounted(true);
    if (brandData?.businessSummary) {
      loadStockImages(brandData.businessSummary);
    }
  }, [brandData]);

  // Vectorize logo using PURE PYTHON approach (no external dependencies)
  const vectorizeLogo = async () => {
    if (!logoUrl || isVectorizing) return;

    setIsVectorizing(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001'}/vectorize-logo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl: logoUrl,
          method: 'python_svg', // Enhanced Python approach
          target_size: 1200, // Higher resolution
          upscale_factor: 2.0, // Minimum 2x upscaling
          colorCount: 12, // More colors for better analysis
          generateVariations: true, // Create color variations including Grayscale
          createPngVariations: true // Create PNG variations
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.vectorizedLogoUrl) {
          setVectorizedLogo(result.vectorizedLogoUrl);
          
          // Set logo variations if generated
          if (result.logoVariations) {
            setLogoVariations(result.logoVariations);
            const strategy = result.metadata?.strategy || 'pure_python';
            const colorsFound = result.metadata?.colors_found || 0;
            const meaningfulVariations = result.metadata?.meaningful_variations || 0;
            
            toast.success(`🎯 Enhanced Vectorization Complete! Upscaled ${colorsFound} colors, created ${meaningfulVariations} variations including Grayscale (infinite resolution, no blur)!`);
            
            // Log enhanced vectorization details
            console.log('🎯 ENHANCED Vectorization result:', {
              status: result.vectorizationStatus,
              approach: strategy,
              colorsExtracted: colorsFound,
              variationsCreated: meaningfulVariations,
              upscaled: result.metadata?.upscaled || false,
              infiniteResolution: result.metadata?.infinite_resolution || true,
              edgeDetection: result.metadata?.edge_detection || true,
              pixelToVector: result.metadata?.pixel_to_vector || true
            });
          } else {
            toast.success('🎯 Logo vectorized with enhanced upscaling (infinite resolution without blur)!');
          }
        } else {
          throw new Error(result.error || 'Pure Python vectorization failed');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Pure Python vectorization error:', error);
      toast.error(`Failed to vectorize logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsVectorizing(false);
    }
  };

  // Fetch stock images from Pexels
  const loadStockImages = async (query: string) => {
    setLoadingStockImages(true);
    try {
      const searchQuery = extractBusinessKeywords(query);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001'}/stock-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          perPage: 8,
          page: 1,
          orientation: 'landscape'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const images: StockImage[] = data.photos.map((photo: any) => ({
          id: photo.id,
          url: photo.src.medium,
          photographer: photo.photographer,
          alt: photo.alt || 'Stock image'
        }));
        setStockImages(images);
        if (images.length > 0) {
          toast.success(`Found ${images.length} stock images`);
        }
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching stock images:', error);
      toast.error(`Failed to load stock images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingStockImages(false);
    }
  };

  // Extract business keywords for image search
  const extractBusinessKeywords = (summary: string): string => {
    const businessWords = summary.toLowerCase().match(/\b(?:business|company|startup|service|product|technology|app|platform|solution|innovation|digital|creative|design|marketing|consulting|finance|health|education|food|travel|fashion|fitness|real estate|automotive|entertainment|sports|music|art|photography|retail|restaurant|cafe|hotel|spa|beauty|wellness|coaching|training|development|software|web|mobile|ai|machine learning|data|analytics|ecommerce|saas|fintech|healthtech|edtech|foodtech|proptech|cleantech|biotech|cybersecurity|blockchain|cryptocurrency|social media|content|brand|agency|studio|firm|group|corporation|enterprise|inc|llc|ltd|co|services|solutions|systems|network|cloud|automation|robotics|iot|virtual reality|augmented reality|gaming|esports|streaming|podcast|blog|news|media|publishing|journalism|writing|translation|legal|law|accounting|tax|insurance|banking|investment|trading|wealth|management|advisory|consulting|coaching|mentoring|tutoring|online learning|elearning|certification|course|workshop|seminar|conference|event|wedding|party|celebration|catering|delivery|logistics|supply chain|transportation|shipping|freight|warehouse|manufacturing|production|factory|industrial|construction|architecture|interior design|landscaping|gardening|home improvement|cleaning|maintenance|repair|installation|plumbing|electrical|hvac|security|surveillance|alarm|locksmith|pest control|waste management|recycling|energy|renewable|solar|wind|sustainable|green|eco|organic|natural|healthy|nutrition|diet|supplement|pharmacy|medical|dental|veterinary|mental health|therapy|counseling|psychology|psychiatry|addiction|recovery|senior care|childcare|daycare|nanny|pet care|grooming|boarding|training|walking|sitting|veterinary|clinic|hospital|urgent care|lab|diagnostic|imaging|surgery|rehabilitation|physical therapy|occupational therapy|speech therapy|massage|chiropractic|acupuncture|yoga|pilates|meditation|mindfulness|spiritual|religious|nonprofit|charity|foundation|volunteer|community|social|activism|advocacy|politics|government|public|municipal|federal|state|local|county|city|town|village|rural|urban|suburban|metropolitan|international|global|national|regional|domestic|foreign|import|export|trade|commerce|retail|wholesale|distribution|supply|vendor|supplier|manufacturer|producer|creator|maker|artisan|craftsman|artist|designer|developer|programmer|engineer|architect|scientist|researcher|analyst|consultant|advisor|expert|specialist|professional|freelancer|contractor|agency|studio|firm|practice|office|clinic|center|institute|academy|school|college|university|library|museum|gallery|theater|cinema|restaurant|cafe|bar|pub|club|lounge|hotel|motel|inn|resort|spa|salon|barbershop|gym|fitness|yoga|pilates|martial arts|dance|music|instrument|lesson|teacher|instructor|coach|trainer|guide|tour|travel|vacation|holiday|trip|adventure|outdoor|camping|hiking|fishing|hunting|sports|recreation|entertainment|event|party|wedding|celebration|festival|concert|show|performance|theater|comedy|magic|gaming|casino|lottery|betting|gambling|investment|trading|stock|forex|crypto|nft|defi|web3|metaverse|vr|ar|ai|ml|iot|blockchain|saas|paas|iaas|cloud|hosting|domain|website|app|software|platform|tool|service|solution|system|network|database|server|security|backup|recovery|migration|integration|automation|api|sdk|framework|library|plugin|extension|theme|template|design|ui|ux|frontend|backend|fullstack|mobile|android|ios|react|angular|vue|node|python|java|php|ruby|go|rust|swift|kotlin|flutter|xamarin|unity|unreal|blender|photoshop|illustrator|figma|sketch|canva|wordpress|shopify|wix|squarespace|magento|drupal|joomla|prestashop|opencart|woocommerce|stripe|paypal|square|quickbooks|salesforce|hubspot|mailchimp|constant contact|aweber|convertkit|activecampaign|klaviyo|sendgrid|twilio|zoom|slack|teams|discord|telegram|whatsapp|facebook|instagram|twitter|linkedin|youtube|tiktok|snapchat|pinterest|reddit|quora|medium|substack|ghost|notion|airtable|trello|asana|monday|jira|confluence|github|gitlab|bitbucket|docker|kubernetes|aws|azure|gcp|heroku|netlify|vercel|cloudflare|digitalocean|vultr|linode|godaddy|namecheap|bluehost|siteground|hostgator|dreamhost|inmotion|a2hosting)\b/g);
    
    if (businessWords && businessWords.length > 0) {
      return businessWords.slice(0, 3).join(' ');
    }
    
    // Fallback to first few meaningful words
    const words = summary.split(' ').filter(word => word.length > 3).slice(0, 3);
    return words.join(' ') || 'business professional';
  };

  // Generate mockups using Dynamic Mockups
  const generateMockups = async () => {
    if (!vectorizedLogo && !logoUrl) {
      toast.error('Please vectorize logo first or ensure logo is available');
      return;
    }

    setLoadingMockups(true);
    try {
      const logoToUse = vectorizedLogo || logoUrl;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001'}/mockups/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl: logoToUse,
          mockupTypes: ['business-card'],
          brandColors: brandColors
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.mockups) {
          const validMockups = result.mockups.map((mockup: any) => ({
            uuid: mockup.id,
            imageUrl: mockup.imageUrl || mockup.downloadUrl,
            name: mockup.name
          }));
          setMockupRenders(validMockups);
          
          if (validMockups.length > 0) {
            toast.success(`Generated ${validMockups.length} mockups successfully!`);
          } else {
            toast.error('No mockups were generated');
          }
        } else {
          throw new Error(result.error || 'Failed to generate mockups');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating mockups:', error);
      toast.error(`Failed to generate mockups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingMockups(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading brand results...</p>
        </div>
      </div>
    );
  }

  // Defensive data access
  const brandName = brandData?.name || 'Untitled Brand';
  const brandPersonalities = brandData?.personality || [];
  const brandColors = brandData?.colors || [];
  const logoUrl = brandData?.logoUrl || null;
  const selectedPalette = brandData?.selectedPalette || null;
  const customDescription = brandData?.customDescription || null;
  const businessSummary = brandData?.businessSummary || '';
  const createdAt = brandData?.createdAt || new Date().toISOString();

  const downloadLogo = (format: 'png' | 'svg' = 'png') => {
    const logoToDownload = format === 'svg' && vectorizedLogo ? vectorizedLogo : logoUrl;
    
    if (!logoToDownload) {
      toast.error('No logo to download');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = logoToDownload;
      link.download = `${brandName.toLowerCase().replace(/\s+/g, '_')}_logo.${format}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Logo downloaded as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download logo');
    }
  };

  const downloadBrandGuidelines = () => {
    // Generate and download brand guidelines PDF
    const guidelinesContent = `
      Brand Guidelines for ${brandName}
      
      Brand Colors:
      ${brandColors.map((color: string, i: number) => `${i + 1}. ${color}`).join('\n')}
      
      Brand Personality:
      ${brandPersonalities.join(', ')}
      
      Logo Usage:
      - Maintain clear space around logo
      - Use on light and dark backgrounds appropriately
      - Don't stretch or distort the logo
      
      Typography:
      - Use consistent font families across all materials
      - Maintain proper hierarchy and spacing
      
      Generated on: ${new Date().toLocaleDateString()}
    `;

    const blob = new Blob([guidelinesContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${brandName.toLowerCase().replace(/\s+/g, '_')}_brand_guidelines.txt`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Brand guidelines downloaded!');
  };

  const shareBrand = () => {
    if (typeof window !== 'undefined' && navigator.share) {
      navigator.share({
        title: `${brandName} Brand Identity Guidelines`,
        text: `Check out the complete brand identity guidelines for ${brandName}!`,
        url: window.location.href,
      });
    } else if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } else {
      toast.error('Sharing not supported in this browser');
    }
  };

  const copyColorCode = (color: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(color);
      toast.success(`Copied ${color}!`);
    }
  };

  return (
    <>
      <style jsx>{`
        .gradient-text {
          background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8), hsl(var(--accent)));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-surface/20 backdrop-blur-sm border-b border-surface/20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10" />
          <div className="container mx-auto p-6 relative">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium">
                <Zap className="w-4 h-4" />
                AI-Generated Brand Guidelines
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                <span className="gradient-text">{brandName}</span>
              </h1>
              
              <p className="text-lg text-surface-muted max-w-2xl mx-auto">
                {brandPersonalities.join(' • ') || 'A modern, innovative brand identity'}
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-3">
                <Button 
                  onClick={onEdit} 
                  variant="outline" 
                  className="gap-2 border-surface/20 hover:border-surface/40"
                >
                  <Edit className="w-4 h-4" />
                  Edit Brand
                </Button>
                <Button 
                  onClick={shareBrand} 
                  variant="outline" 
                  className="gap-2 border-surface/20 hover:border-surface/40"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
                <Button 
                  onClick={downloadBrandGuidelines} 
                  className="gap-2 bg-primary hover:bg-primary/90 text-white"
                >
                  <Download className="w-4 h-4" />
                  Download Guidelines
                </Button>
              </div>
            </div>
          </div>
        </div>

      {/* Navigation Tabs */}
      <div className="border-b border-surface/20 bg-surface/10 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setSelectedTab('guidelines')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'guidelines'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-surface-muted hover:text-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Brand Guidelines
              </div>
            </button>
            <button
              onClick={() => setSelectedTab('mockups')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'mockups'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-surface-muted hover:text-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Mockups & Applications
              </div>
            </button>
            <button
              onClick={() => setSelectedTab('variations')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'variations'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-surface-muted hover:text-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Logo Variations
                {logoVariations && (
                  <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                    {Object.keys(logoVariations).length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setSelectedTab('assets')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'assets'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-surface-muted hover:text-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Brand Assets
              </div>
            </button>
            <button
              onClick={() => setSelectedTab('ai-images')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'ai-images'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-surface-muted hover:text-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Images
                <Badge variant="secondary" className="bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary text-xs px-2 py-0.5 rounded-full">
                  New
                </Badge>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        {selectedTab === 'guidelines' && (
          <BrandGuidelinesTab
            brandName={brandName}
            brandColors={brandColors}
            brandPersonalities={brandPersonalities}
            logoUrl={logoUrl}
            vectorizedLogo={vectorizedLogo}
            selectedPalette={selectedPalette}
            customDescription={customDescription}
            businessSummary={businessSummary}
            onVectorizeLogo={vectorizeLogo}
            isVectorizing={isVectorizing}
            onDownloadLogo={downloadLogo}
            onCopyColor={copyColorCode}
          />
        )}

        {selectedTab === 'mockups' && (
          <MockupsTab
            mockupRenders={mockupRenders}
            loadingMockups={loadingMockups}
            onGenerateMockups={generateMockups}
            vectorizedLogo={vectorizedLogo}
            logoUrl={logoUrl}
          />
        )}

        {selectedTab === 'variations' && (
          <LogoVariationsTab
            logoVariations={logoVariations}
            vectorizedLogo={vectorizedLogo}
            logoUrl={logoUrl}
            isVectorizing={isVectorizing}
            onVectorizeLogo={vectorizeLogo}
            brandName={brandName}
          />
        )}

        {selectedTab === 'assets' && (
          <BrandAssetsTab
            stockImages={stockImages}
            loadingStockImages={loadingStockImages}
            brandColors={brandColors}
            brandName={brandName}
          />
        )}

        {selectedTab === 'ai-images' && (
          <AIImageSwitcher
            businessDescription={businessSummary}
            brandName={brandName}
            brandColors={brandColors}
            onImageSelect={(imageUrl) => {
              // Optional: handle image selection
              console.log('AI image selected:', imageUrl);
            }}
          />
        )}
      </div>
    </div>
    </>
  );
};

// Brand Guidelines Tab Component
const BrandGuidelinesTab = ({
  brandName,
  brandColors,
  brandPersonalities,
  logoUrl,
  vectorizedLogo,
  selectedPalette,
  customDescription,
  businessSummary,
  onVectorizeLogo,
  isVectorizing,
  onDownloadLogo,
  onCopyColor
}: any) => (
  <div className="space-y-8">
    {/* Bento Grid Layout */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Logo Section - Large */}
      <Card className="lg:col-span-2 lg:row-span-2 overflow-hidden bg-surface/40 backdrop-blur-sm border-surface/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              Logo System
            </CardTitle>
            <Badge variant="secondary" className="bg-accent/20 text-accent">AI Generated</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Display */}
          <div className="aspect-square bg-gradient-to-br from-surface/30 to-surface/10 rounded-2xl flex items-center justify-center p-8 border border-surface/20">
            {logoUrl ? (
              <img
                src={vectorizedLogo || logoUrl}
                alt={`${brandName} Logo`}
                className="max-w-full max-h-full object-contain drop-shadow-lg"
              />
            ) : (
              <div className="text-center text-surface-muted">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Logo not available</p>
              </div>
            )}
          </div>

          {/* Logo Actions */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => onDownloadLogo('png')}
                variant="outline"
                size="sm"
                disabled={!logoUrl}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                PNG
              </Button>
              <Button 
                onClick={() => onDownloadLogo('svg')}
                variant="outline"
                size="sm"
                disabled={!vectorizedLogo}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                SVG
              </Button>
            </div>
            
            <Button
              onClick={onVectorizeLogo}
              disabled={!logoUrl || isVectorizing}
              className="w-full gap-2"
              variant={vectorizedLogo ? "outline" : "default"}
            >
              {isVectorizing ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  🎯 Direct Vectorizing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {vectorizedLogo ? '🎯 Re-vectorize with Enhanced Upscaling' : '🎯 Enhanced Vectorize (Upscale + Pixel-to-Vector)'}
                </>
              )}
            </Button>

            <div className="text-xs text-surface-muted bg-surface/20 p-3 rounded-lg border border-surface/20">
              <p className="font-medium mb-1">🎯 ENHANCED Vectorization Features:</p>
              <ul className="space-y-1">
                <li>• Intelligent 2x upscaling for higher resolution</li>
                <li>• Pixel-to-vector conversion with edge detection</li>
                <li>• Infinite scalability without blur or pixelation</li>
                <li>• 7 meaningful color variations including Grayscale</li>
                <li>• Geometric shape analysis and optimization</li>
                <li>• SVG + PNG format support for all variations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Palette */}
      <Card className="lg:col-span-2 bg-surface/40 backdrop-blur-sm border-surface/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Palette className="w-4 h-4 text-accent" />
            </div>
            Color Palette
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {brandColors.length > 0 ? brandColors.map((color: string, index: number) => (
              <div key={index} className="group cursor-pointer" onClick={() => onCopyColor(color)}>
                <div
                  className="aspect-[4/3] rounded-xl shadow-sm group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: color }}
                />
                <div className="mt-2 text-center">
                  <p className="text-sm font-mono font-medium">{color}</p>
                  <button className="text-xs text-muted-foreground hover:text-foreground group-hover:opacity-100 opacity-0 transition-opacity">
                    Click to copy
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                No colors available
              </div>
            )}
          </div>
          
          {selectedPalette?.description && (
            <div className="mt-4 p-3 bg-surface/20 rounded-lg border border-surface/20">
              <p className="text-sm text-surface-muted">{selectedPalette.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Typography Guidelines */}
      <Card className="bg-surface/40 backdrop-blur-sm border-surface/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Type className="w-4 h-4 text-primary" />
            </div>
            Typography
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-surface-muted">Primary Font</p>
              <p className="text-lg font-bold">Inter</p>
            </div>
            <div>
              <p className="text-sm font-medium text-surface-muted">Secondary Font</p>
              <p className="text-base">System UI</p>
            </div>
          </div>
          
          <div className="text-xs text-surface-muted bg-surface/20 p-3 rounded-lg border border-surface/20">
            <p className="font-medium mb-1">Font Usage:</p>
            <ul className="space-y-1">
              <li>• Headings: Bold weight</li>
              <li>• Body: Regular weight</li>
              <li>• Captions: Light weight</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Brand Voice */}
      <Card className="bg-surface/40 backdrop-blur-sm border-surface/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Eye className="w-4 h-4 text-accent" />
            </div>
            Brand Voice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {brandPersonalities.map((personality: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs border-surface/20">
                {personality}
              </Badge>
            ))}
          </div>
          
          <div className="text-xs text-surface-muted bg-surface/20 p-3 rounded-lg border border-surface/20">
            <p className="font-medium mb-1">Communication Style:</p>
            <p>Professional, approachable, and innovative. Speak with confidence while remaining accessible.</p>
          </div>
        </CardContent>
      </Card>

      {/* Brand Values - Full Width */}
      <Card className="lg:col-span-4 bg-surface/40 backdrop-blur-sm border-surface/20">
        <CardHeader>
          <CardTitle>Brand Identity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-primary">Mission</h4>
              <p className="text-sm text-surface-muted">
                To deliver innovative solutions that transform the way businesses operate and connect with their customers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-accent">Vision</h4>
              <p className="text-sm text-surface-muted">
                To be the leading brand in our industry, known for excellence, innovation, and customer satisfaction.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-secondary">Values</h4>
              <p className="text-sm text-surface-muted">
                Innovation, integrity, excellence, and customer-centricity drive everything we do.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Logo Variations Tab Component
const LogoVariationsTab = ({ logoVariations, vectorizedLogo, logoUrl, isVectorizing, onVectorizeLogo, brandName }: any) => {
  const downloadVariation = (variation: any, variationKey: string) => {
    if (!variation.data_url && !variation.svg_content) {
      toast.error('No variation data available');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = variation.data_url || variation.svg_content;
      
      // Determine file extension
      const issvg = variation.svg_content || variation.data_url?.includes('svg');
      const extension = issvg ? 'svg' : 'png';
      
      link.download = `${brandName.toLowerCase().replace(/\s+/g, '_')}_${variationKey}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${variation.name} downloaded as ${extension.toUpperCase()}!`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download variation');
    }
  };

  if (!logoVariations && !vectorizedLogo) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold">Create Logo Variations</h3>
          <p className="text-surface-muted">
            Vectorize your logo first to generate professional variations including horizontal, vertical, 
            icon-only, wordmark, and one-color versions.
          </p>
          <Button
            onClick={onVectorizeLogo}
            disabled={!logoUrl || isVectorizing}
            className="gap-2"
            size="lg"
          >
            {isVectorizing ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating Variations...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Vectorize & Create Variations
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (!logoVariations) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto">
            <Layers className="w-8 h-8 text-accent" />
          </div>
          <h3 className="text-2xl font-bold">Logo Vectorized</h3>
          <p className="text-surface-muted">
            Your logo has been vectorized but variations weren't generated. 
            Re-vectorize to create professional logo variations.
          </p>
          <Button
            onClick={onVectorizeLogo}
            disabled={isVectorizing}
            className="gap-2"
            size="lg"
          >
            {isVectorizing ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating Variations...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate Logo Variations
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold gradient-text">Logo Variations</h2>
        <p className="text-surface-muted max-w-2xl mx-auto">
          Professional logo variations for different use cases. Each variation is optimized 
          for specific applications and maintains brand consistency across all touchpoints.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(logoVariations).map(([key, variation]: [string, any]) => (
          <Card key={key} className="overflow-hidden bg-surface/40 backdrop-blur-sm border-surface/20 hover:border-surface/40 transition-all duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{variation.name}</CardTitle>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    key === 'primary' ? 'bg-primary/20 text-primary' :
                    key.includes('horizontal') ? 'bg-blue-500/20 text-blue-600' :
                    key.includes('vertical') ? 'bg-green-500/20 text-green-600' :
                    key.includes('icon') ? 'bg-purple-500/20 text-purple-600' :
                    key.includes('wordmark') ? 'bg-orange-500/20 text-orange-600' :
                    'bg-gray-500/20 text-gray-600'
                  }`}
                >
                  {key.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-surface-muted">{variation.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Logo Preview */}
              <div className="aspect-square bg-gradient-to-br from-surface/20 to-surface/5 rounded-xl flex items-center justify-center p-6 border border-surface/10">
                {variation.data_url ? (
                  <img
                    src={variation.data_url}
                    alt={variation.name}
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: key.includes('white') ? 'drop-shadow(0 0 8px rgba(0,0,0,0.3))' : 'none'
                    }}
                  />
                ) : (
                  <div className="text-center text-surface-muted/50">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">Preview not available</p>
                  </div>
                )}
              </div>

              {/* Usage Information */}
              <div className="space-y-3">
                <div className="text-xs text-surface-muted bg-surface/20 p-3 rounded-lg border border-surface/10">
                  <p className="font-medium mb-1">Best Used For:</p>
                  <p>{variation.usage}</p>
                </div>

                {/* Dimensions */}
                {variation.dimensions && (
                  <div className="flex justify-between text-xs text-surface-muted">
                    <span>Dimensions:</span>
                    <span>{variation.dimensions.width} × {variation.dimensions.height}px</span>
                  </div>
                )}

                {/* Download Button */}
                <Button
                  onClick={() => downloadVariation(variation, key)}
                  disabled={!variation.data_url && !variation.svg_content}
                  className="w-full gap-2"
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4" />
                  Download {variation.svg_content ? 'SVG' : 'PNG'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Guidelines */}
      <Card className="bg-surface/20 backdrop-blur-sm border-surface/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Logo Variation Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-surface">Primary Usage</h4>
              <ul className="text-sm text-surface-muted space-y-1">
                <li>• <strong>Primary Logo:</strong> Main logo for general use</li>
                <li>• <strong>Horizontal:</strong> Website headers, email signatures</li>
                <li>• <strong>Vertical:</strong> Social media profiles, mobile apps</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-surface">Specialized Versions</h4>
              <ul className="text-sm text-surface-muted space-y-1">
                <li>• <strong>Icon/Brandmark:</strong> Favicons, app icons</li>
                <li>• <strong>Wordmark:</strong> Minimal applications, watermarks</li>
                <li>• <strong>One-Color:</strong> Photocopying, single-color print</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
            <p className="text-sm text-surface">
              <strong>Pro Tip:</strong> Always maintain proper clear space around your logo (minimum 2x the height of your logo) 
              and never distort or stretch any variation. Use the appropriate variation for each specific context.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Mockups Tab Component
const MockupsTab = ({ mockupRenders, loadingMockups, onGenerateMockups, vectorizedLogo, logoUrl }: any) => (
  <div className="space-y-6">
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-2 gradient-text">Brand Applications</h2>
      <p className="text-surface-muted mb-6">See your logo in real-world contexts</p>
      
      <Button 
        onClick={onGenerateMockups}
        disabled={loadingMockups || (!vectorizedLogo && !logoUrl)}
        className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg"
        size="lg"
      >
        {loadingMockups ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Mockups...
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5" />
            Generate Mockups
          </>
        )}
      </Button>
    </div>

    {mockupRenders.length > 0 && (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockupRenders.map((mockup: any, index: number) => (
          <Card key={mockup.id || index} className="overflow-hidden bg-surface/30 backdrop-blur-sm border-surface/20 hover:border-surface/40 transition-all duration-300 shadow-card group">
            <div className="aspect-[4/3] relative overflow-hidden">
              {mockup.imageUrl ? (
                <img 
                  src={mockup.imageUrl} 
                  alt={mockup.name || 'Mockup'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                  <div className="text-center p-4">
                    <Image className="w-8 h-8 text-surface-muted mx-auto mb-2" />
                    <p className="text-sm text-surface-muted">Preview Loading...</p>
                  </div>
                </div>
              )}
              
              {/* Logo overlay if available */}
              {(vectorizedLogo || logoUrl) && (
                <div className="absolute top-4 right-4 w-12 h-12 bg-white/90 rounded-lg p-2 shadow-sm">
                  <img 
                    src={vectorizedLogo || logoUrl} 
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold text-surface mb-1">{mockup.name || 'Brand Mockup'}</h3>
              <p className="text-sm text-surface-muted mb-3">{mockup.description || 'Professional brand application'}</p>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-surface/20 hover:border-surface/40"
                  onClick={() => window.open(mockup.imageUrl || mockup.downloadUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-surface/20 hover:border-surface/40"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = mockup.downloadUrl || mockup.imageUrl;
                    link.download = `${mockup.name || 'mockup'}.png`;
                    link.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
              
              {/* Vectorization status indicator */}
              {mockup.vectorizationStatus && (
                <div className="mt-2 flex items-center gap-1">
                  {mockup.vectorizationStatus === 'success' ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600">Vectorized Logo</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-amber-600">Original Logo</span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )}

    {mockupRenders.length === 0 && !loadingMockups && (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-surface/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Image className="w-8 h-8 text-surface-muted" />
        </div>
        <h3 className="text-lg font-semibold text-surface mb-2">No Mockups Generated Yet</h3>
        <p className="text-surface-muted">Click "Generate Mockups" to create professional brand applications</p>
      </div>
    )}
  </div>
);

// Brand Assets Tab Component
const BrandAssetsTab = ({ stockImages, loadingStockImages, brandColors, brandName }: any) => (
  <div className="space-y-6">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-2 gradient-text">Brand Assets & Inspiration</h2>
      <p className="text-surface-muted">Curated images that align with your brand identity</p>
    </div>

    {loadingStockImages ? (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-[4/3] bg-surface/20 rounded-lg animate-pulse" />
        ))}
      </div>
    ) : (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stockImages.map((image: StockImage) => (
          <Card key={image.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow bg-surface/40 backdrop-blur-sm border-surface/20">
            <CardContent className="p-0">
              <img
                src={image.url}
                alt={image.alt}
                className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform"
              />
              <div className="p-3">
                <p className="text-xs text-surface-muted">by {image.photographer}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )}

    {/* Color Swatches */}
    <Card className="bg-surface/40 backdrop-blur-sm border-surface/20">
      <CardHeader>
        <CardTitle>Color Applications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          {brandColors.map((color: string, index: number) => (
            <div key={index} className="text-center">
              <div
                className="w-16 h-16 rounded-full shadow-lg mb-2 mx-auto"
                style={{ backgroundColor: color }}
              />
              <p className="text-xs font-mono">{color}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default BrandResults;
