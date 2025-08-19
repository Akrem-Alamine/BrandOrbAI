'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Palette, FileImage, FileText, CheckCircle, AlertCircle, Clock, Download } from 'lucide-react'
import { toast } from 'sonner'

interface BrandIdentityResult {
  success: boolean
  analysis_id?: string
  brand_identity?: any
  metadata?: any
  error?: string
}

interface ServiceStatus {
  logo_service: boolean
  flyer_service: boolean
  orchestrator_service: boolean
}

interface ComprehensiveBrandIdentityProps {
  businessSummary?: string
  brandDiscoveryData?: any
  existingBusinessData?: any
  onComplete?: (result: BrandIdentityResult) => void
}

export default function ComprehensiveBrandIdentity({
  businessSummary = '',
  brandDiscoveryData,
  existingBusinessData,
  onComplete
}: ComprehensiveBrandIdentityProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState('')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<BrandIdentityResult | null>(null)
  const [servicesStatus, setServicesStatus] = useState<ServiceStatus | null>(null)
  const [customBusinessSummary, setCustomBusinessSummary] = useState(businessSummary)

  useEffect(() => {
    checkServicesStatus()
  }, [])

  const checkServicesStatus = async () => {
    try {
      const response = await fetch('/api/brand-identity/services-status')
      const data = await response.json()
      
      setServicesStatus({
        logo_service: data.services?.logo_service || false,
        flyer_service: data.services?.flyer_service || false,
        orchestrator_service: data.orchestrator_available || false
      })
    } catch (error) {
      console.error('Error checking services status:', error)
      toast.error('Unable to check service status')
    }
  }

  const generateComprehensiveBrandIdentity = async () => {
    if (!customBusinessSummary.trim()) {
      toast.error('Please provide a business summary')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setGenerationStep('Initializing comprehensive brand identity creation...')

    try {
      const steps = [
        'Analyzing business requirements...',
        'Extracting brand essentials...',
        'Generating color palettes...',
        'Creating logo system...',
        'Generating marketing materials...',
        'Compiling brand guidelines...',
        'Creating comprehensive brand book...',
        'Finalizing brand identity...'
      ]

      let currentStep = 0
      const stepInterval = setInterval(() => {
        if (currentStep < steps.length - 1) {
          currentStep++
          setGenerationStep(steps[currentStep])
          setProgress((currentStep / steps.length) * 100)
        }
      }, 2000)

      const response = await fetch('/api/brand-identity/comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_summary: customBusinessSummary,
          brand_discovery_data: brandDiscoveryData,
          existing_business_data: existingBusinessData
        })
      })

      clearInterval(stepInterval)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      setProgress(100)
      setGenerationStep('Brand identity creation complete!')
      setResult(data)
      
      if (data.success) {
        toast.success('Comprehensive brand identity created successfully!')
        onComplete?.(data)
      } else {
        toast.error(data.error || 'Failed to create brand identity')
      }

    } catch (error) {
      console.error('Error generating comprehensive brand identity:', error)
      toast.error('Failed to generate comprehensive brand identity')
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadBrandAsset = async (assetId: string, assetType: string) => {
    try {
      const response = await fetch(`/api/brand-identity/assets/${assetId}`)
      if (!response.ok) throw new Error('Failed to download asset')
      
      const data = await response.json()
      
      // Create download link
      const blob = new Blob([JSON.stringify(data.asset, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${assetType}_${assetId}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success(`${assetType} downloaded successfully`)
    } catch (error) {
      console.error('Error downloading asset:', error)
      toast.error('Failed to download asset')
    }
  }

  const renderServiceStatus = () => {
    if (!servicesStatus) return null

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Service Status
          </CardTitle>
          <CardDescription>
            Status of brand identity generation services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Badge variant={servicesStatus.orchestrator_service ? "default" : "destructive"}>
              {servicesStatus.orchestrator_service ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              Orchestrator
            </Badge>
            <Badge variant={servicesStatus.logo_service ? "default" : "secondary"}>
              {servicesStatus.logo_service ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <Clock className="h-3 w-3 mr-1" />
              )}
              Logo Service
            </Badge>
            <Badge variant={servicesStatus.flyer_service ? "default" : "secondary"}>
              {servicesStatus.flyer_service ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <Clock className="h-3 w-3 mr-1" />
              )}
              Flyer Service
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderBrandIdentityResult = () => {
    if (!result || !result.success || !result.brand_identity) return null

    const brandData = result.brand_identity

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Brand Identity Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Brand Essentials */}
              {brandData.brand_essentials && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Brand Essentials
                  </h4>
                  <div className="space-y-2">
                    {brandData.brand_essentials.mission && (
                      <div>
                        <Label className="text-sm font-medium">Mission</Label>
                        <p className="text-sm text-muted-foreground">{brandData.brand_essentials.mission}</p>
                      </div>
                    )}
                    {brandData.brand_essentials.vision && (
                      <div>
                        <Label className="text-sm font-medium">Vision</Label>
                        <p className="text-sm text-muted-foreground">{brandData.brand_essentials.vision}</p>
                      </div>
                    )}
                    {brandData.brand_essentials.values && (
                      <div>
                        <Label className="text-sm font-medium">Values</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {brandData.brand_essentials.values.map((value: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Color Palettes */}
              {brandData.color_palettes && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Color Palettes
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(brandData.color_palettes).map(([paletteName, colors]: [string, any]) => (
                      <div key={paletteName}>
                        <Label className="text-sm font-medium capitalize">{paletteName} Palette</Label>
                        <div className="flex gap-2 mt-1">
                          {Array.isArray(colors) ? colors.map((color: string, index: number) => (
                            <div
                              key={index}
                              className="w-8 h-8 rounded border border-gray-200"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          )) : Object.entries(colors).map(([colorName, colorValue]: [string, any]) => (
                            <div key={colorName} className="text-center">
                              <div
                                className="w-8 h-8 rounded border border-gray-200 mb-1"
                                style={{ backgroundColor: colorValue }}
                                title={`${colorName}: ${colorValue}`}
                              />
                              <Label className="text-xs">{colorName}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Logo System */}
        {brandData.logo_system && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="h-5 w-5" />
                Logo System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(brandData.logo_system).map(([logoType, logoData]: [string, any]) => (
                  <div key={logoType} className="border rounded-lg p-4">
                    <h5 className="font-medium mb-2 capitalize">{logoType}</h5>
                    {logoData.image_url && (
                      <img 
                        src={logoData.image_url} 
                        alt={`${logoType} logo`}
                        className="w-full h-32 object-contain border rounded"
                      />
                    )}
                    {logoData.description && (
                      <p className="text-sm text-muted-foreground mt-2">{logoData.description}</p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => downloadBrandAsset(result.analysis_id!, `logo_${logoType}`)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Marketing Materials */}
        {brandData.marketing_materials && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Marketing Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(brandData.marketing_materials).map(([materialType, materialData]: [string, any]) => (
                  <div key={materialType} className="border rounded-lg p-4">
                    <h5 className="font-medium mb-2 capitalize">{materialType}</h5>
                    {materialData.preview_url && (
                      <img 
                        src={materialData.preview_url} 
                        alt={`${materialType} preview`}
                        className="w-full h-40 object-cover border rounded"
                      />
                    )}
                    {materialData.description && (
                      <p className="text-sm text-muted-foreground mt-2">{materialData.description}</p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => downloadBrandAsset(result.analysis_id!, `material_${materialType}`)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Brand Guidelines */}
        {brandData.brand_guidelines && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Brand Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {typeof brandData.brand_guidelines === 'string' ? (
                  <div className="whitespace-pre-wrap">{brandData.brand_guidelines}</div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(brandData.brand_guidelines).map(([section, content]: [string, any]) => (
                      <div key={section}>
                        <h4 className="font-semibold capitalize">{section.replace('_', ' ')}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => downloadBrandAsset(result.analysis_id!, 'brand_guidelines')}
              >
                <Download className="h-3 w-3 mr-1" />
                Download Guidelines
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Complete Brand Book Download */}
        <Card>
          <CardHeader>
            <CardTitle>Complete Brand Book</CardTitle>
            <CardDescription>
              Download the complete brand identity package including all assets and guidelines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => downloadBrandAsset(result.analysis_id!, 'complete_brand_book')}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Complete Brand Book
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Comprehensive Brand Identity</h1>
        <p className="text-muted-foreground">
          Create a complete brand identity including logos, marketing materials, and brand guidelines
        </p>
      </div>

      {renderServiceStatus()}

      {!result && (
        <Card>
          <CardHeader>
            <CardTitle>Business Summary</CardTitle>
            <CardDescription>
              Provide a detailed description of your business for comprehensive brand identity creation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="business-summary">Business Summary</Label>
              <Textarea
                id="business-summary"
                placeholder="Describe your business, its mission, target audience, products/services, and unique value proposition..."
                value={customBusinessSummary}
                onChange={(e) => setCustomBusinessSummary(e.target.value)}
                className="min-h-32"
              />
            </div>

            {isGenerating && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm font-medium">{generationStep}</p>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <Button
              onClick={generateComprehensiveBrandIdentity}
              disabled={isGenerating || !customBusinessSummary.trim() || !servicesStatus?.orchestrator_service}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Creating Brand Identity...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Comprehensive Brand Identity
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {result && !result.success && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{result.error}</p>
            <Button
              variant="outline"
              onClick={() => setResult(null)}
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {renderBrandIdentityResult()}
    </div>
  )
}
