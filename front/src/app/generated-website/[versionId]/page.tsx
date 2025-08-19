'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import GeneratedLandingPage from '@/components/generated-landing-page'
import { Loader2 } from 'lucide-react'

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

interface BusinessData {
  business_summary?: string
  financial_data?: string
  market_data?: string
  legal_data?: string
  brand_identity_data?: string
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001'

export default function GeneratedWebsitePage() {
  const params = useParams()
  const versionId = params.versionId as string
  
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null)
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (versionId) {
      loadWebsiteData()
    }
  }, [versionId])

  const loadWebsiteData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load version metadata to get analysis
      const response = await fetch(`${BACKEND_URL}/website-generator/version/${versionId}/metadata`)
      const data = await response.json()
      
      if (data.success) {
        setAnalysis(data.metadata.analysis)
        // Also load business data if needed
        const businessResponse = await fetch(`${BACKEND_URL}/website-generator/business-data`)
        const businessData = await businessResponse.json()
        if (businessData.success) {
          setBusinessData(businessData.data)
        }
      } else {
        setError(data.message || 'Failed to load website data')
      }
    } catch (err) {
      console.error('Error loading website:', err)
      setError('Failed to load website')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading Website</h2>
          <p className="text-muted-foreground">Please wait while we load your website...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Website Not Found</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <a href="/dashboard/go-to-market/company-profile" className="text-primary hover:underline">
            ← Back to Website Generator
          </a>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No Website Data</h2>
          <p className="text-muted-foreground mb-4">This website version doesn't contain the required data.</p>
          <a href="/dashboard/go-to-market/company-profile" className="text-primary hover:underline">
            ← Back to Website Generator
          </a>
        </div>
      </div>
    )
  }

  return <GeneratedLandingPage analysis={analysis} businessData={businessData || undefined} />
}
