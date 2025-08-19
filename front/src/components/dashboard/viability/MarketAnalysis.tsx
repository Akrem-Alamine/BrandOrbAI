'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, BarChart3, TrendingUp, Target, Users, TrendingDown, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import ReactMarkdown from "react-markdown";

interface MarketData {
  market_size?: string;
  market_difficulty?: number;
  competition_level?: string;
  competitors?: Array<{
    name: string;
    strength_score: number;
    market_share: number;
    threat_level: string;
  }>;
}

interface ViabilityData {
  market_opportunity_score?: number;
  success_probability?: number;
  time_to_profitability?: number;
  budget_adequacy?: string;
  key_success_factors?: string[];
  major_risks?: string[];
}

interface DynamicBusinessInfo {
  target: string;
  market: string;
  industry: string;
  type: string;
  currency: string;
  budget: number;
}

interface FinancialData {
  startup_costs?: number;
  monthly_expenses?: number;
  break_even_month?: number;
  profit_margin?: number;
  revenue_projections?: number[];
}

interface MarketAnalysisProps {
  marketData: MarketData | null;
  viabilityData: ViabilityData | null;
  dynamicBusinessInfo: DynamicBusinessInfo;
  competitorChartData: Array<{
    name: string;
    strength: number;
    market_share: number;
    threat: number;
  }>;
  rawFinancial: string;
  financialData: FinancialData | null;
  currencySymbol: string;
}

