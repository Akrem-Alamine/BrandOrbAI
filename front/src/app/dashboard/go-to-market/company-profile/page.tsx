'use client'

import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import GeneratedLandingPage from "@/components/generated-landing-page"
import { 
  Settings, 
  Sparkles, 
  Loader2, 
  Globe, 
  Code, 
  Eye,
  Save,
  Send,
  MessageSquare,
  Download,
  Share2,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Palette,
  Layout,
  Type,
  Image as ImageIcon,
  Brush,
  Wand2,
  Rocket,
  Star,
  Copy,
  X
} from "lucide-react"

// API Configuration
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001'

interface BusinessData {
  business_summary: string
  financial_data: string
  market_data: string
  legal_data: string
  brand_identity_data: string
}

interface WebsiteAnalysis {
  company_name: string
  industry: string
  business_type: string
  target_audience: string
  unique_value_proposition: string
  key_services: string[]
  competitive_advantages: string[]
  brand_colors: string[]
  brand_personality: string
  website_sections: string[]
  call_to_action: string
  seo_keywords: string[]
  tone_of_voice: string
  business_model: string
  stage: string
  key_metrics: string[]
  social_proof_elements: string[]
}

interface WebsiteVersion {
  version_id: string
  website_id: string
  timestamp: string
  user_prompt: string
  analysis: WebsiteAnalysis
  file_size: number
  company_name: string
  industry: string
  published?: boolean
  published_at?: string
}

