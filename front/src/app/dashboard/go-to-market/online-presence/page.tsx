'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { Sidebar, SidebarHeader, SidebarContent } from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  Settings, 
  Sparkles, 
  Loader2, 
  FileText, 
  Clock, 
  X, 
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Save,
  HelpCircle,
  TrendingUp,
  Send,
  Video,
  Calendar as CalendarIcon,
  Share2,
  Users,
  Target,
  BarChart3,
  Eye,
  AlertCircle,
  Upload,
  Image,
  Type,
  Plus,
  RefreshCw,
  Trash
} from 'lucide-react'
import { 
  Linkedin,
  Facebook,
  Instagram,
  Twitter
} from 'lucide-react'
import {
  generateSocialMediaPosts,
  schedulePosts,
  postToSocialMedia,
  getUpcomingPosts,
  cancelScheduledPost,
  getPlatformStatus,
  getPlatformHelp,
  configureAllPlatforms,
  PlatformStatus as ImportedPlatformStatus,
  loadBusinessData
} from '@/services/agents'

// Types
interface SocialMediaPost {
  id: string
  platform: string
  content_type: 'text' | 'image' | 'video'
  title: string
  content: string
  hashtags: string[]
  optimal_time: string
  engagement_prediction: 'low' | 'medium' | 'high'
  call_to_action: string
  image_url?: string
  image_data?: string // Base64 encoded image data for backend
  scheduled_time?: string
  status?: 'draft' | 'scheduled' | 'published'
  has_media?: boolean
  optimal_reason?: string
  suggested_date?: string
  suggested_time?: string
}

interface PlatformConfig {
  configured: boolean
  status: string
  fields_configured: number
  total_fields: number
  last_updated?: string
}

interface PlatformStatus {
  [key: string]: PlatformConfig
}

const platformNames: Record<string, string> = {
  linkedin: 'LinkedIn',
  tiktok: 'TikTok', 
  facebook: 'Facebook',
  instagram: 'Instagram',
  x: 'Twitter/X'
}

const platformColors: Record<string, string> = {
  linkedin: 'bg-blue-600',
  tiktok: 'bg-black',
  facebook: 'bg-blue-500', 
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  x: 'bg-gray-900'
}