export default function MarketAnalysis({ 
  marketData, 
  viabilityData, 
  dynamicBusinessInfo, 
  competitorChartData,
  rawFinancial,
  financialData,
  currencySymbol
}: MarketAnalysisProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Market Analysis */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Market Analysis
            </CardTitle>
            <CardDescription>
              Market size, competition, and business environment analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dynamic Market Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="p-4 bg-blue-500/5 dark:bg-blue-500/10 rounded-lg border border-blue-500/20 dark:border-blue-500/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400">Total Market Size</h4>
                  <BarChart3 className="h-5 w-5 text-blue-500/70" />
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {marketData?.market_size || "Unknown"}
                </p>
                <p className="text-sm text-blue-500/70 dark:text-blue-400/70">
                  {dynamicBusinessInfo.market} Market
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg border border-emerald-500/20 dark:border-emerald-500/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-emerald-600 dark:text-emerald-400">Market Difficulty</h4>
                  <TrendingUp className="h-5 w-5 text-emerald-500/70" />
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {marketData?.market_difficulty || 5}/10
                </p>
                <p className="text-sm text-emerald-500/70 dark:text-emerald-400/70">
                  {marketData?.competition_level || 'Medium'} Competition
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="p-4 bg-purple-500/5 dark:bg-purple-500/10 rounded-lg border border-purple-500/20 dark:border-purple-500/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400">Market Opportunity</h4>
                  <Target className="h-5 w-5 text-purple-500/70" />
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {viabilityData?.market_opportunity_score || 8}/10
                </p>
                <p className="text-sm text-purple-500/70 dark:text-purple-400/70">
                  {dynamicBusinessInfo.industry} Sector
                </p>
              </motion.div>
            </div>

            {/* Dynamic Market Segments Chart - Based on Real Competitor Data */}
            {marketData?.competitors && marketData.competitors.length > 0 ? (
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Competitive Landscape Distribution</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={competitorChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={12} 
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'strength' ? `${value}/10` : `${value}%`,
                        name === 'strength' ? 'Strength Score' : 'Market Share'
                      ]}
                    />
                    <Bar dataKey="strength" fill="#3b82f6" name="Strength" />
                    <Bar dataKey="market_share" fill="#10b981" name="Market Share %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Market Opportunity Breakdown</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={[
                      { name: `${dynamicBusinessInfo.type}`, value: 60, fill: '#3b82f6' },
                      { name: 'Market Penetration', value: 30, fill: '#10b981' },
                      { name: 'Growth Potential', value: 45, fill: '#f59e0b' },
                      { name: 'Competitive Edge', value: viabilityData?.market_opportunity_score || 80, fill: '#8b5cf6' }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${value}%`, 'Opportunity Score']} />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Dynamic Key Trends and Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Key Market Insights</h4>
                <div className="p-3 bg-muted/50 dark:bg-muted/20 rounded border border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{dynamicBusinessInfo.industry} Sector Growth</span>
                    <Badge variant="default">
                      Market Opportunity: {viabilityData?.market_opportunity_score || 8}/10
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Target: {dynamicBusinessInfo.target} in {dynamicBusinessInfo.market}
                  </p>
                </div>
                
                <div className="p-3 bg-muted/50 dark:bg-muted/20 rounded border border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{dynamicBusinessInfo.type} Platform</span>
                    <Badge variant={
                      (marketData?.market_difficulty || 5) <= 4 ? "default" :
                      (marketData?.market_difficulty || 5) <= 7 ? "secondary" : "destructive"
                    }>
                      Difficulty: {marketData?.market_difficulty || 5}/10
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Competition Level: {marketData?.competition_level || 'Medium'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Business Readiness</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-3 bg-emerald-500/5 dark:bg-emerald-500/10 rounded border border-emerald-500/20 dark:border-emerald-500/30">
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {viabilityData?.success_probability || 60}%
                    </div>
                    <p className="text-xs text-emerald-500 dark:text-emerald-400">Success Rate</p>
                  </div>
                  <div className="text-center p-3 bg-blue-500/5 dark:bg-blue-500/10 rounded border border-blue-500/20 dark:border-blue-500/30">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {viabilityData?.time_to_profitability || 12}m
                    </div>
                    <p className="text-xs text-blue-500 dark:text-blue-400">Time to Profit</p>
                  </div>
                </div>
                
                <div className="p-3 bg-gradient-to-r from-purple-500/5 to-blue-500/5 dark:from-purple-500/10 dark:to-blue-500/10 rounded border border-purple-500/20 dark:border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-purple-600 dark:text-purple-400">Budget Status</span>
                    <Badge variant={
                      viabilityData?.budget_adequacy === 'generous' ? 'default' :
                      viabilityData?.budget_adequacy === 'adequate' ? 'secondary' : 'destructive'
                    }>
                      {viabilityData?.budget_adequacy || 'Adequate'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {dynamicBusinessInfo.currency} {dynamicBusinessInfo.budget.toLocaleString()} Available
                  </p>
                </div>
              </div>
            </div>

            {/* Dynamic Customer Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Target Market</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-muted/30 dark:bg-muted/10 rounded">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{dynamicBusinessInfo.target}</span>
                    <Badge variant="outline" className="ml-auto">Primary</Badge>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/30 dark:bg-muted/10 rounded">
                    <Building className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm">{dynamicBusinessInfo.market}</span>
                    <Badge variant="outline" className="ml-auto">Geographic</Badge>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/30 dark:bg-muted/10 rounded">
                    <Target className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">{dynamicBusinessInfo.industry}</span>
                    <Badge variant="outline" className="ml-auto">Sector</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Key Success Factors</h4>
                <div className="space-y-2">
                  {(viabilityData?.key_success_factors || [
                    'Strong product-market fit',
                    'Effective customer acquisition',
                    'Operational efficiency'
                  ]).slice(0, 3).map((factor, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-emerald-500/5 dark:bg-emerald-500/10 rounded border border-emerald-500/20 dark:border-emerald-500/30">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-emerald-600 dark:text-emerald-400">{factor}</span>
                    </div>
                  ))}
                </div>
                
                {viabilityData?.major_risks && viabilityData.major_risks.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium text-foreground mb-2">Major Risks</h5>
                    <div className="space-y-2">
                      {viabilityData.major_risks.slice(0, 2).map((risk, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-orange-500/5 dark:bg-orange-500/10 rounded border border-orange-500/20 dark:border-orange-500/30">
                          <TrendingDown className="h-4 w-4 text-orange-500" />
                          <span className="text-sm text-orange-600 dark:text-orange-400">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Financial Analysis */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Analysis
            </CardTitle>
            <CardDescription>
              Financial projections, costs, and profitability assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {financialData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Startup Costs */}
                <div className="p-4 bg-blue-500/5 dark:bg-blue-500/10 rounded-lg border border-blue-500/20 dark:border-blue-500/30">
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Startup Costs</h4>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {currencySymbol}{financialData.startup_costs?.toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-500/70 dark:text-blue-400/70">Initial investment required</p>
                </div>

                {/* Monthly Expenses */}
                <div className="p-4 bg-orange-500/5 dark:bg-orange-500/10 rounded-lg border border-orange-500/20 dark:border-orange-500/30">
                  <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">Monthly Expenses</h4>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {currencySymbol}{financialData.monthly_expenses?.toLocaleString()}
                  </p>
                  <p className="text-sm text-orange-500/70 dark:text-orange-400/70">Recurring operational costs</p>
                </div>

                {/* Break-even Timeline */}
                <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg border border-emerald-500/20 dark:border-emerald-500/30">
                  <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Break-even Timeline</h4>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {financialData.break_even_month} months
                  </p>
                  <p className="text-sm text-emerald-500/70 dark:text-emerald-400/70">Time to profitability</p>
                </div>

                {/* Profit Margin */}
                <div className="p-4 bg-purple-500/5 dark:bg-purple-500/10 rounded-lg border border-purple-500/20 dark:border-purple-500/30">
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">Profit Margin</h4>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {financialData.profit_margin?.toFixed(1)}%
                  </p>
                  <p className="text-sm text-purple-500/70 dark:text-purple-400/70">Expected profitability</p>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{rawFinancial}</ReactMarkdown>
              </div>
            )}

            {/* Revenue Projections */}
            {financialData?.revenue_projections && financialData.revenue_projections.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-foreground mb-3">Revenue Projections</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  {financialData.revenue_projections.slice(0, 6).map((revenue: number, index: number) => (
                    <div key={index} className="text-center p-2 bg-muted/50 dark:bg-muted/20 rounded border border-border">
                      <div className="text-sm text-muted-foreground">Month {(index + 1) * 2}</div>
                      <div className="font-semibold text-foreground">
                        {currencySymbol}{revenue?.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