export default function CompanyProfilePage() {
  // State Management
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [websiteAnalysis, setWebsiteAnalysis] = useState<WebsiteAnalysis | null>(null)
  const [currentWebsiteId, setCurrentWebsiteId] = useState<string>('')
  const [currentVersionId, setCurrentVersionId] = useState<string>('')
  const [websiteVersions, setWebsiteVersions] = useState<WebsiteVersion[]>([])
  const [currentHtml, setCurrentHtml] = useState<string>('')
  
  // UI State
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'complete'>('idle')
  const [activeTab, setActiveTab] = useState<'generator' | 'preview' | 'versions'>('generator')
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStage, setGenerationStage] = useState('')
  const [showRawHtml, setShowRawHtml] = useState(false)
  
  // Chat & Preview State with Persistence
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'assistant', message: string, timestamp: Date}>>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  
  // Form State with Persistence
  const [userPrompt, setUserPrompt] = useState('')
  const [stylePreferences, setStylePreferences] = useState('modern')
  
  // Refs
  const previewRef = useRef<HTMLIFrameElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // State Persistence Functions
  const saveToLocalStorage = (key: string, value: any) => {
    try {
      localStorage.setItem(`website-generator-${key}`, JSON.stringify(value))
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error)
    }
  }

  const loadFromLocalStorage = (key: string, defaultValue: any = null) => {
    try {
      const item = localStorage.getItem(`website-generator-${key}`)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error)
      return defaultValue
    }
  }

  // Enhanced state setters with persistence
  const setPersistedUserPrompt = (value: string) => {
    setUserPrompt(value)
    saveToLocalStorage('userPrompt', value)
  }

  const setPersistedStylePreferences = (value: string) => {
    setStylePreferences(value)
    saveToLocalStorage('stylePreferences', value)
  }

  const setPersistedActiveTab = (value: 'generator' | 'preview' | 'versions') => {
    setActiveTab(value)
    saveToLocalStorage('activeTab', value)
  }

  const setPersistedChatMessages = (messages: Array<{type: 'user' | 'assistant', message: string, timestamp: Date}> | ((prev: Array<{type: 'user' | 'assistant', message: string, timestamp: Date}>) => Array<{type: 'user' | 'assistant', message: string, timestamp: Date}>)) => {
    if (typeof messages === 'function') {
      setChatMessages(prev => {
        const newMessages = messages(prev)
        saveToLocalStorage('chatMessages', newMessages)
        return newMessages
      })
    } else {
      setChatMessages(messages)
      saveToLocalStorage('chatMessages', messages)
    }
  }

  // Load business data on component mount and restore persisted state
  useEffect(() => {
    loadBusinessData()
    
    // Restore persisted states
    const savedUserPrompt = loadFromLocalStorage('userPrompt', '')
    if (savedUserPrompt) setUserPrompt(savedUserPrompt)
    
    const savedStylePreferences = loadFromLocalStorage('stylePreferences', 'modern')
    setStylePreferences(savedStylePreferences)
    
    const savedActiveTab = loadFromLocalStorage('activeTab', 'generator')
    setActiveTab(savedActiveTab)
    
    // Restore chat messages with date conversion
    const savedMessages = loadFromLocalStorage('chatMessages', [])
    if (savedMessages.length > 0) {
      const messagesWithDates = savedMessages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
      setChatMessages(messagesWithDates)
    }
  }, [])

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const loadBusinessData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${BACKEND_URL}/website-generator/business-data`)
      const data = await response.json()
      
      if (data.success) {
        setBusinessData(data.data)
        // Add welcome message to chat
        setPersistedChatMessages([{
          type: 'assistant',
          message: `Welcome! I've loaded your business data and I'm ready to create your company website. I found:\n\n✅ ${data.has_business_summary ? 'Business summary' : '❌ No business summary'}\n✅ ${data.has_financial_data ? 'Financial data' : '❌ No financial data'}\n✅ ${data.has_market_data ? 'Market analysis' : '❌ No market data'}\n✅ ${data.has_brand_identity_data ? 'Brand identity' : '❌ No brand identity'}\n\nWhat kind of website would you like me to create for your business?`,
          timestamp: new Date()
        }])
      } else {
        toast.error('Failed to load business data. Please complete your business analysis first.')
      }
    } catch (error) {
      console.error('Error loading business data:', error)
      toast.error('Error loading business data')
    } finally {
      setLoading(false)
    }
  }

  const analyzeBusinessForWebsite = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/website-generator/analyze`)
      const data = await response.json()
      
      if (data.success) {
        setWebsiteAnalysis(data.analysis)
        return data.analysis
      }
    } catch (error) {
      console.error('Error analyzing business:', error)
    }
    return null
  }

  const generateWebsite = async () => {
    if (!businessData) {
      toast.error('No business data available. Please complete your business analysis first.')
      return
    }

    try {
      setGenerating(true)
      setGenerationStatus('generating')
      setGenerationProgress(0)
      setGenerationStage('Initializing...')
      
      // Add user message to chat
      if (userPrompt.trim()) {
        setPersistedChatMessages(prev => [...prev, {
          type: 'user',
          message: userPrompt,
          timestamp: new Date()
        }])
      }

      // Add generating message
      setPersistedChatMessages(prev => [...prev, {
        type: 'assistant',
        message: '🎨 Analyzing your business and generating a professional website... This may take a few moments.',
        timestamp: new Date()
      }])

      // Simulate progress steps
      setGenerationProgress(10)
      setGenerationStage('Loading business data...')
      await new Promise(resolve => setTimeout(resolve, 500))

      setGenerationProgress(25)
      setGenerationStage('Analyzing brand identity...')
      await new Promise(resolve => setTimeout(resolve, 500))

      setGenerationProgress(40)
      setGenerationStage('Generating website structure...')
      await new Promise(resolve => setTimeout(resolve, 300))

      setGenerationProgress(60)
      setGenerationStage('Creating AI-powered content...')

      const response = await fetch(`${BACKEND_URL}/website-generator/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_prompt: userPrompt,
          style_preferences: stylePreferences
        })
      })

      setGenerationProgress(80)
      setGenerationStage('Finalizing design...')

      const data = await response.json()

      if (data.success) {
        console.log('✅ Website generation successful:', {
          hasHtmlCode: !!data.html_code,
          htmlLength: data.html_code?.length || 0,
          websiteId: data.website_id,
          companyName: data.company_name
        })
        
        setGenerationProgress(90)
        setGenerationStage('Loading preview...')
        
        setCurrentWebsiteId(data.website_id)
        setCurrentVersionId(data.version_info.version_id)
        setCurrentHtml(data.html_code)
        setWebsiteAnalysis(data.analysis)
        
        // Update preview immediately after setting HTML
        if (previewRef.current) {
          const blob = new Blob([data.html_code], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          previewRef.current.src = url
          
          // Also switch to preview tab to show the result
          setPersistedActiveTab('preview')
        }

        // Load versions
        loadWebsiteVersions(data.website_id)

        setGenerationProgress(100)
        setGenerationStage('Complete!')
        
        // Add success message
        setPersistedChatMessages(prev => [...prev, {
          type: 'assistant',
          message: `🎉 Success! I've created a professional website for ${data.company_name}. The website includes:\n\n• Modern, responsive design\n• Professional hero section\n• About us section\n• Services showcase\n• Contact information\n• SEO optimization\n\nYou can now preview, save, or publish your website. Would you like me to make any adjustments?`,
          timestamp: new Date()
        }])

        toast.success('Website generated successfully! 🎉')
        setGenerationStatus('complete')
        setPersistedUserPrompt('')
      } else {
        setPersistedChatMessages(prev => [...prev, {
          type: 'assistant',
          message: `❌ I encountered an issue generating your website: ${data.error || data.message}. Please try again or provide more specific requirements.`,
          timestamp: new Date()
        }])
        toast.error(data.message || 'Failed to generate website')
      }
    } catch (error) {
      console.error('Error generating website:', error)
      setPersistedChatMessages(prev => [...prev, {
        type: 'assistant',
        message: '❌ Sorry, I encountered a technical error. Please try again.',
        timestamp: new Date()
      }])
      toast.error('Error generating website')
    } finally {
      setGenerating(false)
      if (generationStatus === 'generating') {
        setGenerationStatus('idle')
      }
      // Reset progress after a delay to show completion
      setTimeout(() => {
        setGenerationProgress(0)
        setGenerationStage('')
      }, 2000)
    }
  }

  const regenerateWebsite = async (feedback: string) => {
    if (!currentWebsiteId) return

    try {
      setGenerating(true)
      setGenerationProgress(0)
      setGenerationStage('Processing feedback...')

      setGenerationProgress(30)
      setGenerationStage('Updating website design...')

      const response = await fetch(`${BACKEND_URL}/website-generator/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_id: currentWebsiteId,
          user_feedback: feedback,
          style_preferences: stylePreferences
        })
      })

      setGenerationProgress(70)
      setGenerationStage('Applying changes...')

      const data = await response.json()

      if (data.success) {
        setGenerationProgress(100)
        setGenerationStage('Complete!')
        
        setCurrentVersionId(data.version_info.version_id)
        setCurrentHtml(data.html_code)
        
        // Update preview
        if (previewRef.current) {
          const blob = new Blob([data.html_code], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          previewRef.current.src = url
        }

        // Reload versions
        loadWebsiteVersions(currentWebsiteId)

        toast.success('Website updated successfully! ✨')
      } else {
        toast.error(data.message || 'Failed to regenerate website')
      }
    } catch (error) {
      console.error('Error regenerating website:', error)
      toast.error('Error updating website')
    } finally {
      setGenerating(false)
      // Reset progress after a delay
      setTimeout(() => {
        setGenerationProgress(0)
        setGenerationStage('')
      }, 2000)
    }
  }

  const loadWebsiteVersions = async (websiteId: string) => {
    try {
      setLoadingVersions(true)
      const response = await fetch(`${BACKEND_URL}/website-generator/versions/${websiteId}`)
      const data = await response.json()
      
      if (data.success) {
        setWebsiteVersions(data.versions)
      }
    } catch (error) {
      console.error('Error loading website versions:', error)
    } finally {
      setLoadingVersions(false)
    }
  }

  const loadVersion = async (versionId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/website-generator/version/${versionId}/html`)
      const data = await response.json()
      
      if (data.success) {
        setCurrentVersionId(versionId)
        setCurrentHtml(data.html_code)
        
        console.log('✅ Version loaded:', {
          versionId,
          hasHtml: !!data.html_code,
          htmlLength: data.html_code?.length || 0
        })
        
        // Update preview immediately
        if (previewRef.current && data.html_code) {
          const blob = new Blob([data.html_code], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          previewRef.current.src = url
          console.log('🔄 Preview updated for version:', versionId)
        }

        toast.success('Version loaded successfully')
      }
    } catch (error) {
      console.error('Error loading version:', error)
      toast.error('Error loading version')
    }
  }

  const publishWebsite = async () => {
    if (!currentVersionId) return

    try {
      setPublishing(true)

      const response = await fetch(`${BACKEND_URL}/website-generator/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version_id: currentVersionId
        })
      })

      const data = await response.json()

      if (data.success) {
        // Reload versions to update published status
        if (currentWebsiteId) {
          loadWebsiteVersions(currentWebsiteId)
        }

        setPersistedChatMessages(prev => [...prev, {
          type: 'assistant',
          message: `🚀 Website published successfully! Your website is now live at:\n\n${window.location.origin}${data.published_url}\n\nYou can share this URL with your customers and stakeholders.`,
          timestamp: new Date()
        }])

        toast.success('Website published successfully! 🚀')
      } else {
        toast.error(data.message || 'Failed to publish website')
      }
    } catch (error) {
      console.error('Error publishing website:', error)
      toast.error('Error publishing website')
    } finally {
      setPublishing(false)
    }
  }

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return

    const message = chatInput.trim()
    setChatInput('')

    // Add user message
    setPersistedChatMessages(prev => [...prev, {
      type: 'user',
      message: message,
      timestamp: new Date()
    }])

    if (currentWebsiteId) {
      // Regenerate with feedback
      setPersistedChatMessages(prev => [...prev, {
        type: 'assistant',
        message: '🔄 Updating your website with the feedback...',
        timestamp: new Date()
      }])
      
      await regenerateWebsite(message)
    } else {
      // Initial generation
      setUserPrompt(message)
      await generateWebsite()
    }
  }

  const downloadWebsite = () => {
    if (!currentHtml) return

    const blob = new Blob([currentHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${websiteAnalysis?.company_name || 'website'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Website downloaded successfully!')
  }

  const reloadPreview = () => {
    if (previewRef.current && currentHtml) {
      const blob = new Blob([currentHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      previewRef.current.src = url
      console.log('🔄 Preview manually reloaded')
      toast.success('Preview reloaded!')
    }
  }

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile': return '375px'
      case 'tablet': return '768px'
      default: return '100%'
    }
  }

  const getPreviewHeight = () => {
    switch (previewMode) {
      case 'mobile': return '667px'
      case 'tablet': return '1024px'
      default: return '100%'
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Loading Business Data</h2>
            <p className="text-gray-600 mt-2">Preparing your website generator...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Globe className="h-6 w-6 mr-2 text-blue-600" />
                Company Website Generator
              </h1>
              <p className="text-gray-600 mt-1">
                Generate a professional website for your business using AI
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                {isChatOpen ? 'Hide Chat' : 'Show Chat'}
              </Button>
              <Button
                variant="outline"
                onClick={loadBusinessData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Business Data & Controls */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Business Overview</h3>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {/* Website Generator & Settings Combined */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      Website Generator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Tab Navigation */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant={activeTab === 'generator' ? 'default' : 'outline'}
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => setPersistedActiveTab('generator')}
                      >
                        <Wand2 className="h-3 w-3" />
                        Generate
                      </Button>
                      <Button 
                        variant={activeTab === 'preview' ? 'default' : 'outline'}
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => {
                          setPersistedActiveTab('preview')
                          if (currentHtml && previewRef.current) {
                            const blob = new Blob([currentHtml], { type: 'text/html' })
                            const url = URL.createObjectURL(blob)
                            previewRef.current.src = url
                          }
                        }}
                        disabled={!currentHtml && !generating}
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                      </Button>
                    </div>
                    
                    {/* Generation Status */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs text-gray-600">Status</span>
                      <div className="flex items-center gap-1">
                        {generationStatus === 'idle' && (
                          <span className="text-xs text-gray-500">Ready</span>
                        )}
                        {generationStatus === 'generating' && (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                            <span className="text-xs text-blue-600">Generating...</span>
                          </>
                        )}
                        {generationStatus === 'complete' && (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600">Complete</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Generation Progress */}
                    {generating && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{generationStage}</span>
                          <span className="text-xs font-medium text-gray-700">{generationProgress}%</span>
                        </div>
                        <Progress value={generationProgress} className="w-full h-2" />
                      </div>
                    )}

                    {/* Generation Settings - Show only when on generator tab */}
                    {activeTab === 'generator' && (
                      <div className="space-y-4 border-t pt-4">
                        <div>
                          <Label htmlFor="style" className="text-sm font-medium">Style Preference</Label>
                          <Select value={stylePreferences} onValueChange={setPersistedStylePreferences}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="modern">Modern & Clean</SelectItem>
                              <SelectItem value="professional">Professional & Corporate</SelectItem>
                              <SelectItem value="creative">Creative & Bold</SelectItem>
                              <SelectItem value="elegant">Elegant & Sophisticated</SelectItem>
                              <SelectItem value="minimal">Minimal & Simple</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="prompt" className="text-sm font-medium">Custom Requirements</Label>
                          <Textarea
                            id="prompt"
                            value={userPrompt}
                            onChange={(e) => setPersistedUserPrompt(e.target.value)}
                            placeholder="Describe any specific requirements for your website..."
                            className="mt-1 min-h-[100px] text-sm"
                          />
                        </div>

                        <Button
                          onClick={generateWebsite}
                          disabled={generating || !businessData}
                          className="w-full"
                        >
                          {generating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generate Website
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Preview Actions - Show only when on preview tab */}
                    {activeTab === 'preview' && currentHtml && (
                      <div className="space-y-3 border-t pt-4">
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadWebsite}
                            disabled={generating}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            onClick={() => {
                              console.log('🔍 Debug HTML Content:', {
                                hasHTML: !!currentHtml,
                                htmlLength: currentHtml?.length || 0,
                                htmlPreview: currentHtml?.substring(0, 200) || 'No HTML',
                                websiteId: currentWebsiteId,
                                versionId: currentVersionId
                              })
                              if (currentHtml && previewRef.current) {
                                const blob = new Blob([currentHtml], { type: 'text/html' })
                                const url = URL.createObjectURL(blob)
                                previewRef.current.src = url
                                console.log('🔄 Manually reloading preview')
                              }
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reload Preview
                          </Button>
                          <Button
                            onClick={() => setShowRawHtml(!showRawHtml)}
                            variant="outline"
                            size="sm"
                            disabled={!currentHtml}
                          >
                            {showRawHtml ? 'Hide' : 'Show'} HTML
                          </Button>
                        </div>
                        
                        <Button
                          onClick={publishWebsite}
                          disabled={publishing || !currentVersionId || generating}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 w-full"
                          size="sm"
                        >
                          {publishing ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <Rocket className="h-3 w-3 mr-1" />
                              Publish Live
                            </>
                          )}
                        </Button>
                        
                        {/* Mini Preview */}
                        <div className="bg-gray-100 rounded-lg overflow-hidden">
                          <iframe
                            ref={previewRef}
                            className="w-full h-32 border-0 scale-50 origin-top-left transform"
                            style={{ width: '200%', height: '200%' }}
                            title="Mini Website Preview"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Website Analysis */}
                {websiteAnalysis && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Website Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Company</Label>
                        <p className="text-sm font-medium">{websiteAnalysis.company_name}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Industry</Label>
                        <p className="text-sm">{websiteAnalysis.industry}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Brand Colors</Label>
                        <div className="flex gap-1 mt-1">
                          {websiteAnalysis.brand_colors.map((color, index) => (
                            <div 
                              key={index}
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Services</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {websiteAnalysis.key_services.slice(0, 3).map((service, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Generation Controls */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Generation Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="style" className="text-sm font-medium">Style Preference</Label>
                      <Select value={stylePreferences} onValueChange={setPersistedStylePreferences}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">Modern & Clean</SelectItem>
                          <SelectItem value="professional">Professional & Corporate</SelectItem>
                          <SelectItem value="creative">Creative & Bold</SelectItem>
                          <SelectItem value="elegant">Elegant & Sophisticated</SelectItem>
                          <SelectItem value="minimal">Minimal & Simple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="prompt" className="text-sm font-medium">Custom Requirements</Label>
                      <Textarea
                        id="prompt"
                        value={userPrompt}
                        onChange={(e) => setPersistedUserPrompt(e.target.value)}
                        placeholder="Describe any specific requirements for your website..."
                        className="mt-1 min-h-[100px] text-sm"
                      />
                    </div>

                    <Button
                      onClick={generateWebsite}
                      disabled={generating || !businessData}
                      className="w-full"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Website
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Website Versions */}
                {websiteVersions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        Website Versions
                        <Badge variant="secondary">{websiteVersions.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-48">
                        <div className="space-y-2">
                          {websiteVersions.map((version) => (
                            <div
                              key={version.version_id}
                              className={`p-2 border rounded-md cursor-pointer transition-colors ${
                                currentVersionId === version.version_id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => loadVersion(version.version_id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-600">
                                    {new Date(version.timestamp.replace(/_/g, ':')).toLocaleDateString()}
                                  </span>
                                </div>
                                {version.published && (
                                  <Badge variant="default" className="text-xs">
                                    <Rocket className="h-2 w-2 mr-1" />
                                    Live
                                  </Badge>
                                )}
                              </div>
                              {version.user_prompt && (
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                  {version.user_prompt}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Center Panel - Preview */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {/* Preview Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="font-semibold text-gray-900">Website Preview</h3>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <Button
                      variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPreviewMode('desktop')}
                      className="rounded-r-none"
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPreviewMode('tablet')}
                      className="rounded-none"
                    >
                      <Tablet className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPreviewMode('mobile')}
                      className="rounded-l-none"
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => setShowRawHtml(!showRawHtml)}
                  variant="outline"
                  size="sm"
                  disabled={!currentHtml}
                >
                  {showRawHtml ? 'Hide' : 'Show'} HTML Debug
                </Button>
              </div>

              {/* Preview Controls */}
              <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={reloadPreview}
                    disabled={!currentHtml || generating}
                    title="Reload Preview"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRawHtml(!showRawHtml)}
                    disabled={!currentHtml}
                    title="Show HTML Code"
                  >
                    <Code className="h-4 w-4" />
                    {showRawHtml ? " Hide" : " Show"} HTML
                  </Button>
                </div>

                <div className="flex items-center border border-gray-300 rounded-md">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                    className="rounded-r-none"
                  >
                    <Monitor className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadWebsite}
                    disabled={!currentHtml || generating}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!currentHtml || generating}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={publishWebsite}
                    disabled={publishing || !currentVersionId || generating}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {publishing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : generating ? (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Wait for Generation
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2 h-4 w-4" />
                        Publish Live
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 flex items-center justify-center p-4">
              {generating ? (
                /* Website Generation Loading State */
                <div className="w-full max-w-4xl">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Generation Progress Header */}
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Generating Your Website</h3>
                          <p className="text-sm text-gray-600">{generationStage}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">{generationProgress}%</span>
                        </div>
                      </div>
                      <Progress value={generationProgress} className="w-full" />
                    </div>

                    {/* Website Preview Skeleton */}
                    <div className="p-6 space-y-6">
                      {/* Header Skeleton */}
                      <div className="flex items-center justify-between">
                        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex items-center space-x-4">
                          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>

                      {/* Hero Section Skeleton */}
                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-8 animate-pulse">
                        <div className="text-center space-y-4">
                          <div className="h-12 w-3/4 bg-gray-300 rounded mx-auto"></div>
                          <div className="h-6 w-1/2 bg-gray-300 rounded mx-auto"></div>
                          <div className="flex justify-center space-x-4 mt-6">
                            <div className="h-10 w-24 bg-gray-300 rounded"></div>
                            <div className="h-10 w-24 bg-gray-300 rounded"></div>
                          </div>
                        </div>
                      </div>

                      {/* Content Sections Skeleton */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="bg-gray-50 p-6 rounded-lg animate-pulse">
                            <div className="h-6 w-full bg-gray-200 rounded mb-4"></div>
                            <div className="space-y-2">
                              <div className="h-4 w-full bg-gray-200 rounded"></div>
                              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                              <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Features Grid Skeleton */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="text-center p-4 animate-pulse">
                            <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-3"></div>
                            <div className="h-4 w-full bg-gray-200 rounded"></div>
                          </div>
                        ))}
                      </div>

                      {/* Contact Section Skeleton */}
                      <div className="bg-gray-50 p-6 rounded-lg animate-pulse">
                        <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="h-10 w-full bg-gray-200 rounded"></div>
                            <div className="h-10 w-full bg-gray-200 rounded"></div>
                            <div className="h-24 w-full bg-gray-200 rounded"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-4 w-full bg-gray-200 rounded"></div>
                            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentHtml ? (
                <>
                  {/* Check if this is TSX content */}
                  {currentHtml.includes('GeneratedLandingPage') || currentHtml.includes('import') ? (
                    // TSX-based website - show native component preview
                    <div 
                      className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 flex flex-col"
                      style={{ 
                        width: getPreviewWidth(), 
                        height: getPreviewHeight(),
                        maxWidth: '100%',
                        maxHeight: '100%'
                      }}
                    >
                      <div className="p-4 bg-primary/5 border-b border-primary/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-700">Live Preview</span>
                          <Badge variant="secondary" className="text-xs">TSX Component</Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = `/generated-website/${currentVersionId}`
                            window.open(url, '_blank')
                          }}
                          disabled={!currentVersionId}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open Full Page
                        </Button>
                      </div>
                      
                      <div className="flex-1 overflow-hidden relative">
                        {websiteAnalysis ? (
                          <div className="h-full overflow-auto">
                            <GeneratedLandingPage 
                              analysis={websiteAnalysis} 
                              businessData={businessData || undefined} 
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                              <p className="text-sm text-gray-600">Loading component...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Traditional HTML website - use iframe
                    <div 
                      className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300"
                      style={{ 
                        width: getPreviewWidth(), 
                        height: getPreviewHeight(),
                        maxWidth: '100%',
                        maxHeight: '100%'
                      }}
                    >
                      <iframe
                        ref={previewRef}
                        className="w-full h-full border-0"
                        title="Website Preview"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                        onLoad={() => {
                          console.log('✅ Website preview iframe loaded successfully')
                          
                          // Check if iframe has content
                          if (previewRef.current) {
                            try {
                              const iframeDoc = previewRef.current.contentDocument || previewRef.current.contentWindow?.document
                              if (iframeDoc) {
                                console.log('📄 Iframe document available')
                                console.log('📊 Iframe body innerHTML length:', iframeDoc.body?.innerHTML?.length || 0)
                                console.log('📊 Iframe document HTML length:', iframeDoc.documentElement?.outerHTML?.length || 0)
                              } else {
                                console.log('❌ Iframe document not accessible')
                              }
                            } catch (error) {
                              console.log('⚠️ Could not access iframe document:', error)
                            }
                          }
                        }}
                        onError={(e) => {
                          console.error('❌ Website preview failed to load:', e)
                        }}
                      />
                      
                      {/* Debug info - remove in production */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs p-2 rounded">
                          HTML Size: {currentHtml.length} chars
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500 max-w-md">
                  <Globe className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Website Generated</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Generate your first website to see the preview here. Your website will be automatically optimized for all devices.
                  </p>
                  <Button
                    onClick={generateWebsite}
                    disabled={generating || !businessData}
                    className="inline-flex items-center"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Your Website
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Chat */}
          {isChatOpen && (
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    AI Assistant
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsChatOpen(false)}
                  >
                    ×
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Chat with me to customize your website
                </p>
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{message.message}</div>
                        <div
                          className={`text-xs mt-1 ${
                            message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask me to modify your website..."
                    className="flex-1 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleChatSubmit()
                      }
                    }}
                    disabled={generating}
                  />
                  <Button
                    onClick={handleChatSubmit}
                    disabled={!chatInput.trim() || generating}
                    size="sm"
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {[
                    "Make it more colorful",
                    "Add testimonials section", 
                    "Make it more professional",
                    "Add contact form",
                    "Change color scheme",
                    "Add pricing section"
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-auto py-1 px-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => setChatInput(suggestion)}
                      disabled={generating}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    
  )
}
