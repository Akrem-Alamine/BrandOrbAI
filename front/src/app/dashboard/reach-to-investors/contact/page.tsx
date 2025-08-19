'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CircleFlag } from 'react-circle-flags'
import { 
  Target, 
  TrendingUp, 
  ExternalLink, 
  Star,
  Building,
  DollarSign,
  Users,
  Sparkles,
  RefreshCw,
  CheckCircle,
  Info,
  MapPin,
  Award,
  Briefcase,
  Loader2,
  ArrowRight,
  Globe,
  Mail,
  Linkedin,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Grid,
  List
} from "lucide-react"
import { 
  analyzeForInvestors, 
  getInvestorRecommendations, 
  getAllInvestors,
  saveInvestorAnalysis,
  getBusinessSummary,
  InvestorRecommendation,
  InvestorAnalysisResponse,
  TeamMember
} from "@/services/agents"

export default function InvestorContactPage() {
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [recommendations, setRecommendations] = useState<InvestorRecommendation[]>([])
  const [readinessScore, setReadinessScore] = useState<number>(0)
  const [totalInvestors, setTotalInvestors] = useState<number>(6089)
  const [businessSummary, setBusinessSummary] = useState<string>('')
  const [hasAnalysis, setHasAnalysis] = useState(false)
  const [autoAnalysisRun, setAutoAnalysisRun] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  
  // Table view states
  const [allInvestors, setAllInvestors] = useState<InvestorRecommendation[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStage, setFilterStage] = useState<string>('all')
  const [filterCountry, setFilterCountry] = useState<string>('all')
  const [filteredInvestors, setFilteredInvestors] = useState<InvestorRecommendation[]>([])
  const [tableLoading, setTableLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  // Auto-analysis effect - runs after data is loaded
  useEffect(() => {
    if (businessSummary && !hasAnalysis && !autoAnalysisRun && !loading) {
      console.log('🚀 Auto-running investor analysis...')
      setAutoAnalysisRun(true)
      analyzeForInvestorsAction(true) // Pass true for auto mode
    }
  }, [businessSummary, hasAnalysis, autoAnalysisRun, loading])

  // Load all investors when table view is activated
  useEffect(() => {
    const loadAllInvestors = async () => {
      if (viewMode === 'table' && allInvestors.length === 0) {
        setTableLoading(true)
        try {
          const response = await getAllInvestors()
          if (response.success && response.data) {
            setAllInvestors(response.data)
            console.log(`✅ Loaded ${response.data.length} investors for table`)
          }
        } catch (error) {
          console.error('Failed to load all investors:', error)
        } finally {
          setTableLoading(false)
        }
      }
    }

    loadAllInvestors()
  }, [viewMode, allInvestors.length])

  // Filter effect for table view
  useEffect(() => {
    if (viewMode === 'table' && allInvestors.length > 0) {
      let filtered = allInvestors

      // Search filter
      if (searchTerm) {
        filtered = filtered.filter(investor => 
          (investor as any).name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (investor as any).company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (investor as any).overview?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (investor as any).headquarters?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      // Stage filter  
      if (filterStage !== 'all') {
        filtered = filtered.filter(investor => 
          (investor as any).stage_focus?.toLowerCase().includes(filterStage.toLowerCase())
        )
      }

      // Country filter
      if (filterCountry !== 'all') {
        filtered = filtered.filter(investor => 
          (investor as any).country?.toLowerCase() === filterCountry.toLowerCase()
        )
      }

      setFilteredInvestors(filtered)
      setCurrentPage(1) // Reset to first page when filtering
    }
  }, [searchTerm, filterStage, filterCountry, allInvestors, viewMode])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load business summary first
      const summary = await getBusinessSummary()
      setBusinessSummary(summary)
      
      // Try to load existing recommendations
      try {
        const response = await getInvestorRecommendations()
        if (response.success && response.data.recommendations.length > 0) {
          setRecommendations(response.data.recommendations)
          setReadinessScore(response.data.readiness_score)
          setTotalInvestors(response.data.total_investors_analyzed || 6089)
          setHasAnalysis(true)
        }
      } catch (error) {
        console.log('No existing investor analysis found, will auto-run analysis')
        setHasAnalysis(false)
      }
      
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const analyzeForInvestorsAction = async (isAuto = false) => {
    if (!businessSummary) {
      if (!isAuto) {
        toast.error('Business summary is required for investor analysis')
      }
      return
    }

    try {
      setAnalyzing(true)
      
      if (!isAuto) {
        toast.info('Re-analyzing your business for investor matches...')
      } else {
        toast.info('🤖 Running automatic investor analysis based on your business profile...')
      }
      
      const response = await analyzeForInvestors(businessSummary)
      
      if (response.success) {
        setRecommendations(response.data.recommendations)
        setReadinessScore(response.data.readiness_score)
        setTotalInvestors(response.data.total_investors_analyzed || 6089)
        setHasAnalysis(true)
        
        // Save the analysis
        await saveInvestorAnalysis(response.data)
        
        const matchCount = response.data.recommendations.length
        const analysisText = isAuto ? 'Analysis complete!' : 'Re-analysis complete!'
        toast.success(`${analysisText} Found ${matchCount} top investor matches from ${response.data.total_investors_analyzed || 6089} investors analyzed.`)
      } else {
        toast.error('Failed to analyze for investors')
      }
    } catch (error) {
      console.error('Error analyzing for investors:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to analyze for investors')
    } finally {
      setAnalyzing(false)
    }
  }

  const getReadinessColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  }

  const getReadinessLabel = (score: number) => {
    if (score >= 0.8) return 'Investment Ready'
    if (score >= 0.6) return 'Good Progress'
    return 'Needs Development'
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400'
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const formatFundingStages = (stages: string[] | undefined) => {
    if (!stages || stages.length === 0) return 'All stages'
    return stages.join(', ')
  }

  const getCountryCode = (countryName: string): string => {
    const countryMapping: { [key: string]: string } = {
      'United States': 'US', 'USA': 'US', 'United Kingdom': 'GB', 'UK': 'GB',
      'Germany': 'DE', 'France': 'FR', 'Spain': 'ES', 'Italy': 'IT',
      'Netherlands': 'NL', 'Belgium': 'BE', 'Switzerland': 'CH', 'Austria': 'AT',
      'Sweden': 'SE', 'Norway': 'NO', 'Denmark': 'DK', 'Finland': 'FI',
      'Canada': 'CA', 'Australia': 'AU', 'Japan': 'JP', 'South Korea': 'KR',
      'China': 'CN', 'India': 'IN', 'Singapore': 'SG', 'Hong Kong': 'HK',
      'Brazil': 'BR', 'Mexico': 'MX', 'Argentina': 'AR', 'Chile': 'CL',
      'Palestine': 'PS', 'UAE': 'AE', 'South Africa': 'ZA', 'Turkey': 'TR',
      'Russia': 'RU', 'Poland': 'PL', 'Czech Republic': 'CZ', 'Ireland': 'IE',
      'Portugal': 'PT', 'Luxembourg': 'LU', 'Thailand': 'TH', 'Malaysia': 'MY',
      'Indonesia': 'ID', 'Philippines': 'PH', 'Vietnam': 'VN', 'New Zealand': 'NZ',
      'Egypt': 'EG', 'Morocco': 'MA', 'Tunisia': 'TN', 'Algeria': 'DZ',
      'Jordan': 'JO', 'Lebanon': 'LB', 'Saudi Arabia': 'SA', 'Qatar': 'QA',
      'Kuwait': 'KW', 'Bahrain': 'BH', 'Oman': 'OM', 'Kenya': 'KE',
      'Nigeria': 'NG', 'Ghana': 'GH', 'Ethiopia': 'ET', 'Uganda': 'UG'
    }
    return countryMapping[countryName] || 'US'
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-10 w-80" />
              <Skeleton className="h-6 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        </div>
        
        {/* Analysis Card Skeleton */}
        <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200">
          <CardContent className="flex items-center justify-center gap-4 py-8">
            <div className="p-3 bg-blue-600 rounded-full">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-surface">Loading Investor Analysis</h3>
              <p className="text-sm text-surface-muted">Preparing your personalized investor matches...</p>
            </div>
          </CardContent>
        </Card>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-12 w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-8">
        {/* Header - Only show in card view or when no analysis */}
        {viewMode === 'cards' && (
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold gradient-text">
                Investor Connections
              </h1>
              <p className="text-lg text-surface-muted">
                Connect with the right investors for your business. Our AI analyzes your venture and matches you with the most suitable funding partners.
              </p>
              <div className="flex items-center gap-2 text-sm text-surface-muted mt-2">
                <Globe className="h-4 w-4" />
                <span>Analyzing {totalInvestors} investors globally</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {hasAnalysis && (
                <>
                  <Button
                    onClick={() => analyzeForInvestorsAction(false)}
                    disabled={analyzing}
                    variant="outline"
                    className="flex items-center gap-2 bg-surface/50 backdrop-blur-sm border-surface/30 hover:bg-surface/70 transition-colors"
                  >
                    {analyzing ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Re-analyze
                  </Button>
                  
                  <Button
                    onClick={() => setViewMode('table')}
                    variant="outline"
                    className="flex items-center gap-2 bg-surface/50 backdrop-blur-sm border-surface/30 hover:bg-surface/70 transition-colors"
                  >
                    <List className="mr-2 h-4 w-4" />
                    See All
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <Card className="bg-surface/30 backdrop-blur-sm border-surface/20">
            <CardContent className="flex items-center justify-center gap-4 py-8">
              <div className="p-3 bg-primary rounded-full">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-surface">Loading Investor Analysis</h3>
                <p className="text-sm text-surface-muted">Preparing your personalized investor matches...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auto-analysis status */}
        {!loading && analyzing && (
          <Card className="bg-surface/30 backdrop-blur-sm border-surface/20">
            <CardContent className="flex items-center justify-center gap-4 py-8">
              <div className="p-3 bg-primary rounded-full">
                <Sparkles className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-surface">Running AI Analysis</h3>
                <p className="text-sm text-surface-muted">Matching your business with the perfect investors...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Button for initial analysis */}
        {!hasAnalysis && !analyzing && (
          <div className="flex justify-center">
            <Button
              onClick={() => analyzeForInvestorsAction(false)}
              disabled={analyzing || !businessSummary}
              size="lg"
              className="px-8 py-3 text-lg bg-primary hover:bg-primary/90 text-white"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Find Investor Matches
            </Button>
          </div>
        )}

        {/* Investor Recommendations - Card View */}
        {viewMode === 'cards' && hasAnalysis && recommendations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-surface">Top Investor Matches</h2>
                <p className="text-surface-muted mt-1">Ranked by compatibility with your business profile</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recommendations.map((investor, index) => (
                <Card key={index} className="overflow-hidden bg-surface/30 backdrop-blur-sm border-surface/20 hover:border-surface/40 transition-colors">
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 w-full">
                        {/* Investor Logo */}
                        {investor.logo && (
                          <div className="flex-shrink-0">
                            <img 
                              src={investor.logo} 
                              alt={`${investor.fund_name} logo`}
                              className="h-12 w-12 rounded-lg object-cover bg-surface-muted"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-surface truncate">
                            {investor.fund_name || investor.investor_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs border-surface/30 bg-surface/20">
                              Rank #{investor.rank}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Star className={`h-4 w-4 ${getScoreColor(investor.score)} fill-current`} />
                              <span className={`font-semibold text-sm ${getScoreColor(investor.score)}`}>
                                {Math.round(investor.score * 100)}% Match
                              </span>
                            </div>
                            {investor.firm_type && (
                              <Badge variant="secondary" className="text-xs bg-surface/20">
                                {investor.firm_type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-surface-muted text-sm leading-relaxed">
                      {investor.overview}
                    </p>

                    {/* Target Countries with CircleFlag */}
                    {investor.target_countries && investor.target_countries.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-surface">Markets:</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {investor.target_countries.slice(0, 8).map((country, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border-2 border-surface/20 bg-surface/10"
                              title={country}
                            >
                              <CircleFlag
                                countryCode={getCountryCode(country).toLowerCase()}
                                height={20}
                                title={country}
                              />
                            </div>
                          ))}
                          {investor.target_countries.length > 8 && (
                            <span className="text-xs text-surface-muted ml-1 px-2 py-1 bg-surface/20 rounded-full">
                              +{investor.target_countries.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Investment Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="text-sm font-medium text-surface">Check Size</div>
                            <div className="text-sm text-surface-muted">{investor.check_size}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="text-sm font-medium text-surface">Stages</div>
                            <div className="text-sm text-surface-muted">{formatFundingStages(investor.funding_stages)}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {investor.headquarters_address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-purple-600 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-surface">Headquarters</div>
                              <div className="text-sm text-surface-muted leading-tight">
                                {investor.headquarters_address}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {investor.lead_investor && (
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-orange-600" />
                            <div>
                              <div className="text-sm font-medium text-surface">Lead Investor</div>
                              <div className="text-sm text-surface-muted">{investor.lead_investor}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Who We Are / Value Add */}
                    {(investor.who_we_are || investor.value_add) && (
                      <div className="space-y-3">
                        {investor.who_we_are && (
                          <div>
                            <h5 className="text-sm font-semibold text-surface mb-1">About Us</h5>
                            <p className="text-sm text-surface-muted leading-relaxed">{investor.who_we_are}</p>
                          </div>
                        )}
                        {investor.value_add && (
                          <div>
                            <h5 className="text-sm font-semibold text-surface mb-1">Value Add</h5>
                            <p className="text-sm text-surface-muted leading-relaxed">{investor.value_add}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Team Members */}
                    {investor.team_members && investor.team_members.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-surface mb-3">Key Team Members</h5>
                        <div className="grid grid-cols-1 gap-2">
                          {investor.team_members.slice(0, 3).map((member, memberIdx) => (
                            <div key={memberIdx} className="flex items-start gap-3 p-2 bg-surface/10 rounded-lg border border-surface/20">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-surface">{member.name}</div>
                                <div className="text-xs text-blue-600">{member.role}</div>
                                {member.bio && (
                                  <div className="text-xs text-surface-muted mt-1 line-clamp-2">{member.bio}</div>
                                )}
                              </div>
                            </div>
                          ))}
                          {investor.team_members.length > 3 && (
                            <div className="text-xs text-surface-muted text-center py-1">
                              +{investor.team_members.length - 3} more team members
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* AI Explanation */}
                    <div className="bg-surface/20 rounded-lg p-4 border border-surface/30 backdrop-blur-sm">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-surface mb-1">Why this match?</div>
                          <p className="text-sm text-surface-muted leading-relaxed">
                            {investor.explanation}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Funding Requirements */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-surface">Investment Criteria</div>
                      <p className="text-sm text-surface-muted leading-relaxed">
                        {investor.funding_requirements}
                      </p>
                    </div>

                    {/* Contact Actions */}
                    <div className="flex gap-3 pt-4 border-t border-surface/20">
                      {investor.website_link && (
                        <Button 
                          variant="outline" 
                          className="flex-1 border-surface/30 bg-surface/10 text-surface hover:bg-surface/20"
                          onClick={() => window.open(investor.website_link, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Visit Website
                        </Button>
                      )}
                      
                      {investor.linkedin_link && (
                        <Button 
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={() => window.open(investor.linkedin_link, '_blank')}
                        >
                          <Linkedin className="mr-2 h-4 w-4 text-white" />
                          <text className='text-white'> LinkedIn</text>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Investor Recommendations - Table View */}
        {viewMode === 'table' && (
          <div>
            {/* Back button above title */}
            <div className="mb-4">
              <Button
                onClick={() => setViewMode('cards')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
            
            {/* Header for table view */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-surface">All Investors Database</h2>
              <p className="text-surface-muted mt-1">Browse and filter through our comprehensive database of {filteredInvestors.length > 0 ? filteredInvestors.length : allInvestors.length} investors</p>
            </div>

            {tableLoading ? (
              <Card className="bg-surface/30 backdrop-blur-sm border-surface/20">
                <CardContent className="text-center py-12">
                  <div className="p-4 bg-surface/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-surface-muted animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold text-surface mb-2">Loading Investors Database</h3>
                  <p className="text-surface-muted mb-4 max-w-md mx-auto">
                    Please wait while we load the complete investors database...
                  </p>
                </CardContent>
              </Card>
            ) : allInvestors.length === 0 ? (
              <Card className="bg-surface/30 backdrop-blur-sm border-surface/20">
                <CardContent className="text-center py-12">
                  <div className="p-4 bg-surface/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Target className="h-8 w-8 text-surface-muted" />
                  </div>
                  <h3 className="text-lg font-semibold text-surface mb-2">No Investors Available</h3>
                  <p className="text-surface-muted mb-4 max-w-md mx-auto">
                    Unable to load the investors database. Please try again later.
                  </p>
                  <Button onClick={() => setViewMode('cards')} variant="outline">
                    Back to Card View
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search investors by name, company, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={filterStage} onValueChange={setFilterStage}>
                      <SelectTrigger className="w-[160px] bg-surface/70 backdrop-blur-sm border-surface/30 hover:bg-surface/80 transition-colors">
                        <SelectValue placeholder="All Stages" />
                      </SelectTrigger>
                      <SelectContent className="bg-surface/95 backdrop-blur-md border-surface/20">
                        <SelectItem value="all">All Stages</SelectItem>
                        <SelectItem value="pre-seed">Pre-Seed</SelectItem>
                        <SelectItem value="seed">Seed</SelectItem>
                        <SelectItem value="series a">Series A</SelectItem>
                        <SelectItem value="series b">Series B</SelectItem>
                        <SelectItem value="series c">Series C</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="prototype">Prototype</SelectItem>
                        <SelectItem value="early revenue">Early Revenue</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterCountry} onValueChange={setFilterCountry}>
                      <SelectTrigger className="w-[160px] bg-surface/70 backdrop-blur-sm border-surface/30 hover:bg-surface/80 transition-colors">
                        <SelectValue placeholder="All Countries" />
                      </SelectTrigger>
                      <SelectContent className="bg-surface/95 backdrop-blur-md border-surface/20">
                        <SelectItem value="all">All Countries</SelectItem>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="gb">United Kingdom</SelectItem>
                        <SelectItem value="ca">Canada</SelectItem>
                        <SelectItem value="de">Germany</SelectItem>
                        <SelectItem value="fr">France</SelectItem>
                        <SelectItem value="sg">Singapore</SelectItem>
                        <SelectItem value="au">Australia</SelectItem>
                        <SelectItem value="in">India</SelectItem>
                        <SelectItem value="jp">Japan</SelectItem>
                        <SelectItem value="ps">Palestine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Table */}
                <Card className="bg-surface/30 backdrop-blur-sm border-surface/20">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-surface/20 bg-surface/20">
                          <TableHead className="w-[200px] py-3 px-6 font-semibold text-surface">Investor</TableHead>
                          <TableHead className="w-[150px] py-3 px-6 font-semibold text-surface">Location</TableHead>
                          <TableHead className="w-[120px] py-3 px-6 font-semibold text-surface">Stage Focus</TableHead>
                          <TableHead className="w-[150px] py-3 px-6 font-semibold text-surface">Investment Range</TableHead>
                          <TableHead className="w-[80px] py-3 px-6 font-semibold text-surface">Type</TableHead>
                          <TableHead className="text-right w-[120px] py-3 px-6 font-semibold text-surface">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                      {filteredInvestors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((investor, index) => {
                        const investorData = investor as any;
                        return (
                          <TableRow key={index} className="border-b border-surface/10 hover:bg-surface/10">
                            <TableCell className="py-3 px-6">
                              <div className="min-w-0">
                                <div className="font-semibold text-surface text-base truncate">{investorData.name}</div>
                                <div className="text-sm text-surface-muted truncate mt-1">{investorData.company || 'Investment Firm'}</div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-6">
                              <div className="flex items-center gap-3">
                                {investorData.country && (
                                  <CircleFlag countryCode={investorData.country.toLowerCase()} width="20" />
                                )}
                                <span className="text-sm text-surface-muted truncate">{investorData.headquarters || 'Global'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-6">
                              <Badge variant="outline" className="text-xs px-3 py-1 border-surface/30 bg-surface/20 text-surface">
                                {investorData.stage_focus || 'All stages'}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 px-6">
                              <div className="text-sm text-surface font-medium">
                                {investorData.check_size || 'Varies'}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-6">
                              <Badge variant="secondary" className="text-xs px-3 py-1 border-surface/30 bg-surface/10 text-surface-muted">
                                {investorData.company || 'VC'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right py-3 px-6">
                              <div className="flex items-center justify-end gap-3">
                                {investorData.website_link && (
                                  <Button variant="outline" size="sm" onClick={() => window.open(investorData.website_link, '_blank')} className="px-3 py-2">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button variant="outline" size="sm" className="px-3 py-2">
                                  <Mail className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      </TableBody>
                    </Table>
                  </div>
                </Card>                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-surface-muted">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredInvestors.length)} of {filteredInvestors.length} investors
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="border-surface/30 bg-surface/10 text-surface hover:bg-surface/20"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm text-surface-muted">
                      Page {currentPage} of {Math.ceil(filteredInvestors.length / itemsPerPage)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(Math.ceil(filteredInvestors.length / itemsPerPage), currentPage + 1))}
                      disabled={currentPage >= Math.ceil(filteredInvestors.length / itemsPerPage)}
                      className="border-surface/30 bg-surface/10 text-surface hover:bg-surface/20"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !analyzing && recommendations.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Target className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Analysis Available</h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                We'll automatically analyze your business and find the perfect investor matches when your business summary is ready.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
