"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Palette, Sparkles, ArrowRight, RefreshCw, Wand2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { generateBrandNames, generateLogoPalettes, generateLogo } from "@/services/agents";
import LottieLoader from "@/components/ui/lottie-loader";

interface BrandWizardProps {
  businessData: any;
  onComplete: (brandData: any) => void;
}

export default function BrandWizard({ businessData, onComplete }: BrandWizardProps) {
  const [mounted, setMounted] = useState(false);
  const [brandData, setBrandData] = useState({
    name: '',
    personality: [] as string[],
    colors: [] as string[],
    logoUrl: '',
    customDescription: ''
  });

  // Loading states
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const [isLoadingPalettes, setIsLoadingPalettes] = useState(false);
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);

  // Data states
  const [brandNames, setBrandNames] = useState<string[]>([]);
  const [colorPalettes, setColorPalettes] = useState<any[]>([]);
  const [selectedPalette, setSelectedPalette] = useState<any>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoRetryCount, setLogoRetryCount] = useState(0);
  const [hasSettingsChanged, setHasSettingsChanged] = useState(false);

  // Custom name input
  const [customNamePrompt, setCustomNamePrompt] = useState('');

  // Brand personality options
  const personalityOptions = [
    { label: 'Professional', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
    { label: 'Creative', color: 'bg-purple-100 text-purple-800 hover:bg-purple-200' },
    { label: 'Innovative', color: 'bg-green-100 text-green-800 hover:bg-green-200' },
    { label: 'Trustworthy', color: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' },
    { label: 'Friendly', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
    { label: 'Bold', color: 'bg-red-100 text-red-800 hover:bg-red-200' },
    { label: 'Elegant', color: 'bg-pink-100 text-pink-800 hover:bg-pink-200' },
    { label: 'Modern', color: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200' },
    { label: 'Traditional', color: 'bg-amber-100 text-amber-800 hover:bg-amber-200' },
    { label: 'Playful', color: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
    { label: 'Sophisticated', color: 'bg-gray-100 text-gray-800 hover:bg-gray-200' },
    { label: 'Minimalist', color: 'bg-slate-100 text-slate-800 hover:bg-slate-200' }
  ];

  useEffect(() => {
    setMounted(true);
    // Don't auto-load names - wait for user to click
  }, []);



  // Auto-load color palettes when brand name changes
  useEffect(() => {
    if (brandData.name && mounted) {
      const timer = setTimeout(() => {
        loadColorPalettes();
      }, 500); // 0.5 second debounce
      return () => clearTimeout(timer);
    }
  }, [brandData.name, mounted]);

  // Track when settings change to enable logo generation button
  useEffect(() => {
    if (brandData.name && brandData.colors.length > 0 && brandData.personality.length > 0) {
      setHasSettingsChanged(true);
      setLogoError(null); // Clear any previous errors when settings change
    }
  }, [brandData.name, brandData.colors, brandData.personality, brandData.customDescription]);

  const loadBrandNames = async () => {
    try {
      setIsLoadingNames(true);
      const businessDescription = businessData?.summary || "Business";
      const response = await generateBrandNames(businessDescription);
      setBrandNames(response.names || []);
      toast.success('Brand names generated successfully!');
    } catch (error) {
      console.error('Error loading brand names:', error);
      toast.error('Failed to generate brand names');
    } finally {
      setIsLoadingNames(false);
    }
  };

  const generateCustomNames = async () => {
    if (!customNamePrompt.trim()) {
      toast.error('Please enter a prompt for name generation');
      return;
    }

    try {
      setIsLoadingNames(true);
      const customPrompt = `Generate brand names based on this idea: "${customNamePrompt}". Business context: ${businessData?.summary || "General business"}`;
      const response = await generateBrandNames(customPrompt);
      setBrandNames(response.names || []);
      toast.success('Custom brand names generated!');
    } catch (error) {
      console.error('Error generating custom names:', error);
      toast.error('Failed to generate custom brand names');
    } finally {
      setIsLoadingNames(false);
    }
  };

  const loadColorPalettes = async () => {
    if (!brandData.name) return;
    
    try {
      setIsLoadingPalettes(true);
      const businessDescription = `${brandData.name}: ${businessData?.summary || ""}`;
      const response = await generateLogoPalettes(businessDescription);
      
      // Handle nested palettes structure from backend
      if (response?.success && response?.palettes?.palettes) {
        setColorPalettes(response.palettes.palettes.map((p: any) => ({
          name: p.name,
          colors: p.colors,
          description: p.description
        })));
      } else if (response?.palettes && Array.isArray(response.palettes)) {
        // Handle direct palettes array
        setColorPalettes(response.palettes.map((p: any) => ({
          name: p.name,
          colors: p.colors,
          description: p.description
        })));
      } else {
        throw new Error('No palettes received from backend');
      }
    } catch (error) {
      console.error('Error loading color palettes:', error);
      toast.error('Failed to generate color palettes');
    } finally {
      setIsLoadingPalettes(false);
    }
  };

  const generateLogoManually = async () => {
    if (!brandData.name || !brandData.colors.length || !brandData.personality.length) {
      toast.error('Please complete all required sections before generating a logo');
      return;
    }

    try {
      setIsLoadingLogo(true);
      setLogoError(null);
      setLogoRetryCount(prev => prev + 1);
      setHasSettingsChanged(false); // Reset settings changed state
      
      const businessDescription = `${brandData.name}: ${businessData?.summary || ""}`;
      const logoDescription = brandData.customDescription || 
        `modern ${brandData.personality.join(', ')} logo for ${brandData.name}`;
      
      const logoData = await generateLogo({
        business_description: businessDescription,
        logo_description: logoDescription,
        color_palette: brandData.colors
      });

      if (logoData.success && logoData.url) {
        setBrandData(prev => ({ ...prev, logoUrl: logoData.url || '' }));
        toast.success('Logo generated successfully!');
      } else {
        const errorMsg = logoData.error || 'Failed to generate logo';
        setLogoError(errorMsg);
        if (errorMsg.includes('timeout')) {
          toast.error('Logo generation is taking longer than expected. Please try again.');
        } else {
          toast.error('Failed to generate logo. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error generating logo:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate logo';
      setLogoError(errorMsg);
      if (errorMsg.includes('timeout') || errorMsg.includes('500')) {
        toast.error('Logo generation timed out. Please try again with a simpler description.');
      } else {
        toast.error('Failed to generate logo. Please try again.');
      }
    } finally {
      setIsLoadingLogo(false);
    }
  };

  const retryLogoGeneration = () => {
    generateLogoManually();
  };

  const handleNameSelection = useCallback((name: string) => {
    setBrandData(prev => ({ ...prev, name }));
    setHasSettingsChanged(true);
  }, []);

  const togglePersonality = useCallback((personality: string) => {
    setBrandData(prev => {
      const newPersonalities = prev.personality.includes(personality)
        ? prev.personality.filter(p => p !== personality)
        : [...prev.personality, personality];
      return { ...prev, personality: newPersonalities };
    });
    setHasSettingsChanged(true);
  }, []);

  const selectColorPalette = useCallback((palette: any) => {
    setSelectedPalette(palette);
    setBrandData(prev => ({ ...prev, colors: palette.colors }));
    setHasSettingsChanged(true);
  }, []);

  const handleCustomDescriptionChange = useCallback((description: string) => {
    setBrandData(prev => ({ ...prev, customDescription: description }));
    setHasSettingsChanged(true);
  }, []);

  const canComplete = useMemo(() => {
    return brandData.name && brandData.colors.length > 0 && brandData.personality.length > 0 && brandData.logoUrl;
  }, [brandData]);

  const handleComplete = () => {
    if (canComplete) {
      const completeBrandData = {
        ...brandData,
        businessSummary: businessData?.summary,
        selectedPalette,
        createdAt: new Date().toISOString()
      };
      onComplete(completeBrandData);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LottieLoader size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Loading brand wizard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="gradient-text">Brand Identity</span>
            <span className="text-surface"> Creator</span>
          </h1>
          <p className="text-lg text-surface-muted">Create your brand identity with AI assistance</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Brand Controls (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Generate Brand Names Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-surface/30 backdrop-blur-sm border-surface/20 hover:border-surface/40 transition-colors shadow-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-surface">Brand Names</span>
                  </CardTitle>
                  <p className="text-sm text-surface-muted">
                    Enter your own brand name or generate AI-powered suggestions
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Custom Name Input */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter your brand name idea..."
                        value={brandData.name && !brandNames.includes(brandData.name) ? brandData.name : ''}
                        onChange={(e) => handleNameSelection(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => {
                          const currentName = brandData.name;
                          if (currentName && !brandNames.includes(currentName)) {
                            toast.success(`Brand name "${currentName}" confirmed!`);
                            setHasSettingsChanged(true);
                          }
                        }}
                        disabled={!brandData.name || brandNames.includes(brandData.name) || isLoadingLogo}
                        size="sm"
                        variant={brandData.name && !brandNames.includes(brandData.name) ? "default" : "outline"}
                        className="px-4"
                      >
                        {brandData.name && !brandNames.includes(brandData.name) ? (
                          <>
                            <Sparkles className="w-3 h-3 mr-1" />
                            Confirm
                          </>
                        ) : (
                          'Confirm'
                        )}
                      </Button>
                    </div>
                    
                    {brandData.name && !brandNames.includes(brandData.name) && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span>✓ Custom name ready to confirm</span>
                      </div>
                    )}
                    
                    <div className="border-t border-border pt-4">
                      <p className="text-sm font-medium mb-2">Or generate names with AI:</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Describe your logo idea (e.g., 'mountain with coffee cup', 'geometric tech symbol')"
                          value={customNamePrompt}
                          onChange={(e) => setCustomNamePrompt(e.target.value)}
                          className="flex-1"
                          disabled={isLoadingLogo}
                        />
                        <Button
                          onClick={generateCustomNames}
                          disabled={isLoadingNames || !customNamePrompt.trim() || isLoadingLogo}
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-white"
                        >
                          {isLoadingNames ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="flex pt-4 gap-2 mt-2">
                        <Button
                          onClick={loadBrandNames}
                          variant="outline"
                          size="sm"
                          disabled={isLoadingNames || isLoadingLogo}
                        >
                          {isLoadingNames ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4 mr-2" />
                              Suggest Names Randomly
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Generated Names Grid */}
                  {isLoadingNames ? (
                    <div className="space-y-3">
                      <div className="text-center py-8">
                        <LottieLoader size="md" className="mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">Generating creative brand names...</p>
                      </div>
                    </div>
                  ) : brandNames.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Generated suggestions:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {brandNames.map((name, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Button
                              variant={brandData.name === name ? "default" : "outline"}
                              onClick={() => handleNameSelection(name)}
                              className="w-full h-auto p-3 justify-start text-sm font-medium"
                              disabled={isLoadingLogo}
                            >
                              {name}
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                      <div className="flex justify-center">
                        <Button
                          onClick={customNamePrompt ? generateCustomNames : loadBrandNames}
                          variant="outline"
                          size="sm"
                          disabled={isLoadingNames}
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingNames ? 'animate-spin' : ''}`} />
                          Generate More
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>

            {/* Brand Personality Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="bg-surface/30 backdrop-blur-sm border-surface/20 hover:border-surface/40 transition-colors shadow-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-surface">Brand Personality</span>
                  </CardTitle>
                  <p className="text-sm text-surface-muted">
                    Select traits that represent your brand
                  </p>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    {personalityOptions.map((option) => (
                      <Button
                        key={option.label}
                        variant={brandData.personality.includes(option.label) ? "default" : "outline"}
                        onClick={() => togglePersonality(option.label)}
                        className="h-auto p-2 text-sm transition-all duration-200"
                        size="sm"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  
                  {brandData.personality.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm font-medium mb-2">Selected Traits:</p>
                      <div className="flex flex-wrap gap-1">
                        {brandData.personality.map((p) => (
                          <Badge key={p} variant="secondary" className="text-xs text-white">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Color Palette Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-surface/30 backdrop-blur-sm border-surface/20 hover:border-surface/40 transition-colors shadow-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <Palette className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-surface">Color Palette</span>
                  </CardTitle>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-surface-muted">
                      Choose colors that reflect your brand
                    </p>
                    {colorPalettes.length > 0 && (
                      <Button
                        onClick={loadColorPalettes}
                        variant="outline"
                        size="sm"
                        disabled={isLoadingPalettes || !brandData.name}
                        className="text-xs"
                      >
                        {isLoadingPalettes ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Regenerate
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  {isLoadingPalettes ? (
                    <div className="text-center py-8">
                      <LottieLoader size="md" className="mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">Generating color palettes...</p>
                    </div>
                  ) : colorPalettes.length > 0 ? (
                    <div className="space-y-3">
                      {colorPalettes.map((palette, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card
                            className={`cursor-pointer transition-all ${
                              selectedPalette?.name === palette.name
                                ? 'ring-2 ring-offset-blue-500 bg-primary/5 dark:bg-primary/10 shadow-md'
                                : 'hover:bg-accent dark:hover:bg-accent/50 hover:shadow-sm'
                            }`}
                            onClick={() => selectColorPalette(palette)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center space-x-3">
                                <div className="flex space-x-1">
                                  {palette.colors.map((color: string, colorIndex: number) => (
                                    <div
                                      key={colorIndex}
                                      className="w-12 h-12 rounded-md shadow-sm"
                                      style={{ backgroundColor: color }}
                                      title={color}
                                    />
                                  ))}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{palette.name}</h4>
                                  <p className="text-xs text-muted-foreground">{palette.description}</p>
                                </div>
                                {selectedPalette?.name === palette.name && (
                                  <Badge variant="default" className="text-xs text-white">Selected</Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : brandData.name ? (
                    <div className="text-center py-8">
                      <LottieLoader size="md" className="mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">Generating palettes for {brandData.name}...</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-sm">Enter a brand name first to generate color palettes</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Logo Style Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-surface/30 backdrop-blur-sm border-surface/20 hover:border-surface/40 transition-colors shadow-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-surface">Logo Style</span>
                  </CardTitle>
                  <p className="text-sm text-surface-muted">
                    Describe your ideal logo (optional)
                  </p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <Textarea
                      placeholder="e.g., minimalist mountain icon, modern geometric design, elegant script font..."
                      value={brandData.customDescription}
                      onChange={(e) => handleCustomDescriptionChange(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Describe your preferred logo style and design elements
                      </p>
                      {brandData.customDescription.trim() && (
                        <Button
                          onClick={() => {
                            toast.success('Logo style preferences saved!');
                            setHasSettingsChanged(true);
                          }}
                          size="sm"
                          variant="default"
                          className="text-xs bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Apply Style
                        </Button>
                      )}
                    </div>
                    
                    {brandData.customDescription.trim() && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span>✓ Style preferences: "{brandData.customDescription.slice(0, 50)}{brandData.customDescription.length > 50 ? '...' : ''}"</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>


          </div>

          {/* Right Side - Live Logo Preview (1/3 width, sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-surface/30 backdrop-blur-sm border-surface/20 hover:border-surface/40 transition-colors shadow-card">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl flex items-center justify-center gap-2">
                      <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-surface">Live Logo Preview</span>
                    </CardTitle>
                    <p className="text-sm text-surface-muted">
                      Click the button below to generate your logo
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-square bg-surface/10 backdrop-blur-sm rounded-xl border-2 border-surface/20 overflow-hidden relative shadow-inner">
                      {isLoadingLogo ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-surface/5">
                          <div className="text-center space-y-4">
                            <LottieLoader size="lg" className="mx-auto" />
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Generating your logo...</p>
                              <p className="text-xs text-muted-foreground">This may take up to 2 minutes</p>
                              {logoRetryCount > 1 && (
                                <p className="text-xs text-orange-600 dark:text-orange-400">Attempt {logoRetryCount}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : logoError ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-950/20">
                          <div className="text-center space-y-4 p-6 max-w-xs">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto">
                              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Generation Failed</p>
                              <p className="text-xs text-red-600 dark:text-red-400">{logoError}</p>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={retryLogoGeneration}
                              disabled={isLoadingLogo}
                              variant="outline"
                              className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Try Again
                            </Button>
                          </div>
                        </div>
                      ) : brandData.logoUrl ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                          className="relative w-full h-full"
                        >
                          <img
                            src={brandData.logoUrl}
                            alt="Generated Logo"
                            className="w-full h-full object-contain p-4"
                            onError={() => setLogoError('Failed to load logo image')}
                          />
                          <div className="absolute top-2 right-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={retryLogoGeneration}
                              className="bg-background/80 backdrop-blur-sm hover:bg-background"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/50 to-primary/5">
                          <div className="text-center space-y-4 p-6">
                            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                              <Palette className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">
                                {!brandData.name ? 'Enter your brand name to start' :
                                 !brandData.personality.length ? 'Select personality traits' :
                                 !brandData.colors.length ? 'Choose a color palette' :
                                 'Click "Generate Logo" button to create your logo'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Complete all sections and click the generate button
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Generate Logo Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="mt-6"
                    >
                      <Button
                        onClick={generateLogoManually}
                        disabled={!brandData.name || !brandData.colors.length || !brandData.personality.length || isLoadingLogo}
                        className={`w-full transition-all duration-300 ${
                          hasSettingsChanged && brandData.name && brandData.colors.length && brandData.personality.length
                            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg animate-pulse' 
                            : 'bg-primary hover:bg-primary/90 text-white'
                        }`}
                        size="lg"
                      >
                        {isLoadingLogo ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating Logo...
                          </>
                        ) : hasSettingsChanged && brandData.name && brandData.colors.length && brandData.personality.length ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Regenerate Logo
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Generate Logo
                          </>
                        )}
                      </Button>
                      
                      {(!brandData.name || !brandData.colors.length || !brandData.personality.length) && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Complete all required sections to generate your logo
                        </p>
                      )}
                    </motion.div>

                    {/* Brand Summary */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mt-6 p-5 bg-surface/30 backdrop-blur-sm rounded-lg border border-surface/20 shadow-card space-y-4"
                    >
                      <h3 className="font-semibold flex items-center gap-2 text-surface">
                        <Badge variant="outline" className="text-xs border-surface/30 text-surface bg-surface/10">Summary</Badge>
                        Brand Overview
                      </h3>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-surface-muted">Name:</span>
                          <span className="text-surface font-medium">{brandData.name || 'Not entered'}</span>
                        </div>
                        
                        {brandData.personality.length > 0 && (
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-surface-muted">Personality:</span>
                            <span className="text-right max-w-40 truncate text-surface font-medium" title={brandData.personality.join(', ')}>
                              {brandData.personality.slice(0, 2).join(', ')}
                              {brandData.personality.length > 2 && ` +${brandData.personality.length - 2}`}
                            </span>
                          </div>
                        )}
                        
                        {selectedPalette && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-surface-muted">Colors:</span>
                            <div className="flex items-center gap-2">
                              <div className="flex space-x-1">
                                {selectedPalette.colors.slice(0, 4).map((color: string, index: number) => (
                                  <div
                                    key={index}
                                    className="w-6 h-6 rounded-md  border-white dark:border-gray-700 shadow-md"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-gray-400 dark:text-gray-400">({selectedPalette.name})</span>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="font-medium text-surface-muted">Logo:</span>
                          <span className="text-surface font-medium">
                            {isLoadingLogo ? 'Generating...' : 
                             brandData.logoUrl ? '✓ Generated' : 'Waiting for requirements'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Complete Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-6"
              >
                <Card className="bg-surface/30 backdrop-blur-sm border-surface/20 hover:border-surface/40 transition-colors shadow-card">
                  <CardContent className="p-6">
                    <Button
                      onClick={handleComplete}
                      disabled={!canComplete}
                      className="w-full bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                      size="lg"
                    >
                      Complete Brand Creation
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    
                    <div className="text-xs text-muted-foreground mt-3 space-y-1">
                      <p className="font-medium">Requirements:</p>
                      <div className="grid grid-cols-2 gap-1">
                        <span className={brandData.name ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                          ✓ Brand name {brandData.name ? '✓' : ''}
                        </span>
                        <span className={brandData.personality.length ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                          ✓ Personality {brandData.personality.length ? '✓' : ''}
                        </span>
                        <span className={brandData.colors.length ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                          ✓ Colors {brandData.colors.length ? '✓' : ''}
                        </span>
                        <span className={brandData.logoUrl ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                          ✓ Logo {brandData.logoUrl ? '✓' : ''}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
