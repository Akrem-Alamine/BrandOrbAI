'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Image as ImageIcon,
  Palette,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Loader2,
  Settings,
  Eye,
  Copy,
  Sparkles,
  Zap
} from 'lucide-react';

interface AIImageSwitcherProps {
  businessDescription: string;
  brandName: string;
  brandColors: string[];
  onImageSelect?: (imageUrl: string) => void;
}

interface ColorTheme {
  id: string;
  name: string;
  description: string;
  colors: string[];
  gradient: string;
}

interface AIImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  colorTheme: string;
  generated_at: string;
}

const colorThemes: ColorTheme[] = [
  {
    id: 'brand',
    name: 'Brand Colors',
    description: 'Uses your brand color palette',
    colors: [],
    gradient: 'from-blue-500 to-purple-600'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, corporate aesthetic',
    colors: ['#1e40af', '#374151', '#6b7280', '#f8fafc'],
    gradient: 'from-blue-600 to-slate-700'
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Bold and energetic colors',
    colors: ['#dc2626', '#ea580c', '#d97706', '#65a30d'],
    gradient: 'from-red-500 to-orange-500'
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Subtle, monochromatic tones',
    colors: ['#000000', '#404040', '#808080', '#ffffff'],
    gradient: 'from-gray-900 to-gray-400'
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Earth tones and natural colors',
    colors: ['#166534', '#365314', '#92400e', '#7c2d12'],
    gradient: 'from-green-700 to-amber-700'
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Modern, digital-inspired palette',
    colors: ['#0891b2', '#7c3aed', '#e879f9', '#06b6d4'],
    gradient: 'from-cyan-600 to-purple-600'
  }
];