export default function OnlinePresencePage() {
  const [loading, setLoading] = useState(true)
  const [platforms, setPlatforms] = useState<PlatformStatus>({})
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin'])
  const [generatedPosts, setGeneratedPosts] = useState<SocialMediaPost[]>([])
  const [upcomingPosts, setUpcomingPosts] = useState<SocialMediaPost[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateImages, setGenerateImages] = useState(true)
  const [postCount, setPostCount] = useState(5)
  const [businessSummary, setBusinessSummary] = useState('')
  const [businessData, setBusinessData] = useState<any>({})
  const [marketingInsights, setMarketingInsights] = useState<any>({})
  const [showPlatformHelp, setShowPlatformHelp] = useState<string | null>(null)
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeConfigPlatform, setActiveConfigPlatform] = useState<string | null>(null)
  const [isSavingPlatform, setIsSavingPlatform] = useState(false)
  const [platformSettings, setPlatformSettings] = useState<Record<string, any>>({})

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState({
    engagementRate: 'N/A',
    postsThisMonth: 0,
    topPlatform: 'Not Set'
  })
  
  // Loading state for schedule all operation
  const [isSchedulingAll, setIsSchedulingAll] = useState(false)

  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [postsForSelectedDate, setPostsForSelectedDate] = useState<SocialMediaPost[]>([])
  
  // Weekly calendar state
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    monday.setHours(0, 0, 0, 0)
    return monday
  })

  // Post management modal state
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [showPostModal, setShowPostModal] = useState(false)
  const [postModalLoading, setPostModalLoading] = useState(false)

  // Get week dates
  const getWeekDates = (weekStart: Date): Date[] => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const currentWeekDates = getWeekDates(currentWeekStart)

  // Navigate weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart)
    newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeekStart(newWeekStart)
  }

  // Get posts for a specific date and time slot
  const getPostsForDateAndTime = (date: Date, timeSlot: string): SocialMediaPost[] => {
    return upcomingPosts.filter(post => {
      if (!post.scheduled_time) return false
      const postDate = new Date(post.scheduled_time)
      const postTime = postDate.getHours()
      
      // Check if post is on the same date
      const isSameDate = postDate.toDateString() === date.toDateString()
      if (!isSameDate) return false
      
      // Define time slots
      switch (timeSlot) {
        case 'morning':
          return postTime >= 6 && postTime < 12
        case 'afternoon': 
          return postTime >= 12 && postTime < 18
        case 'evening':
          return postTime >= 18 && postTime < 24
        case 'night':
          return postTime >= 0 && postTime < 6
        default:
          return false
      }
    })
  }

  // Custom post creation state
  const [showCustomPostCreator, setShowCustomPostCreator] = useState(false)
  const [customPostContent, setCustomPostContent] = useState('')
  const [customPostKeywords, setCustomPostKeywords] = useState('')
  const [customPostMedia, setCustomPostMedia] = useState<File | null>(null)
  const [customPostPlatform, setCustomPostPlatform] = useState('linkedin')
  const [isGeneratingCustomPost, setIsGeneratingCustomPost] = useState(false)

  // Load data on component mount
  useEffect(() => {
    initializePage()
  }, [])

  // Debug: Log when upcomingPosts changes
  useEffect(() => {
    console.log('upcomingPosts changed:', upcomingPosts.length, 'posts')
    console.log('Posts details:', upcomingPosts.map(p => ({ 
      id: p.id, 
      platform: p.platform, 
      scheduled_time: p.scheduled_time,
      title: p.title?.slice(0, 30) + '...'
    })))
  }, [upcomingPosts])

  const initializePage = async () => {
    try {
      await Promise.all([
        loadBusinessDataFromFiles(),
        loadPlatformStatus(),
        loadUpcomingPosts(),
        loadAnalyticsData()
      ])
    } catch (error) {
      console.error('Error initializing page:', error)
      toast.error('Failed to load page data')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalyticsData = async () => {
    try {
      // Calculate dynamic analytics based on platform configurations and posts
      const configuredPlatforms = Object.entries(platforms).filter(([_, config]) => config.configured)
      const topPlatform = configuredPlatforms.length > 0 ? platformNames[configuredPlatforms[0][0]] || 'Not Set' : 'Not Set'
      
      setAnalyticsData({
        engagementRate: configuredPlatforms.length > 0 ? '85%' : 'N/A',
        postsThisMonth: generatedPosts.length + upcomingPosts.length,
        topPlatform: topPlatform
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const loadPostsForDate = (date: Date | undefined) => {
    if (!date) {
      setPostsForSelectedDate([])
      return
    }
    
    const dateStr = date.toDateString()
    const postsForDate = upcomingPosts.filter(post => {
      if (!post.scheduled_time) return false
      const postDate = new Date(post.scheduled_time)
      return postDate.toDateString() === dateStr
    })
    
    setPostsForSelectedDate(postsForDate)
  }

  // Update posts for selected date when upcomingPosts or selectedDate changes
  useEffect(() => {
    loadPostsForDate(selectedDate)
  }, [upcomingPosts, selectedDate])

  const loadBusinessDataFromFiles = async () => {
    try {
      const result = await loadBusinessData()
      if (result.success) {
        setBusinessData(result.data)
        setBusinessSummary(result.data.business_summary || '')
        
        // Show status of loaded data
        const loadedSources = []
        if (result.has_business_summary) loadedSources.push('Business Summary')
        if (result.has_financial_data) loadedSources.push('Financial Analysis')
        if (result.has_market_data) loadedSources.push('Market Analysis') 
        if (result.has_legal_data) loadedSources.push('Legal Analysis')
        if (result.has_brand_identity_data) loadedSources.push('Brand Identity')
        
        if (loadedSources.length > 0) {
          toast.success(`Loaded data from: ${loadedSources.join(', ')}`)
        } else {
          toast.warning('No business analysis data found. Generate posts may use default content.')
        }
      }

      // Load marketing insights (mock for now)
      setMarketingInsights({
        engagement_heatmap: {
          best_times: {
            linkedin: { morning: 0.8, afternoon: 0.6, evening: 0.4, night: 0.2 },
            tiktok: { morning: 0.4, afternoon: 0.6, evening: 0.9, night: 0.7 },
            facebook: { morning: 0.6, afternoon: 0.7, evening: 0.5, night: 0.3 },
            instagram: { morning: 0.5, afternoon: 0.8, evening: 0.9, night: 0.4 },
            x: { morning: 0.7, afternoon: 0.8, evening: 0.6, night: 0.5 }
          }
        },
        linkedin_insights: {
          insights: "Professional content performs best in morning hours",
          recommendations: ["Share industry insights", "Post case studies"]
        },
        tiktok_insights: {
          insights: "Authentic content performs best in evening hours", 
          recommendations: ["Create behind-the-scenes content", "Use trending hashtags"]
        }
      })
    } catch (error) {
      console.error('Error loading business data:', error)
      toast.error('Failed to load business data from analysis files')
    }
  }

  const loadPlatformStatus = async () => {
    try {
      const data = await getPlatformStatus()
      // Convert imported platform status to local format
      const convertedPlatforms: PlatformStatus = {}
      Object.entries(data.platforms).forEach(([platform, config]) => {
        convertedPlatforms[platform] = {
          configured: (config as any).configured,
          status: (config as any).configured ? 'Configured' : 'Setup Required',
          fields_configured: (config as any).configured_fields?.length || 0,
          total_fields: getTotalFieldsCount(platform)
        }
      })
      setPlatforms(convertedPlatforms)
      
      // Update analytics after loading platforms
      loadAnalyticsData()
    } catch (error) {
      console.error('Error loading platform status:', error)
      toast.error('Failed to load platform configurations')
      
      // Set default unconfigured status for all platforms if API fails
      const defaultPlatforms: PlatformStatus = {}
      const platformList: string[] = ['linkedin', 'tiktok', 'facebook', 'instagram', 'x']
      platformList.forEach((platform: string) => {
        defaultPlatforms[platform] = {
          configured: false,
          status: 'Setup Required',
          fields_configured: 0,
          total_fields: getTotalFieldsCount(platform)
        }
      })
      setPlatforms(defaultPlatforms)
    }
  }

  const loadUpcomingPosts = async () => {
    try {
      // Request more posts to ensure we capture all scheduled ones
      const data = await getUpcomingPosts(undefined, 50) // Increased limit
      console.log('Loaded upcoming posts:', data.upcoming_posts) // Debug log
      setUpcomingPosts(data.upcoming_posts || [])
    } catch (error) {
      console.error('Error loading upcoming posts:', error)
      // Don't clear the state on error, keep existing posts
    }
  }

  // Enhanced states for progressive loading and scheduling
  const [loadingPosts, setLoadingPosts] = useState<string[]>([]) // Track which posts are loading
  const [loadedPosts, setLoadedPosts] = useState<SocialMediaPost[]>([])
  const [brandData, setBrandData] = useState<any>(null)
  const [schedulingSuggestions, setSchedulingSuggestions] = useState<any[]>([])
  const [lastGenerationTime, setLastGenerationTime] = useState<number>(0) // Cooldown prevention

  // Load brand identity data
  useEffect(() => {
    const brandIdentity = localStorage.getItem('brandorb_brand_data')
    if (brandIdentity) {
      setBrandData(JSON.parse(brandIdentity))
    }
  }, [])

  const generateMediaForPost = async (postContent: string, platform: string, businessSummary: string, brandColors: string[] = []) => {
    try {
      // Enhanced media generation with brand identity
      const colorGuidance = brandColors.length > 0 
        ? `using brand colors ${brandColors.join(', ')}` 
        : 'using professional color palette'
      
      const mediaPrompt = `
        Create a professional 1:1 square social media visual for ${platformNames[platform]} with these specifications:
        
        Post Content: "${postContent}"
        Business Context: "${businessSummary}"
        Platform: ${platformNames[platform]}
        Brand Colors: ${colorGuidance}
        
        Requirements:
        - 1:1 square format (1080x1080px) suitable for all social platforms
        - ${colorGuidance}
        - Professional, eye-catching design suitable for ${platformNames[platform]}
        - High-quality visual that complements the text content
        - Modern, clean aesthetic with good contrast and readability
        - Include relevant imagery that supports the message
        - No text overlay (text will be added separately)
        - Business/professional theme appropriate for social media marketing
        - Brand-consistent visual style
      `

      // Generate media using Pollinations API with enhanced prompts
      const base_url = "https://image.pollinations.ai/prompt/"
      const encoded_prompt = encodeURIComponent(mediaPrompt)
      
      // Always use 1:1 square format for consistency across platforms
      const params = {
        width: 1080,
        height: 1080,
        seed: Math.floor(Math.random() * 1000000),
        model: 'flux',
        enhance: 'true',
        nologo: 'true'
      }
      
      const param_string = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')
      const full_url = `${base_url}${encoded_prompt}?${param_string}`
      
      console.log('🎨 Generating media for post:', postContent.substring(0, 50) + '...')
      
      const response = await fetch(full_url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/*,*/*'
        }
      })
      
      if (response.ok && response.headers.get('content-length') !== '0') {
        const imageBlob = await response.blob()
        if (imageBlob.size > 1000) {
          // Create both blob URL and base64 data
          const imageUrl = URL.createObjectURL(imageBlob)
          
          // Convert to base64 for backend storage
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              // Return just the base64 part (remove data:image/...;base64,)
              resolve(result.split(',')[1])
            }
            reader.onerror = reject
            reader.readAsDataURL(imageBlob)
          })
          
          console.log('✅ Media generated successfully for', platformNames[platform])
          return {
            imageUrl,
            base64Data
          }
        }
      }
      
      console.log('⚠️ Media generation failed or returned empty image')
      return null
    } catch (error) {
      console.error('❌ Error generating media:', error)
      return null
    }
  }

  const generatePosts = async () => {
    // Cooldown check - prevent rapid multiple clicks
    const now = Date.now()
    const cooldownPeriod = 5000 // 5 seconds
    if (now - lastGenerationTime < cooldownPeriod && lastGenerationTime > 0) {
      const remainingTime = Math.ceil((cooldownPeriod - (now - lastGenerationTime)) / 1000)
      toast.warning(`Please wait ${remainingTime} more seconds before generating again.`)
      return
    }

    // Check if we have business data or user provides summary
    const hasBusinessData = businessData.business_summary || businessSummary
    
    if (!hasBusinessData) {
      toast.error('No business data available. Please run the business analysis first or provide a business summary below.')
      return
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform to generate posts for.')
      return
    }

    if (isGenerating) {
      toast.warning('Posts are already being generated. Please wait for the current generation to complete.')
      return
    }

    // Set cooldown timestamp
    setLastGenerationTime(now)
    setIsGenerating(true)
    setLoadedPosts([])
    setLoadingPosts([])
    
    try {
      toast.info('🤖 Generating AI-optimized social media posts with brand identity...')
      
      // Create skeleton placeholders immediately
      const skeletonIds = Array.from({ length: postCount }, (_, i) => `skeleton-${Date.now()}-${i}`)
      setLoadingPosts(skeletonIds)
      
      // Prepare brand identity data
      const brandIdentityData = brandData ? {
        name: brandData.name || 'Your Brand',
        colors: brandData.colors || [],
        personality: brandData.personality || [],
        customDescription: brandData.customDescription || '',
        logoUrl: brandData.logoUrl || null
      } : null

      console.log('🚀 Calling generateSocialMediaPosts API...')
      
      const data = await generateSocialMediaPosts({
        business_summary: businessSummary || businessData.business_summary,
        marketing_insights: marketingInsights,
        platform: selectedPlatforms.length === 1 ? selectedPlatforms[0] : 'all',
        count: postCount,
        generate_images: generateImages,
        brand_identity: brandIdentityData || undefined,
        include_scheduling: true,
        staggered_loading: true
      })

      console.log('✅ API response received:', data)

      if (!data.posts || !Array.isArray(data.posts)) {
        throw new Error('Invalid response: No posts received from API')
      }

      if (data.posts.length === 0) {
        throw new Error('No posts were generated. Please try again or check your business summary.')
      }

      // Clear skeleton placeholders
      setLoadingPosts([])

      // Progressive loading simulation - load posts one by one
      if (data.posts && data.posts.length > 0) {
        // Use actual post IDs for loading states
        const actualPostIds = data.posts.map(post => post.id)
        setLoadingPosts(actualPostIds)
        
        for (let i = 0; i < data.posts.length; i++) {
          // Add slight delay for better UX
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 800))
          }
          
          let post = data.posts[i]
          
          console.log(`📝 Processing post ${i + 1}/${data.posts.length}: ${post.title}`)
          
          // Generate media for posts if requested and no media was provided
          if (generateImages && !post.image_url && !post.has_media) {
            console.log('🎨 Generating media for post...')
            const brandColors = brandIdentityData?.colors || []
            const mediaResult = await generateMediaForPost(
              post.content, 
              post.platform, 
              businessSummary || businessData.business_summary,
              brandColors
            )
            
            if (mediaResult) {
              post = {
                ...post,
                image_url: mediaResult.imageUrl,
                image_data: mediaResult.base64Data,
                has_media: true,
                content_type: 'image'
              }
              console.log('✅ Media generated successfully')
            } else {
              console.log('⚠️ Media generation failed, continuing without image')
            }
          }

          // Add smart scheduling information
          if (data.scheduled_posts && data.scheduled_posts.length > i) {
            const scheduling = data.scheduled_posts[i]
            post.scheduled_time = scheduling.scheduled_time
            post.optimal_reason = scheduling.optimal_reason
            post.suggested_date = scheduling.suggested_date
            post.suggested_time = scheduling.suggested_time
          } else {
            // Fallback scheduling
            const now = new Date()
            const scheduledTime = new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000) // Next day + i days
            post.scheduled_time = scheduledTime.toISOString()
            post.suggested_date = scheduledTime.toLocaleDateString('en-US', { 
              month: 'long', day: 'numeric', year: 'numeric' 
            })
            post.suggested_time = getOptimalTimeForPlatform(post.platform)
          }
          
          setLoadedPosts(prev => [...prev, post])
          setLoadingPosts(prev => prev.filter(id => id !== post.id))
        }
        
        setGeneratedPosts(data.posts)
        setSchedulingSuggestions(data.scheduled_posts || [])
        
        const mediaCount = data.posts.filter(post => post.image_url || post.has_media).length
        toast.success(
          `Generated ${data.posts.length} brand-consistent posts! ${
            mediaCount > 0 ? `${mediaCount} posts include visual content.` : ''
          }`
        )
        
        console.log('✅ Post generation completed successfully')
      }
      
      // Update analytics after generating posts
      loadAnalyticsData()
      
    } catch (error) {
      console.error('❌ Error generating posts:', error)
      
      // Clear loading states
      setLoadingPosts([])
      
      // Provide specific error feedback
      let errorMessage = 'Failed to generate social media posts. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.'
        } else if (error.message.includes('API')) {
          errorMessage = 'API service is currently unavailable. Please try again in a few moments.'
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const getOptimalTimeForPlatform = (platform: string): string => {
    const optimalTimes: Record<string, string> = {
      linkedin: '9:00 AM',
      instagram: '11:00 AM', 
      facebook: '1:00 PM',
      tiktok: '7:00 PM',
      x: '8:00 AM'
    }
    return optimalTimes[platform] || '12:00 PM'
  }

  // Enhanced skeleton loader component for posts
  const PostCardSkeleton = ({ className }: { className?: string }) => (
    <Card className={`bg-surface border-surface shadow-soft ${className} animate-pulse`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            <div>
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse" />
            
            {/* Skeleton for 1:1 image */}
            <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          </div>
          
          {/* Hashtags skeleton */}
          <div className="flex gap-2">
            <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-14 h-6 bg-gray-200 rounded-full animate-pulse" />
          </div>
          
          {/* Actions skeleton */}
          <div className="flex justify-between pt-3 border-t border-surface">
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
              <div className="w-24 h-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Loading state skeleton for initial generation
  const GenerationSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface flex items-center">
            <Loader2 className="h-5 w-5 mr-2 text-primary animate-spin" />
            Generating Posts ({loadingPosts.length}/{postCount})
          </h2>
          <p className="text-surface-muted mt-1">
            AI is creating brand-consistent posts for your selected platforms...
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: postCount }).map((_, index) => (
          <PostCardSkeleton key={`gen-skeleton-${index}`} />
        ))}
      </div>

      <div className="text-center py-4">
        <div className="inline-flex flex-col items-center gap-3 text-surface-muted">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating brand-consistent posts... Please wait</span>
          </div>
          <div className="text-xs text-surface-muted max-w-md">
            {generateImages ? 
              'Creating posts with AI-generated visuals may take 1-2 minutes' : 
              'This should take about 30-60 seconds'
            }
          </div>
        </div>
      </div>
    </div>
  )

  const generateCustomPost = async () => {
    if (!customPostContent && !customPostKeywords && !customPostMedia) {
      toast.error('Please provide either content, keywords, or upload media to generate a post.')
      return
    }

    setIsGeneratingCustomPost(true)
    try {
      toast.info('🤖 Creating your custom post with AI enhancement...')
      
      // Create a prompt for the AI based on what the user provided
      let prompt = `Create a social media post for ${platformNames[customPostPlatform]}. `
      
      if (customPostContent) {
        prompt += `Based on this content: "${customPostContent}". `
      }
      
      if (customPostKeywords) {
        prompt += `Include these keywords: ${customPostKeywords}. `
      }
      
      if (customPostMedia) {
        prompt += `The user has uploaded media (${customPostMedia.name}). Create content that would work well with visual content. `
      }
      
      prompt += `Make it engaging and platform-appropriate with relevant hashtags.`

      // Generate AI-enhanced content (this would be a real API call in production)
      const enhancedContent = customPostContent || `🚀 Exciting update! ${customPostKeywords ? customPostKeywords.split(' ').map(k => `#${k}`).join(' ') : ''}`
      
      // Generate media if user uploaded media or if they want AI-generated media
      let mediaUrl = null
      let hasMedia = false
      
      if (customPostMedia) {
        // Use the uploaded media
        mediaUrl = URL.createObjectURL(customPostMedia)
        hasMedia = true
        toast.info('✅ Using your uploaded media')
      } else if (customPostContent || customPostKeywords) {
        // Generate AI media based on content/keywords
        toast.info('🎨 Generating visual content for your post...')
        const contentForMedia = customPostContent || `Create visual for: ${customPostKeywords}`
        const mediaResult = await generateMediaForPost(
          contentForMedia,
          customPostPlatform,
          businessSummary || businessData.business_summary || 'Professional business content'
        )
        if (mediaResult) {
          mediaUrl = mediaResult.imageUrl
          hasMedia = true
        }
      }

      const customPost: SocialMediaPost = {
        id: `custom-${Date.now()}`,
        platform: customPostPlatform,
        content_type: hasMedia ? (customPostMedia?.type.includes('video') ? 'video' : 'image') : 'text',
        title: `Custom ${platformNames[customPostPlatform]} Post`,
        content: enhancedContent,
        hashtags: customPostKeywords ? customPostKeywords.split(' ').map(k => k.startsWith('#') ? k : `#${k}`) : ['#innovation', '#growth'],
        optimal_time: 'Custom timing',
        engagement_prediction: hasMedia ? 'high' : 'medium',
        call_to_action: 'Engage with us!',
        image_url: mediaUrl || undefined,
        image_data: mediaResult?.base64Data,
        has_media: hasMedia,
        status: 'draft'
      }

      setGeneratedPosts(prev => [customPost, ...prev])
      
      const mediaMessage = hasMedia ? (customPostMedia ? ' with your uploaded media!' : ' with AI-generated visual!') : '!'
      toast.success(`Custom post created successfully${mediaMessage}`)
      
      // Reset form
      setCustomPostContent('')
      setCustomPostKeywords('')
      setCustomPostMedia(null)
      setShowCustomPostCreator(false)
    } catch (error) {
      console.error('Error generating custom post:', error)
      toast.error('Failed to generate custom post. Please try again.')
    } finally {
      setIsGeneratingCustomPost(false)
    }
  }

  const savePlatformSettings = async (platform: string) => {
    setIsSavingPlatform(true)
    try {
      const config = platformSettings[platform]
      
      // Check if we have any configuration data
      if (!config || Object.keys(config).length === 0) {
        toast.error(`Please fill in at least one field for ${platformNames[platform]}`)
        return
      }

      // Validate that required fields are filled for each platform
      const requiredFields = {
        linkedin: ['client_id', 'client_secret', 'access_token'],
        tiktok: ['client_id', 'client_secret', 'access_token'],
        facebook: ['app_id', 'app_secret', 'access_token', 'page_id'],
        instagram: ['app_id', 'app_secret', 'access_token', 'user_id'],
        x: ['api_key', 'api_secret', 'access_token', 'access_token_secret']
      }

      const platformRequiredFields = requiredFields[platform as keyof typeof requiredFields] || []
      const missingFields = platformRequiredFields.filter(field => !config[field] || !config[field].trim())
      
      if (missingFields.length > 0) {
        toast.error(`Missing required fields for ${platformNames[platform]}: ${missingFields.join(', ')}`)
        return
      }

      console.log('🔧 Saving platform settings for:', platform, 'Config keys:', Object.keys(config))

      const result = await configureAllPlatforms({ [platform]: config })
      
      if (result.success) {
        toast.success(`${platformNames[platform]} settings saved successfully!`)
        setActiveConfigPlatform(null)
        await loadPlatformStatus() // Reload platform status to reflect changes
      } else {
        console.error('❌ Platform configuration failed:', result.message)
        toast.error(result.message || `Failed to save ${platformNames[platform]} settings`)
      }
    } catch (error) {
      console.error(`Error saving ${platform} settings:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to save ${platformNames[platform]} settings: ${errorMessage}`)
    } finally {
      setIsSavingPlatform(false)
    }
  }

  const updatePlatformSetting = (platform: string, key: string, value: string) => {
    console.log('🔧 Updating platform setting:', { platform, key, value: value ? '***' : '(empty)' })
    
    setPlatformSettings(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [key]: value
      }
    }))
  }

  const getConfiguredFieldsCount = (platform: string, config: any) => {
    // Use platformSettings if available, otherwise use the passed config
    const settings = platformSettings[platform] || config
    if (!settings) return 0
    
    const keys = Object.keys(settings)
    return keys.filter(key => settings[key] && settings[key].toString().trim()).length
  }

  // Helper function to convert image URL to base64
  const convertImageToBase64 = async (imageUrl: string): Promise<string | null> => {
    try {
      // If it's already a base64 string, return it
      if (imageUrl.startsWith('data:')) {
        return imageUrl.split(',')[1] // Return just the base64 part
      }
      
      // If it's a blob URL, convert it
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          // Return just the base64 part (remove data:image/...;base64,)
          resolve(result.split(',')[1])
        }
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Error converting image to base64:', error)
      return null
    }
  }

  const getTotalFieldsCount = (platform: string): number => {
    const fieldCounts: { [key: string]: number } = {
      linkedin: 3, // client_id, client_secret, access_token
      tiktok: 3, // client_id, client_secret, access_token
      facebook: 4, // app_id, app_secret, access_token, page_id
      instagram: 4, // app_id, app_secret, access_token, user_id
      x: 4 // api_key, api_secret, access_token, access_token_secret
    }
    return fieldCounts[platform] || 0
  }

  const schedulePost = async (post: SocialMediaPost, immediate = false, skipRefresh = false) => {
    try {
      if (immediate) {
        // Convert image URL to base64 if needed
        let imageData = post.image_data
        if (!imageData && post.image_url && post.has_media) {
          console.log('Converting image URL to base64 for posting...')
          const convertedImage = await convertImageToBase64(post.image_url)
          imageData = convertedImage || undefined
          if (!imageData) {
            console.warn('Failed to convert image to base64, posting without image')
          }
        }
        
        const result = await postToSocialMedia(
          post.id, 
          post.platform, 
          true,
          post.content,
          imageData,
          post.title
        )
        
        // Show detailed success message
        const platformName = post.platform.charAt(0).toUpperCase() + post.platform.slice(1)
        toast.success(`Successfully posted to ${platformName}! 🎉`)
        console.log('Immediate post result:', result)
        
      } else {
        console.log(`Scheduling post ${post.id} for platform ${post.platform}`) // Debug log
        const result = await schedulePosts([post], post.platform, 'optimal')
        console.log(`Scheduled result:`, result) // Debug log
        
        // Immediately add the scheduled post to upcoming posts with a temporary scheduled time
        const scheduledPost = {
          ...post,
          status: 'scheduled' as const,
          scheduled_time: new Date(Date.now() + Math.random() * 86400000 * 7).toISOString() // Random time in next 7 days
        }
        
        // Add to upcoming posts immediately for better UX
        setUpcomingPosts(prev => {
          // Check if post already exists to avoid duplicates
          if (prev.some(p => p.id === post.id)) {
            return prev
          }
          console.log('Adding post to upcoming:', post.id)
          return [...prev, scheduledPost]
        })
        
        if (!immediate) {
          toast.success('Scheduled for optimal engagement time!')
        }
      }
      
      // For individual scheduling (not bulk), refresh to get correct data from server
      if (!skipRefresh) {
        setTimeout(() => loadUpcomingPosts(), 500)
      }
    } catch (error: any) {
      console.error(`Error ${immediate ? 'posting' : 'scheduling'} post:`, error)
      
      // Provide detailed error messages based on error type
      let errorMessage = `Failed to ${immediate ? 'post' : 'schedule'} to ${post.platform}`
      
      if (error.message?.includes('LinkedIn access token is invalid')) {
        errorMessage = 'LinkedIn authentication expired. Please reconnect your account.'
      } else if (error.message?.includes('400')) {
        errorMessage = 'Invalid post content. Please check your post and try again.'
      } else if (error.message?.includes('500')) {
        errorMessage = 'Server error occurred. Please try again in a moment.'
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message) {
        errorMessage += `: ${error.message}`
      } else {
        errorMessage += '. Please check platform configuration.'
      }
      
      toast.error(errorMessage)
      throw error // Re-throw to allow Promise.all to catch it
    }
  }

  const cancelScheduledPostHandler = async (postId: string) => {
    try {
      await cancelScheduledPost(postId)
      toast.success('Scheduled post has been cancelled successfully')
      loadUpcomingPosts()
    } catch (error) {
      console.error('Error cancelling post:', error)
      toast.error('Failed to cancel the scheduled post')
    }
  }

  // Helper functions
  const getPlatformHelpHandler = async (platform: string) => {
    try {
      const helpData = await getPlatformHelp(platform)
      setShowPlatformHelp(JSON.stringify(helpData, null, 2))
    } catch (error) {
      console.error('Error getting platform help:', error)
    }
  }

  const renderPostCard = (post: SocialMediaPost, isUpcoming = false) => (
    <Card key={post.id} className="mb-4 bg-surface border-surface shadow-soft hover:shadow-md transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Platform Icon with Color */}
            <div className={`p-2 rounded-full ${platformColors[post.platform]} text-white flex items-center justify-center`}>
              {post.platform === 'linkedin' && <Linkedin className="h-4 w-4" />}
              {post.platform === 'tiktok' && <Video className="h-4 w-4" />}
              {post.platform === 'facebook' && <Facebook className="h-4 w-4" />}
              {post.platform === 'instagram' && <Instagram className="h-4 w-4" />}
              {post.platform === 'x' && <Twitter className="h-4 w-4" />}
            </div>
            
            <div>
              <h3 className="font-semibold text-surface text-sm group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium text-surface capitalize">
                  {platformNames[post.platform]}
                </span>
                
                {/* Media Indicator */}
                <div className="flex items-center gap-1">
                  {post.image_url || post.has_media ? (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                      <Image className="h-3 w-3" />
                      <span>Media</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-muted text-surface-muted text-xs">
                      <Type className="h-3 w-3" />
                      <span>Text Only</span>
                    </div>
                  )}
                  
                  {post.content_type === 'video' && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs">
                      <Video className="h-3 w-3" />
                      <span>Video</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Engagement Prediction Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              post.engagement_prediction === 'high' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : post.engagement_prediction === 'medium'
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}>
              {post.engagement_prediction} engagement
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Post Content */}
          <div className="space-y-3">
            <p className="text-sm text-surface leading-relaxed line-clamp-4">{post.content}</p>
            
            {/* Media Preview - Always 1:1 format */}
            {post.image_url && (
              <div className="aspect-square rounded-lg overflow-hidden border border-surface shadow-sm bg-surface">
                <img 
                  src={post.image_url} 
                  alt="Post media"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
          </div>

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.hashtags.slice(0, 5).map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
              {post.hashtags.length > 5 && (
                <span className="px-2 py-1 bg-surface-muted text-surface-muted text-xs rounded-full">
                  +{post.hashtags.length - 5} more
                </span>
              )}
            </div>
          )}

          {/* Post Metadata & Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-surface">
            <div className="flex flex-col gap-1 text-xs text-surface-muted">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {isUpcoming 
                    ? `Scheduled: ${post.scheduled_time}` 
                    : post.suggested_date && post.suggested_time
                      ? `Suggested: ${post.suggested_date} at ${post.suggested_time}`
                      : `Optimal: ${post.optimal_time}`
                  }
                </span>
              </div>
              
              {post.optimal_reason && (
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>{post.optimal_reason}</span>
                </div>
              )}
              
              {post.call_to_action && (
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  <span className="max-w-[150px] truncate">{post.call_to_action}</span>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {!isUpcoming && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => schedulePost(post, true)}
                    className="h-8 px-3 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Post Now
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => schedulePost(post, false)}
                    className="h-8 px-3 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all"
                  >
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Schedule
                  </Button>
                </>
              )}
              
              {isUpcoming && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cancelScheduledPostHandler(post.id)}
                  className="h-8 px-3 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Post management functions
  const handlePostClick = async (post: any) => {
    try {
      // Try to fetch the complete post details from backend
      const response = await fetch(`http://localhost:8000/get_scheduled_post/${post.id}`)
      if (response.ok) {
        const fullPost = await response.json()
        setSelectedPost(fullPost.post || post)
      } else {
        // Fallback to the post we already have
        setSelectedPost(post)
      }
    } catch (error) {
      console.error('Error fetching full post details:', error)
      // Fallback to the post we already have
      setSelectedPost(post)
    }
    setShowPostModal(true)
  }

  const handleReschedulePost = async (newDateTime: string) => {
    if (!selectedPost) return
    
    setPostModalLoading(true)
    try {
      const response = await fetch('http://localhost:8000/reschedule_post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_id: selectedPost.id,
          new_scheduled_time: newDateTime
        })
      })
      
      if (response.ok) {
        toast.success('Post rescheduled successfully!')
        loadUpcomingPosts()
        setShowPostModal(false)
      } else {
        toast.error('Failed to reschedule post')
      }
    } catch (error) {
      console.error('Error rescheduling post:', error)
      toast.error('Failed to reschedule post')
    } finally {
      setPostModalLoading(false)
    }
  }

  const handleRegenerateMedia = async () => {
    if (!selectedPost) return
    
    setPostModalLoading(true)
    try {
      const response = await fetch('http://localhost:8000/regenerate_post_media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_id: selectedPost.id
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setSelectedPost(result.post)
        toast.success('Media regenerated successfully!')
        loadUpcomingPosts()
      } else {
        toast.error('Failed to regenerate media')
      }
    } catch (error) {
      console.error('Error regenerating media:', error)
      toast.error('Failed to regenerate media')
    } finally {
      setPostModalLoading(false)
    }
  }

  const handleRegenerateContent = async () => {
    if (!selectedPost) return
    
    setPostModalLoading(true)
    try {
      const response = await fetch('http://localhost:8000/regenerate_post_content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_id: selectedPost.id
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setSelectedPost(result.post)
        toast.success('Content regenerated successfully!')
        loadUpcomingPosts()
      } else {
        toast.error('Failed to regenerate content')
      }
    } catch (error) {
      console.error('Error regenerating content:', error)
      toast.error('Failed to regenerate content')
    } finally {
      setPostModalLoading(false)
    }
  }

  const handleCancelPost = async () => {
    if (!selectedPost) return
    
    setPostModalLoading(true)
    try {
      await cancelScheduledPostHandler(selectedPost.id)
      setShowPostModal(false)
      loadUpcomingPosts()
    } catch (error) {
      console.error('Error canceling post:', error)
    } finally {
      setPostModalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-surface">Loading social media management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-surface border-b border-surface px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-surface">Social Media Management</h1>
              <p className="text-surface-muted mt-1">
                Generate, schedule, and manage your social media content across all platforms
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {sidebarOpen ? 'Hide' : 'Show'} Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="p-6 border-b border-surface">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="bg-surface border-surface shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                  Engagement Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{analyticsData.engagementRate}</div>
                  <p className="text-sm text-surface-muted">Average Engagement Rate</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-surface shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Send className="h-4 w-4 mr-2 text-primary" />
                  Posts This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{analyticsData.postsThisMonth}</div>
                  <p className="text-sm text-surface-muted">Content Published</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-surface shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Linkedin className="h-4 w-4 mr-2 text-primary" />
                  Top Platform
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{analyticsData.topPlatform}</div>
                  <p className="text-sm text-surface-muted">Best Performing</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Top Section - Content Generator and Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Content Generation Section */}
              <Card className="bg-surface border-surface shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-primary" />
                    AI Content Generator
                  </CardTitle>
                  <CardDescription className="text-surface-muted">
                    Generate engaging social media posts tailored to your business and audience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    {/* Business Summary Input (if no business data available) */}
                    {!businessData.business_summary && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block text-surface">Business Summary</Label>
                        <textarea
                          value={businessSummary}
                          onChange={(e) => setBusinessSummary(e.target.value)}
                          placeholder="Describe your business, products, and target audience..."
                          className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-surface bg-surface text-surface resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    )}

                    {/* Platform Selection */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block text-surface">Target Platforms</Label>
                      <div className="flex flex-wrap gap-3">
                        {['linkedin', 'tiktok', 'facebook', 'instagram', 'x'].map((platform) => {
                          const isSelected = selectedPlatforms.includes(platform)
                          const platformColor = platformColors[platform]
                          
                          return (
                            <button
                              key={platform}
                              onClick={() => {
                                setSelectedPlatforms(prev =>
                                  prev.includes(platform)
                                    ? prev.filter(p => p !== platform)
                                    : [...prev, platform]
                                )
                              }}
                              className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200
                                ${isSelected 
                                  ? `${platformColor} text-white border-transparent shadow-soft` 
                                  : 'bg-surface-muted text-surface-muted border-surface hover:bg-surface-hover hover:text-surface'
                                }
                              `}
                            >
                              <div className={`flex items-center justify-center w-4 h-4 ${isSelected ? 'text-white' : ''}`}>
                                {platform === 'linkedin' && <Linkedin className="h-4 w-4" />}
                                {platform === 'tiktok' && <Video className="h-4 w-4" />}
                                {platform === 'facebook' && <Facebook className="h-4 w-4" />}
                                {platform === 'instagram' && <Instagram className="h-4 w-4" />}
                                {platform === 'x' && <Twitter className="h-4 w-4" />}
                              </div>
                              <span className={`text-sm font-medium capitalize ${isSelected ? 'text-white' : ''}`}>
                                {platformNames[platform]}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Generation Options */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="post-count" className="text-sm font-medium text-surface">Number of Posts</Label>
                        <Select value={postCount.toString()} onValueChange={(value) => setPostCount(parseInt(value))}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[3, 5, 10, 15, 20].map((num) => (
                              <SelectItem key={num} value={num.toString()}>{num} posts</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r">
                        <Switch
                          id="generate-images"
                          checked={generateImages}
                          onCheckedChange={setGenerateImages}
                          className=""
                        />
                        <div className="flex items-center gap-2">
                          <Label htmlFor="generate-images" className="text-sm font-mediumcursor-pointer">
                            Generate AI Images
                          </Label>
                          
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                        onClick={generatePosts}
                        disabled={isGenerating || selectedPlatforms.length === 0}
                        className="w-full h-12 relative overflow-hidden text-white"
                        style={{ color: 'white' }}
                    >
                        {isGenerating ? (
                            <>
                                <div className="flex items-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <span className="text-white">Generating Posts...</span>
                                </div>
                                {/* Progress bar effect */}
                                <div
                                    className="absolute bottom-0 left-0 h-1 bg-white/30 animate-pulse transition-all duration-300"
                                    style={{ width: `${Math.min(((loadedPosts.length / postCount) * 100), 100)}%` }}
                                />
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4 text-white" />
                                <span className="text-white">Generate AI Posts</span>
                            </>
                        )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setShowCustomPostCreator(!showCustomPostCreator)}
                      className="w-full h-12"
                      disabled={isGenerating}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Custom Post
                    </Button>

                    {/* Generation Status */}
                    {isGenerating && (
                      <div className="text-center text-sm text-surface-muted">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          <span>AI is working on your {selectedPlatforms.map(p => platformNames[p]).join(', ')} posts</span>
                        </div>
                        <div className="text-xs text-surface-muted/80">
                          {generateImages ? 
                            'Including AI-generated visuals • Please wait 1-2 minutes' : 
                            'Text posts • Should complete in 30-60 seconds'
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Calendar */}
              <Card className="bg-surface border-surface shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
                      Weekly Schedule
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateWeek('prev')}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-sm font-medium min-w-[120px] text-center">
                        {currentWeekStart.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })} - {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateWeek('next')}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-surface-muted">
                    View and manage your scheduled content across the week
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="bg-white rounded-lg overflow-hidden">
                    {/* Week Header */}
                    <div className="grid grid-cols-7 border-b">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                        const date = currentWeekDates[index]
                        const isToday = date.toDateString() === new Date().toDateString()
                        return (
                          <div key={day} className="p-3 text-center border-r last:border-r-0 bg-gray-50">
                            <div className="text-sm font-medium text-gray-900">{day}</div>
                            <div className={`text-lg font-bold mt-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                              {date.getDate()}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Week Content */}
                    <div className="grid grid-cols-7 min-h-[300px]">
                      {currentWeekDates.map((date, dayIndex) => {
                        const morningPosts = getPostsForDateAndTime(date, 'morning')
                        const afternoonPosts = getPostsForDateAndTime(date, 'afternoon')
                        const eveningPosts = getPostsForDateAndTime(date, 'evening')
                        
                        return (
                          <div key={dayIndex} className="border-r last:border-r-0 p-2 space-y-1 bg-white min-h-[300px]">
                            {/* Morning Posts (6am-12pm) */}
                            {morningPosts.map((post, index) => (
                              <div 
                                key={`morning-${post.id}`} 
                                className="group relative"
                                style={{
                                  marginTop: index > 0 ? '2px' : '0'
                                }}
                              >
                                <div 
                                  className="flex items-center gap-1 p-1 rounded text-xs bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-colors cursor-pointer"
                                  onClick={() => handlePostClick(post)}
                                >
                                  {/* Platform Icon */}
                                  <div className="flex-shrink-0">
                                    {post.platform === 'linkedin' && <Linkedin className="h-3 w-3 text-blue-600" />}
                                    {post.platform === 'facebook' && <Facebook className="h-3 w-3 text-blue-600" />}
                                    {post.platform === 'instagram' && <Instagram className="h-3 w-3 text-pink-600" />}
                                    {post.platform === 'tiktok' && <Video className="h-3 w-3 text-black" />}
                                    {post.platform === 'x' && <Twitter className="h-3 w-3 text-black" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-gray-800 truncate">
                                      {post.title}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {post.scheduled_time && new Date(post.scheduled_time).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Hover tooltip */}
                                <div className="absolute left-0 top-full mt-1 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-48 pointer-events-none">
                                  <div className="font-medium">{post.title}</div>
                                  <div className="text-gray-300 mt-1">{post.content?.slice(0, 100)}...</div>
                                  <div className="text-gray-400 text-xs mt-1">Click to manage</div>
                                </div>
                              </div>
                            ))}

                            {/* Afternoon Posts (12pm-6pm) */}
                            {afternoonPosts.map((post, index) => (
                              <div 
                                key={`afternoon-${post.id}`} 
                                className="group relative"
                                style={{
                                  marginTop: (morningPosts.length > 0 || index > 0) ? '2px' : '0'
                                }}
                              >
                                <div 
                                  className="flex items-center gap-1 p-1 rounded text-xs bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer"
                                  onClick={() => handlePostClick(post)}
                                >
                                  {/* Platform Icon */}
                                  <div className="flex-shrink-0">
                                    {post.platform === 'linkedin' && <Linkedin className="h-3 w-3 text-blue-600" />}
                                    {post.platform === 'facebook' && <Facebook className="h-3 w-3 text-blue-600" />}
                                    {post.platform === 'instagram' && <Instagram className="h-3 w-3 text-pink-600" />}
                                    {post.platform === 'tiktok' && <Video className="h-3 w-3 text-black" />}
                                    {post.platform === 'x' && <Twitter className="h-3 w-3 text-black" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-gray-800 truncate">
                                      {post.title}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {post.scheduled_time && new Date(post.scheduled_time).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Hover tooltip */}
                                <div className="absolute left-0 top-full mt-1 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-48 pointer-events-none">
                                  <div className="font-medium">{post.title}</div>
                                  <div className="text-gray-300 mt-1">{post.content?.slice(0, 100)}...</div>
                                  <div className="text-gray-400 text-xs mt-1">Click to manage</div>
                                </div>
                              </div>
                            ))}

                            {/* Evening Posts (6pm-12am) */}
                            {eveningPosts.map((post, index) => (
                              <div 
                                key={`evening-${post.id}`} 
                                className="group relative"
                                style={{
                                  marginTop: (morningPosts.length > 0 || afternoonPosts.length > 0 || index > 0) ? '2px' : '0'
                                }}
                              >
                                <div 
                                  className="flex items-center gap-1 p-1 rounded text-xs bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
                                  onClick={() => handlePostClick(post)}
                                >
                                  {/* Platform Icon */}
                                  <div className="flex-shrink-0">
                                    {post.platform === 'linkedin' && <Linkedin className="h-3 w-3 text-blue-600" />}
                                    {post.platform === 'facebook' && <Facebook className="h-3 w-3 text-blue-600" />}
                                    {post.platform === 'instagram' && <Instagram className="h-3 w-3 text-pink-600" />}
                                    {post.platform === 'tiktok' && <Video className="h-3 w-3 text-black" />}
                                    {post.platform === 'x' && <Twitter className="h-3 w-3 text-black" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-gray-800 truncate">
                                      {post.title}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {post.scheduled_time && new Date(post.scheduled_time).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Hover tooltip */}
                                <div className="absolute left-0 top-full mt-1 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-48 pointer-events-none">
                                  <div className="font-medium">{post.title}</div>
                                  <div className="text-gray-300 mt-1">{post.content?.slice(0, 100)}...</div>
                                  <div className="text-gray-400 text-xs mt-1">Click to manage</div>
                                </div>
                              </div>
                            ))}

                            {/* Empty State */}
                            {morningPosts.length === 0 && afternoonPosts.length === 0 && eveningPosts.length === 0 && (
                              <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                                No posts
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Quick Stats */}
                    <div className="border-t bg-gray-50 px-4 py-2">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <div>
                          Total posts this week: {upcomingPosts.filter(post => {
                            if (!post.scheduled_time) return false
                            const postDate = new Date(post.scheduled_time)
                            return postDate >= currentWeekStart && 
                                   postDate < new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
                          }).length}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-yellow-300 rounded"></div>
                            <span>Morning</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-orange-300 rounded"></div>
                            <span>Afternoon</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-purple-300 rounded"></div>
                            <span>Evening</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Post Management Modal */}
            {showPostModal && selectedPost && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white/98 backdrop-blur-lg rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50 relative">
                  {/* Loading Overlay */}
                  {postModalLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] rounded-2xl z-10 flex items-center justify-center">
                      <div className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                        <span className="text-gray-700 font-medium">
                          Posting to {selectedPost?.platform?.charAt(0).toUpperCase() + selectedPost?.platform?.slice(1)}...
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${platformColors[selectedPost.platform]} text-white shadow-md`}>
                          {selectedPost.platform === 'linkedin' && <Linkedin className="h-5 w-5" />}
                          {selectedPost.platform === 'facebook' && <Facebook className="h-5 w-5" />}
                          {selectedPost.platform === 'instagram' && <Instagram className="h-5 w-5" />}
                          {selectedPost.platform === 'tiktok' && <Video className="h-5 w-5" />}
                          {selectedPost.platform === 'x' && <Twitter className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{selectedPost.title}</h3>
                          <p className="text-sm text-gray-500 capitalize">
                            {selectedPost.platform} • {selectedPost.scheduled_time && new Date(selectedPost.scheduled_time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowPostModal(false)}
                        disabled={postModalLoading}
                        className="h-10 w-10 p-0 rounded-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Content Preview */}
                    <div className="space-y-6 mb-6">
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-900">Content Preview</h4>
                        <div className="p-4 bg-gradient-to-br from-slate-50 to-gray-50/80 rounded-xl border border-gray-200">
                          <p className="text-sm whitespace-pre-wrap text-gray-700 leading-relaxed">{selectedPost.content}</p>
                          {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {selectedPost.hashtags.map((tag: string, index: number) => (
                                <span key={index} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-100 font-medium">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {(selectedPost.image_path || selectedPost.image_url) && (
                        <div>
                          <h4 className="font-semibold mb-3 text-gray-900">Media Content</h4>
                          <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 p-2">
                            <img 
                              src={selectedPost.image_path || selectedPost.image_url} 
                              alt="Post media" 
                              className="w-full max-w-md mx-auto rounded-lg shadow-sm"
                              onError={(e) => {
                                console.log('Image failed to load:', selectedPost.image_path || selectedPost.image_url)
                                e.currentTarget.style.display = 'none'
                                // Show fallback
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'block'
                              }}
                              onLoad={() => console.log('Image loaded successfully')}
                            />
                            <div style={{ display: 'none' }} className="text-center py-8 text-gray-500">
                              <Image className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                              <p className="text-sm font-medium">Failed to load media</p>
                              <p className="text-xs text-gray-400 mt-1 font-mono break-all">
                                {selectedPost.image_path || selectedPost.image_url}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Show media indicator even if no image URL */}
                      {(selectedPost.has_media && !selectedPost.image_path && !selectedPost.image_url) && (
                        <div>
                          <h4 className="font-semibold mb-3 text-gray-900">Media Content</h4>
                          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
                            <Image className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-sm font-medium text-gray-600">Media attached but not loaded</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Content type: <span className="font-mono">{selectedPost.content_type || 'Unknown'}</span>
                            </p>
                            {/* Debug info */}
                            <details className="mt-4 text-xs text-left">
                              <summary className="cursor-pointer text-gray-400 hover:text-gray-600">Debug Info</summary>
                              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono text-gray-600 whitespace-pre-wrap">
                                {JSON.stringify({
                                  id: selectedPost.id,
                                  has_media: selectedPost.has_media,
                                  content_type: selectedPost.content_type,
                                  image_path: selectedPost.image_path,
                                  image_url: selectedPost.image_url
                                }, null, 2)}
                              </pre>
                            </details>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-6 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          onClick={handleRegenerateContent}
                          disabled={postModalLoading}
                          className="flex items-center gap-2 h-12 bg-white hover:bg-blue-50 hover:border-blue-300 border-gray-200 hover:text-blue-700 transition-all"
                        >
                          <RefreshCw className={`h-4 w-4 ${postModalLoading ? 'animate-spin' : ''}`} />
                          Regenerate Content
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleRegenerateMedia}
                          disabled={postModalLoading}
                          className="flex items-center gap-2 h-12 bg-white hover:bg-purple-50 hover:border-purple-300 border-gray-200 hover:text-purple-700 transition-all"
                        >
                          <Image className="h-4 w-4" />
                          Regenerate Media
                        </Button>
                      </div>

                      {/* Reschedule Section */}
                      <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-xl p-4 border border-blue-200">
                        <h4 className="font-semibold mb-3 text-blue-900 flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          Reschedule Post
                        </h4>
                        <div className="flex gap-3">
                          <input
                            type="datetime-local"
                            className="flex-1 px-4 py-2 border border-blue-200 rounded-lg text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                            defaultValue={selectedPost.scheduled_time ? new Date(selectedPost.scheduled_time).toISOString().slice(0, 16) : ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                handleReschedulePost(e.target.value)
                              }
                            }}
                            disabled={postModalLoading}
                          />
                        </div>
                      </div>

                      {/* Post Now Button */}
                      <Button
                        onClick={async () => {
                          if (selectedPost) {
                            setPostModalLoading(true)
                            try {
                              await schedulePost(selectedPost, true)
                              // Only close modal on successful posting
                              setShowPostModal(false)
                            } catch (error) {
                              // Error is already handled in schedulePost function
                              // Keep modal open so user can try again
                              console.error('Error in Post Now:', error)
                            } finally {
                              setPostModalLoading(false)
                            }
                          }
                        }}
                        disabled={postModalLoading}
                        className="w-full h-12 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600 text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        {postModalLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Posting to {selectedPost?.platform?.charAt(0).toUpperCase() + selectedPost?.platform?.slice(1)}...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Post Now
                          </>
                        )}
                      </Button>

                      {/* Delete Post Alert Dialog */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            disabled={postModalLoading}
                            className="w-full h-12 text-red-600 hover:bg-red-50 hover:border-red-200 border-gray-300 bg-white transition-all"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Cancel & Delete Post
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the scheduled post
                              and remove it from your content calendar.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleCancelPost}
                              disabled={postModalLoading}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              {postModalLoading ? 'Deleting...' : 'Delete Post'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Post Creator */}
            {showCustomPostCreator && (
              <Card className="bg-surface border-surface shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2 text-primary" />
                    Create Custom Post
                  </CardTitle>
                  <CardDescription className="text-surface-muted">
                    Upload your own content or provide keywords to generate a custom social media post
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    {/* Platform Selection for Custom Post */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block text-surface">Target Platform</Label>
                      <Select value={customPostPlatform} onValueChange={setCustomPostPlatform}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(platformNames).map(([key, name]) => (
                            <SelectItem key={key} value={key}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Content Input Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Text Content */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 flex items-center text-surface">
                            <Type className="h-4 w-4 mr-2" />
                            Post Content
                          </Label>
                          <textarea
                            value={customPostContent}
                            onChange={(e) => setCustomPostContent(e.target.value)}
                            placeholder="Write your post content here..."
                            className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-surface bg-surface text-surface resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block text-surface">Keywords</Label>
                          <Input
                            value={customPostKeywords}
                            onChange={(e) => setCustomPostKeywords(e.target.value)}
                            placeholder="innovation growth technology startup..."
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Media Upload */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 flex items-center text-surface">
                            <Image className="h-4 w-4 mr-2" />
                            Media Upload
                          </Label>
                          <div className="border-2 border-dashed border-surface rounded-lg p-6 text-center transition-colors hover:border-primary/50">
                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={(e) => setCustomPostMedia(e.target.files?.[0] || null)}
                              className="hidden"
                              id="media-upload"
                            />
                            <label htmlFor="media-upload" className="cursor-pointer">
                              <div className="flex flex-col items-center space-y-2">
                                <Upload className="h-8 w-8 text-surface-muted" />
                                <div className="text-sm text-surface-muted">
                                  {customPostMedia ? (
                                    <span className="text-primary font-medium">{customPostMedia.name}</span>
                                  ) : (
                                    <>Click to upload image or video</>
                                  )}
                                </div>
                              </div>
                            </label>
                          </div>
                          {customPostMedia && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCustomPostMedia(null)}
                              className="mt-2"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                      onClick={generateCustomPost}
                      disabled={isGeneratingCustomPost || (!customPostContent && !customPostKeywords && !customPostMedia)}
                      className="w-full h-12"
                    >
                      {isGeneratingCustomPost ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Post...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Custom Post
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generated Posts - Enhanced Loading States */}
            {(generatedPosts.length > 0 || loadingPosts.length > 0 || isGenerating) && (
              <div className="space-y-6">
                {/* Show generation skeleton immediately when starting */}
                {isGenerating && generatedPosts.length === 0 && loadedPosts.length === 0 && (
                  <GenerationSkeleton />
                )}

                {/* Show progressive loading once posts start coming in */}
                {(generatedPosts.length > 0 || loadedPosts.length > 0 || (!isGenerating && loadingPosts.length === 0)) && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-surface flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-green-500" />
                          {isGenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating Posts ({loadedPosts.length}/{postCount})
                            </>
                          ) : (
                            <>Generated Posts ({generatedPosts.length})</>
                          )}
                        </h2>
                        <p className="text-surface-muted mt-1">
                          {isGenerating ? (
                            'AI is creating brand-consistent content for your platforms...'
                          ) : (
                            <>
                              Review and schedule your AI-generated content across platforms
                              {schedulingSuggestions.length > 0 && (
                                <span className="text-green-600 ml-2">• Smart scheduling enabled</span>
                              )}
                            </>
                          )}
                        </p>
                      </div>
                      
                      {/* Quick Actions - Only show when not generating */}
                      {!isGenerating && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              setIsSchedulingAll(true)
                              try {
                                console.log('Scheduling posts:', generatedPosts.map(p => p.id)) // Debug log
                                
                                // Schedule all posts in parallel with proper error handling
                                await Promise.all(generatedPosts.map(post => schedulePost(post, false, true)))
                                
                                // Wait longer for the API to process and save to database
                                await new Promise(resolve => setTimeout(resolve, 2000))
                                
                                // Force reload upcoming posts multiple times to ensure we get the data
                                console.log('Before refresh, upcomingPosts:', upcomingPosts.length)
                                await loadUpcomingPosts()
                                
                                // Wait a bit more and try again if needed
                                await new Promise(resolve => setTimeout(resolve, 1000))
                                await loadUpcomingPosts()
                                
                                console.log('After refresh, upcomingPosts:', upcomingPosts.length)
                                
                                toast.success('All posts scheduled for optimal times!')
                                
                                // Only clear generated posts if we can confirm they're in upcoming posts
                                // Or don't clear them at all to keep them visible
                                // setGeneratedPosts([])
                                // setLoadedPosts([])
                                // setLoadingPosts([])
                              } catch (error) {
                                toast.error('Some posts failed to schedule. Please try again.')
                                console.error('Error scheduling all posts:', error)
                              } finally {
                                setIsSchedulingAll(false)
                              }
                            }}
                            className="hover:bg-blue-50"
                            disabled={generatedPosts.length === 0 || isSchedulingAll}
                          >
                            {isSchedulingAll ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Scheduling...
                              </>
                            ) : (
                              <>
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                Schedule All
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              console.log('Manual refresh triggered')
                              await loadUpcomingPosts()
                              toast.success('Calendar refreshed!')
                            }}
                            className="hover:bg-green-50"
                          >
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            Refresh Calendar
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setGeneratedPosts([])
                              setLoadedPosts([])
                              setLoadingPosts([])
                              toast.success('Generated posts cleared!')
                            }}
                            className="hover:bg-red-50"
                            disabled={generatedPosts.length === 0 && loadingPosts.length === 0}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Clear Generated Posts
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Uniform Bento Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Loaded Posts */}
                      {loadedPosts.map((post) => (
                        <div key={post.id}>
                          {renderPostCard(post)}
                        </div>
                      ))}
                      
                      {/* Loading Skeletons - Only show during progressive loading */}
                      {!isGenerating || loadedPosts.length > 0 ? (
                        loadingPosts.map((postId, index) => (
                          <PostCardSkeleton key={postId} />
                        ))
                      ) : null}
                      
                      {/* Remaining posts that haven't loaded yet */}
                      {!isGenerating && generatedPosts.filter(post => 
                        !loadedPosts.find(loaded => loaded.id === post.id) && 
                        !loadingPosts.includes(post.id)
                      ).map((post) => (
                        <div key={post.id}>
                          {renderPostCard(post)}
                        </div>
                      ))}
                    </div>
                    
                    {/* Progress indicator during progressive loading */}
                    {isGenerating && loadedPosts.length > 0 && (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 text-surface-muted">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading posts ({loadedPosts.length}/{postCount})...</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Help Panel */}
            {showPlatformHelp && (
              <Card className="bg-surface border-surface shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                    Platform Setup Instructions
                  </CardTitle>
                  <CardDescription className="text-surface-muted">
                    Detailed setup instructions for the selected platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <pre className="text-xs whitespace-pre-wrap bg-surface-muted p-4 rounded-lg text-surface">
                      {showPlatformHelp}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Platform Settings Sidebar */}
      <div 
        className={`fixed right-0 top-0 h-full transition-transform duration-300 ease-in-out z-50 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ 
          width: '380px',
          boxShadow: '-4px 0 15px -1px rgba(0, 0, 0, 0.1), -2px 0 6px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        <Sidebar side="right" className="w-full border-l border-surface bg-surface">
          <SidebarHeader className="border-b border-surface bg-surface-muted px-4 py-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-surface-muted" />
                <h2 className="font-semibold text-surface">Platform Settings</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="hover:bg-surface-hover"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SidebarHeader>

          <SidebarContent className="bg-surface">
            <div className="p-4 bg-surface">
              <p className="text-sm text-surface-muted mb-4">
                Current status of your social media platform integrations
              </p>

              {/* Platform Configuration Status */}
              <div className="space-y-3">
                {Object.entries(platforms).map(([platform, config]) => {
                  const configuredFields = config.fields_configured || 0 // Use backend data
                  const totalFields = config.total_fields || getTotalFieldsCount(platform) // Use backend data first
                  const isConfigured = config.configured // Use the actual configured status from backend
                  const isExpanded = activeConfigPlatform === platform

                  return (
                    <div key={platform} className="border border-surface rounded-lg overflow-hidden bg-surface shadow-soft">
                      {/* Platform Header */}
                      <div
                        className="p-3 cursor-pointer hover:bg-surface-hover transition-colors"
                        onClick={() => setActiveConfigPlatform(isExpanded ? null : platform)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${platformColors[platform]} text-white`}>
                              {platform === 'linkedin' && <Linkedin className="h-4 w-4" />}
                              {platform === 'tiktok' && <Video className="h-4 w-4" />}
                              {platform === 'facebook' && <Facebook className="h-4 w-4" />}
                              {platform === 'instagram' && <Instagram className="h-4 w-4" />}
                              {platform === 'x' && <Twitter className="h-4 w-4" />}
                            </div>
                            <div>
                              <div className="font-medium text-surface">
                                {platformNames[platform]}
                              </div>
                              <div className="text-xs text-surface-muted">
                                {configuredFields}/{totalFields} fields configured
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isConfigured
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-surface-muted text-surface-muted'
                            }`}>
                              {isConfigured ? 'Configured' : 'Setup Required'}
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-surface-muted" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-surface-muted" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Platform Configuration Form */}
                      {isExpanded && (
                        <div className="px-3 pb-3 bg-surface-muted border-t border-surface">
                          <div className="space-y-3 pt-3">
                            {platform === 'linkedin' && (
                              <>
                                <div>
                                  <Label htmlFor={`${platform}-client-id`} className="text-xs font-medium text-surface">Client ID</Label>
                                  <Input
                                    id={`${platform}-client-id`}
                                    value={platformSettings[platform]?.client_id || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'client_id', e.target.value)}
                                    placeholder="LinkedIn Client ID"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${platform}-client-secret`} className="text-xs font-medium text-surface">Client Secret</Label>
                                  <Input
                                    id={`${platform}-client-secret`}
                                    type="password"
                                    value={platformSettings[platform]?.client_secret || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'client_secret', e.target.value)}
                                    placeholder="LinkedIn Client Secret"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${platform}-access-token`} className="text-xs font-medium text-surface">Access Token</Label>
                                  <Input
                                    id={`${platform}-access-token`}
                                    type="password"
                                    value={platformSettings[platform]?.access_token || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'access_token', e.target.value)}
                                    placeholder="LinkedIn Access Token"
                                    className="mt-1"
                                  />
                                </div>
                              </>
                            )}
                            
                            {platform === 'tiktok' && (
                              <>
                                <div>
                                  <Label htmlFor={`${platform}-client-id`} className="text-xs font-medium text-surface">Client ID</Label>
                                  <Input
                                    id={`${platform}-client-id`}
                                    value={platformSettings[platform]?.client_id || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'client_id', e.target.value)}
                                    placeholder="TikTok Client ID"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${platform}-client-secret`} className="text-xs font-medium text-surface">Client Secret</Label>
                                  <Input
                                    id={`${platform}-client-secret`}
                                    type="password"
                                    value={platformSettings[platform]?.client_secret || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'client_secret', e.target.value)}
                                    placeholder="TikTok Client Secret"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${platform}-access-token`} className="text-xs font-medium text-surface">Access Token</Label>
                                  <Input
                                    id={`${platform}-access-token`}
                                    type="password"
                                    value={platformSettings[platform]?.access_token || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'access_token', e.target.value)}
                                    placeholder="TikTok Access Token"
                                    className="mt-1"
                                  />
                                </div>
                              </>
                            )}

                            {platform === 'facebook' && (
                              <>
                                <div>
                                  <Label htmlFor={`${platform}-app-id`} className="text-xs font-medium text-surface">App ID</Label>
                                  <Input
                                    id={`${platform}-app-id`}
                                    value={platformSettings[platform]?.app_id || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'app_id', e.target.value)}
                                    placeholder="Facebook App ID"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${platform}-app-secret`} className="text-xs font-medium text-surface">App Secret</Label>
                                  <Input
                                    id={`${platform}-app-secret`}
                                    type="password"
                                    value={platformSettings[platform]?.app_secret || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'app_secret', e.target.value)}
                                    placeholder="Facebook App Secret"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${platform}-access-token`} className="text-xs font-medium text-surface">Access Token</Label>
                                  <Input
                                    id={`${platform}-access-token`}
                                    type="password"
                                    value={platformSettings[platform]?.access_token || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'access_token', e.target.value)}
                                    placeholder="Facebook Access Token"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${platform}-page-id`} className="text-xs font-medium text-surface">Page ID</Label>
                                  <Input
                                    id={`${platform}-page-id`}
                                    value={platformSettings[platform]?.page_id || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'page_id', e.target.value)}
                                    placeholder="Facebook Page ID"
                                    className="mt-1"
                                  />
                                </div>
                              </>
                            )}

                            {platform === 'instagram' && (
                              <>
                                <div>
                                  <Label htmlFor={`${platform}-app-id`} className="text-xs font-medium text-surface">App ID</Label>
                                  <Input
                                    id={`${platform}-app-id`}
                                    value={platformSettings[platform]?.app_id || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'app_id', e.target.value)}
                                    placeholder="Instagram App ID"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${platform}-app-secret`} className="text-xs font-medium text-surface">App Secret</Label>
                                  <Input
                                    id={`${platform}-app-secret`}
                                    type="password"
                                    value={platformSettings[platform]?.app_secret || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'app_secret', e.target.value)}
                                    placeholder="Instagram App Secret"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${platform}-access-token`} className="text-xs font-medium text-surface">Access Token</Label>
                                  <Input
                                    id={`${platform}-access-token`}
                                    type="password"
                                    value={platformSettings[platform]?.access_token || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'access_token', e.target.value)}
                                    placeholder="Instagram Access Token"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${platform}-user-id`} className="text-xs font-medium text-surface">User ID</Label>
                                  <Input
                                    id={`${platform}-user-id`}
                                    value={platformSettings[platform]?.user_id || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'user_id', e.target.value)}
                                    placeholder="Instagram User ID"
                                    className="mt-1"
                                  />
                                </div>
                              </>
                            )}

                            {platform === 'x' && (
                              <>
                                <div>
                                  <Label htmlFor={`${platform}-api-key`} className="text-xs font-medium text-surface">API Key</Label>
                                  <Input
                                    id={`${platform}-api-key`}
                                    value={platformSettings[platform]?.api_key || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'api_key', e.target.value)}
                                    placeholder="X API Key"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${platform}-api-secret`} className="text-xs font-medium text-surface">API Secret</Label>
                                  <Input
                                    id={`${platform}-api-secret`}
                                    type="password"
                                    value={platformSettings[platform]?.api_secret || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'api_secret', e.target.value)}
                                    placeholder="X API Secret"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${platform}-access-token`} className="text-xs font-medium text-surface">Access Token</Label>
                                  <Input
                                    id={`${platform}-access-token`}
                                    type="password"
                                    value={platformSettings[platform]?.access_token || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'access_token', e.target.value)}
                                    placeholder="X Access Token"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${platform}-access-token-secret`} className="text-xs font-medium text-surface">Access Token Secret</Label>
                                  <Input
                                    id={`${platform}-access-token-secret`}
                                    type="password"
                                    value={platformSettings[platform]?.access_token_secret || ''}
                                    onChange={(e) => updatePlatformSetting(platform, 'access_token_secret', e.target.value)}
                                    placeholder="X Access Token Secret"
                                    className="mt-1"
                                  />
                                </div>
                              </>
                            )}

                            <Button
                              onClick={() => savePlatformSettings(platform)}
                              disabled={isSavingPlatform}
                              className="w-full mt-3"
                              size="sm"
                            >
                              {isSavingPlatform ? (
                                <>
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-3 w-3" />
                                  Save Settings
                                </>
                              )}
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => getPlatformHelpHandler(platform)}
                              className="w-full"
                              size="sm"
                            >
                              <HelpCircle className="mr-2 h-3 w-3" />
                              Get Setup Help
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </SidebarContent>
        </Sidebar>
      </div>
    </div>
  )
}
