"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/landing/Header";
import { 
  FileText, 
  Download, 
  Share2, 
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Users,
  DollarSign,
  Target
} from "lucide-react";
import Link from "next/link";

export default function ReportPage() {
  const handleDownload = () => {
    // TODO: Implement PDF download
    console.log("Downloading report...");
  };

  const handleShare = () => {
    // TODO: Implement sharing
    console.log("Sharing report...");
  };

  const handleStartOver = () => {
    window.location.href = "/onboarding?reset=true";
  };

  const handleValidate = () => {
    window.location.href = "/dashboard/bmc";
  };

  // Mock report data
  const reportData = {
    businessIdea: "AI-powered platform for transforming ideas into market-ready products",
    marketSize: "$2.8B",
    competitorCount: 15,
    targetAudience: "Entrepreneurs and small business owners",
    revenueProjection: "$500K",
    riskLevel: "Medium",
    recommendation: "Proceed to Business Model Canvas development"
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-surface dark:bg-surface pt-20">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-surface">Critical Report</h1>
                <p className="text-surface-muted mt-1">
                  Comprehensive business validation analysis
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Report
              </Button>
            </div>
          </motion.div>

          {/* Report Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Report */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Executive Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Executive Summary
                    </CardTitle>
                    <CardDescription>
                      Key findings and recommendations from your business analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                        Business Concept
                      </h4>
                      <p className="text-blue-700 dark:text-blue-400 text-sm">
                        {reportData.businessIdea}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-surface-muted/30 rounded-lg">
                        <div className="text-2xl font-bold text-surface">{reportData.marketSize}</div>
                        <div className="text-sm text-surface-muted">Market Size</div>
                      </div>
                      <div className="text-center p-3 bg-surface-muted/30 rounded-lg">
                        <div className="text-2xl font-bold text-surface">{reportData.competitorCount}</div>
                        <div className="text-sm text-surface-muted">Competitors</div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                        Recommendation
                      </h4>
                      <p className="text-green-700 dark:text-green-400 text-sm">
                        {reportData.recommendation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Detailed Analysis Sections */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Market Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-surface-muted">Total Addressable Market</span>
                        <span className="text-sm font-medium">{reportData.marketSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-surface-muted">Growth Rate</span>
                        <span className="text-sm font-medium text-green-600">12% annually</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-surface-muted">Market Maturity</span>
                        <Badge variant="outline" className="text-xs">Growing</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-4 w-4 text-blue-600" />
                      Target Audience
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-surface-muted">Primary Segment</span>
                        <span className="text-sm font-medium">SMB Owners</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-surface-muted">Age Range</span>
                        <span className="text-sm font-medium">25-45</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-surface-muted">Pain Point</span>
                        <span className="text-sm font-medium text-red-600">Idea validation</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Financial Projections */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Financial Projections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-surface-muted/30 rounded-lg">
                        <div className="text-xl font-bold text-surface">$150K</div>
                        <div className="text-sm text-surface-muted">Year 1 Revenue</div>
                      </div>
                      <div className="text-center p-3 bg-surface-muted/30 rounded-lg">
                        <div className="text-xl font-bold text-surface">$350K</div>
                        <div className="text-sm text-surface-muted">Year 2 Revenue</div>
                      </div>
                      <div className="text-center p-3 bg-surface-muted/30 rounded-lg">
                        <div className="text-xl font-bold text-surface">$500K</div>
                        <div className="text-sm text-surface-muted">Year 3 Revenue</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-surface-muted">Market Opportunity</span>
                      <Badge className="bg-green-100 text-green-800">High</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-surface-muted">Competition Level</span>
                      <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-surface-muted">Technical Feasibility</span>
                      <Badge className="bg-green-100 text-green-800">High</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-surface-muted">Risk Level</span>
                      <Badge className="bg-yellow-100 text-yellow-800">{reportData.riskLevel}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Next Steps */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-surface-muted">
                      Based on your analysis, we recommend proceeding to create your Business Model Canvas.
                    </p>
                    
                    <div className="space-y-2">
                      <Button 
                        onClick={handleValidate}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Proceed to BMC
                      </Button>
                      
                      <Button 
                        onClick={handleStartOver}
                        variant="outline" 
                        className="w-full"
                      >
                        Start Over
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Report Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Report Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-surface-muted">
                    <div className="flex justify-between">
                      <span>Generated</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Analysis Steps</span>
                      <span>9 of 9</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Report Version</span>
                      <span>1.0</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
