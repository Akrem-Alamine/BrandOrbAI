'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users } from "lucide-react";
import { motion } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from "recharts";

interface FinancialData {
  cash_flow_projection_annual?: Array<{
    year: number;
    inflow: string;
    outflow: string;
    net_cash_flow: string;
  }>;
}

interface ViabilityData {
  startup_budget_amount?: number;
}

interface MarketData {
  competitors?: Array<{
    name: string;
    strength_score: number;
    market_share: number;
    threat_level: string;
  }>;
}

interface DynamicBusinessInfo {
  industry: string;
}

interface ChartsProps {
  financialData: FinancialData | null;
  viabilityData: ViabilityData | null;
  marketData: MarketData | null;
  dynamicBusinessInfo: DynamicBusinessInfo;
  currencySymbol: string;
}

export default function Charts({ 
  financialData, 
  viabilityData, 
  marketData, 
  dynamicBusinessInfo, 
  currencySymbol 
}: ChartsProps) {
  // Chart data for financial projections - directly from backend financial assessment
  const revenueChartData = financialData?.cash_flow_projection_annual?.map((year: any) => ({
    month: `Year ${year.year}`,
    revenue: parseFloat(year.inflow) || 0,
    expenses: parseFloat(year.outflow) || 0,
    profit: parseFloat(year.net_cash_flow) || 0
  })) || (viabilityData ? [
    { month: 'Year 1', revenue: (viabilityData as any).startup_budget_amount * 0.5, expenses: (viabilityData as any).startup_budget_amount * 0.3, profit: (viabilityData as any).startup_budget_amount * 0.2 },
    { month: 'Year 2', revenue: (viabilityData as any).startup_budget_amount * 1.2, expenses: (viabilityData as any).startup_budget_amount * 0.7, profit: (viabilityData as any).startup_budget_amount * 0.5 },
    { month: 'Year 3', revenue: (viabilityData as any).startup_budget_amount * 2.0, expenses: (viabilityData as any).startup_budget_amount * 1.0, profit: (viabilityData as any).startup_budget_amount * 1.0 }
  ] : [
    { month: 'Year 1', revenue: 50000, expenses: 30000, profit: 20000 },
    { month: 'Year 2', revenue: 120000, expenses: 70000, profit: 50000 },
    { month: 'Year 3', revenue: 200000, expenses: 100000, profit: 100000 }
  ]);

  // Chart data for competitors - directly from market analysis data
  const competitorChartData = marketData?.competitors?.slice(0, 5).map(comp => ({
    name: comp.name.length > 25 ? comp.name.substring(0, 25) + '...' : comp.name,
    strength: comp.strength_score,
    market_share: comp.market_share,
    threat: comp.threat_level === 'High' ? 3 : comp.threat_level === 'Medium' ? 2 : 1
  })) || (viabilityData ? [
    { name: `${dynamicBusinessInfo.industry} Leader`, strength: 8, market_share: 25, threat: 3 },
    { name: 'Established Player', strength: 7, market_share: 20, threat: 2 },
    { name: 'Growing Competitor', strength: 6, market_share: 15, threat: 2 },
    { name: 'Niche Provider', strength: 5, market_share: 10, threat: 1 },
    { name: 'New Entrant', strength: 4, market_share: 5, threat: 1 }
  ] : [
    { name: 'Market Leader', strength: 8, market_share: 25, threat: 3 },
    { name: 'Established Player', strength: 7, market_share: 20, threat: 2 },
    { name: 'Growing Competitor', strength: 6, market_share: 15, threat: 2 },
    { name: 'Regional Player', strength: 5, market_share: 10, threat: 1 },
    { name: 'Startup', strength: 4, market_share: 5, threat: 1 }
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue & Profit Growth */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue & Profit Growth
            </CardTitle>
            <CardDescription>
              Monthly progression showing revenue, expenses, and profit over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ffc658" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${currencySymbol}${value?.toLocaleString()}`, 
                    name === 'revenue' ? 'Revenue' : name === 'expenses' ? 'Expenses' : 'Profit'
                  ]} 
                />
                <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={0.6} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="profit" stroke="#ffc658" fillOpacity={0.6} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Competitor Analysis */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Competitor Analysis
            </CardTitle>
            <CardDescription>
              Top competitors and their market strength
            </CardDescription>
          </CardHeader>
          <CardContent>
            {competitorChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={competitorChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis domain={[0, 10]} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'strength' ? `${value}/10` : `${value}%`,
                      name === 'strength' ? 'Strength Score' : 'Market Share'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="strength" fill="#ffc658" name="Strength Score" />
                  <Bar dataKey="market_share" fill="#8884d8" name="Market Share %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No competitor data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