const AIImageSwitcher: React.FC<AIImageSwitcherProps> = ({
  businessDescription,
  brandName,
  brandColors,
  onImageSelect
}) => {
  const [images, setImages] = useState<AIImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColorTheme, setSelectedColorTheme] = useState<ColorTheme>(
    colorThemes.find(theme => theme.id === 'brand') || colorThemes[0]
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Update brand colors theme when brandColors change
  useEffect(() => {
    const brandTheme = colorThemes.find(theme => theme.id === 'brand');
    if (brandTheme && brandColors.length > 0) {
      brandTheme.colors = brandColors;
      setSelectedColorTheme(brandTheme);
    }
  }, [brandColors]);

  // Generate AI images using Pollinations API
  const generateAIImages = async (count: number = 4) => {
    setIsGenerating(true);
    
    try {
      const basePrompt = customPrompt || extractBusinessKeywords(businessDescription);
      const styleVariations = [
        'professional photography',
        'modern digital art',
        'corporate illustration',
        'abstract design'
      ];

      const newImages: AIImage[] = [];
      
      for (let i = 0; i < count; i++) {
        const style = styleVariations[i % styleVariations.length];
        const colorHints = getColorHints(selectedColorTheme);
        
        const fullPrompt = `${basePrompt}, ${style}, ${colorHints}, high quality, professional, ${brandName} brand identity, 4k resolution, clean composition, modern aesthetic`;
        
        // Use Pollinations API
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1024&height=1024&seed=${Date.now() + i}&enhance=true&model=flux`;
        
        const newImage: AIImage = {
          id: `ai_${Date.now()}_${i}`,
          url: imageUrl,
          prompt: fullPrompt,
          style: style,
          colorTheme: selectedColorTheme.id,
          generated_at: new Date().toISOString()
        };
        
        newImages.push(newImage);
      }
      
      setImages(newImages);
      setCurrentImageIndex(0);
      
      if (onImageSelect && newImages.length > 0) {
        onImageSelect(newImages[0].url);
      }
      
      toast.success(`Generated ${count} AI images with ${selectedColorTheme.name} theme!`);
    } catch (error) {
      console.error('Error generating AI images:', error);
      toast.error('Failed to generate AI images');
    } finally {
      setIsGenerating(false);
    }
  };

  // Extract business keywords for AI prompt
  const extractBusinessKeywords = (description: string): string => {
    const keywords = description.toLowerCase().match(/\b(?:technology|business|startup|service|product|innovation|digital|creative|design|marketing|consulting|finance|health|education|food|travel|fashion|fitness|real estate|automotive|entertainment|sports|music|art|photography|retail|restaurant|cafe|hotel|spa|beauty|wellness|coaching|training|development|software|web|mobile|ai|machine learning|data|analytics|ecommerce|saas|fintech|healthtech|edtech|foodtech|proptech|cleantech|biotech|cybersecurity|blockchain|cryptocurrency|social media|content|brand|agency|studio|firm|group|corporation|enterprise)\b/g);
    
    return keywords ? keywords.slice(0, 5).join(' ') : 'modern business professional';
  };

  // Get color hints based on selected theme
  const getColorHints = (theme: ColorTheme): string => {
    if (theme.colors.length === 0) return 'vibrant colors';
    
    const colorDescriptions = theme.colors.map(color => {
      const hex = color.toLowerCase();
      if (hex.includes('blue')) return 'blue tones';
      if (hex.includes('red')) return 'red accents';
      if (hex.includes('green')) return 'green elements';
      if (hex.includes('purple')) return 'purple highlights';
      if (hex.includes('orange')) return 'orange warmth';
      if (hex.includes('yellow')) return 'golden elements';
      if (hex.includes('black') || hex.includes('000000')) return 'dark contrasts';
      if (hex.includes('white') || hex.includes('ffffff')) return 'clean whites';
      return 'color harmony';
    });
    
    return colorDescriptions.slice(0, 3).join(', ');
  };

  // Navigate through images
  const nextImage = () => {
    if (images.length === 0) return;
    const newIndex = (currentImageIndex + 1) % images.length;
    setCurrentImageIndex(newIndex);
    if (onImageSelect) {
      onImageSelect(images[newIndex].url);
    }
  };

  const previousImage = () => {
    if (images.length === 0) return;
    const newIndex = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(newIndex);
    if (onImageSelect) {
      onImageSelect(images[newIndex].url);
    }
  };

  // Select specific image
  const selectImage = (index: number) => {
    setCurrentImageIndex(index);
    if (onImageSelect) {
      onImageSelect(images[index].url);
    }
  };

  // Download current image
  const downloadImage = async () => {
    if (images.length === 0) return;
    
    try {
      const currentImage = images[currentImageIndex];
      const response = await fetch(currentImage.url);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${brandName.toLowerCase().replace(/\s+/g, '_')}_ai_image_${currentImageIndex + 1}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('AI image downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  };

  // Copy image URL
  const copyImageUrl = () => {
    if (images.length === 0) return;
    
    navigator.clipboard.writeText(images[currentImageIndex].url);
    toast.success('Image URL copied to clipboard!');
  };

  const currentImage = images[currentImageIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary px-4 py-2 rounded-full text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          AI Image Generator
        </div>
        
        <h2 className="text-3xl font-bold">
          <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Smart Visual Content
          </span>
        </h2>
        
        <p className="text-surface-muted max-w-2xl mx-auto">
          Generate AI-powered images tailored to your brand identity with customizable color themes and styles.
        </p>
      </div>

      {/* Color Theme Selector */}
      <Card className="bg-surface/40 backdrop-blur-sm border-surface/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-accent" />
              Color Themes
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              {showSettings ? 'Hide' : 'Show'} Settings
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {colorThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedColorTheme(theme)}
                className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                  selectedColorTheme.id === theme.id
                    ? 'border-primary shadow-lg'
                    : 'border-surface/20 hover:border-surface/40'
                }`}
              >
                <div 
                  className={`aspect-square bg-gradient-to-br ${theme.gradient} opacity-90 group-hover:opacity-100 transition-opacity`}
                />
                
                {/* Color dots preview */}
                <div className="absolute inset-2 flex items-end justify-center gap-1 pb-2">
                  {(theme.id === 'brand' ? brandColors : theme.colors).slice(0, 4).map((color, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                
                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm text-white p-1">
                  <p className="text-xs font-medium truncate">{theme.name}</p>
                </div>
                
                {selectedColorTheme.id === theme.id && (
                  <div className="absolute top-1 right-1">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Eye className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <div className="text-sm text-surface-muted bg-surface/20 p-3 rounded-lg border border-surface/10">
            <p><strong>{selectedColorTheme.name}:</strong> {selectedColorTheme.description}</p>
          </div>
          
          {/* Custom Prompt Settings */}
          {showSettings && (
            <div className="space-y-3 pt-4 border-t border-surface/20">
              <label className="block text-sm font-medium text-surface">
                Custom Prompt (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Add specific details for image generation..."
                className="w-full px-3 py-2 bg-surface/20 border border-surface/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                rows={3}
              />
              <p className="text-xs text-surface-muted">
                Leave empty to use auto-generated prompts based on your business description.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="text-center">
        <Button
          onClick={() => generateAIImages(4)}
          disabled={isGenerating}
          className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg px-8 py-3 text-lg"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Magic...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Generate AI Images
            </>
          )}
        </Button>
        
        {images.length > 0 && (
          <Button
            onClick={() => generateAIImages(4)}
            disabled={isGenerating}
            variant="outline"
            className="gap-2 ml-3"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </Button>
        )}
      </div>

      {/* Image Display */}
      {images.length > 0 && (
        <Card className="overflow-hidden bg-surface/40 backdrop-blur-sm border-surface/20">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                AI Generated Images
                <Badge variant="secondary" className="ml-2">
                  {currentImageIndex + 1} of {images.length}
                </Badge>
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyImageUrl}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadImage}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Main Image Display */}
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-surface/20 to-surface/5 rounded-xl overflow-hidden border border-surface/10">
                {currentImage && (
                  <img
                    src={currentImage.url}
                    alt={`AI generated image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={previousImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm rounded-full w-10 h-10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm rounded-full w-10 h-10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
              
              {/* Image Info Overlay */}
              <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm text-white p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">{currentImage.style}</span>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {selectedColorTheme.name}
                  </Badge>
                </div>
                <p className="text-xs opacity-90 line-clamp-2">
                  {currentImage.prompt.substring(0, 100)}...
                </p>
              </div>
            </div>

            {/* Thumbnail Grid */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => selectImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-primary shadow-lg scale-105'
                        : 'border-surface/20 hover:border-surface/40 hover:scale-102'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`AI image ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Image Details */}
            {currentImage && (
              <div className="bg-surface/20 p-4 rounded-lg border border-surface/10">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-surface-muted">Style:</span>
                    <p className="text-surface capitalize">{currentImage.style}</p>
                  </div>
                  <div>
                    <span className="font-medium text-surface-muted">Theme:</span>
                    <p className="text-surface">{selectedColorTheme.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-surface-muted">Generated:</span>
                    <p className="text-surface">
                      {new Date(currentImage.generated_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-surface-muted">Quality:</span>
                    <p className="text-surface">1024x1024 Enhanced</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {images.length === 0 && !isGenerating && (
        <Card className="bg-surface/20 backdrop-blur-sm border-surface/20">
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-surface mb-2">Ready to Create</h3>
            <p className="text-surface-muted mb-4">
              Generate AI-powered images that perfectly match your brand identity and chosen color theme.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-surface-muted">
              <div className="flex items-center gap-1">
                <Palette className="w-4 h-4" />
                Custom Colors
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                AI Enhanced
              </div>
              <div className="flex items-center gap-1">
                <ImageIcon className="w-4 h-4" />
                High Quality
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIImageSwitcher;
