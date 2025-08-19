'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ViabilityData {
  startup_budget_amount?: number;
  budget_adequacy?: string;
  time_to_profitability?: number;
  market_difficulty?: number;
  success_probability?: number;
}

interface FinancialData {
  startup_costs?: number;
  break_even_month?: number;
  profit_margin?: number;
}

interface MarketData {
  market_difficulty?: number;
}

interface KeyMetricsProps {
  viabilityData: ViabilityData | null;
  financialData: FinancialData | null;
  marketData: MarketData | null;
  currencySymbol: string;
}

// Animated number component
const AnimatedNumber = ({ value, prefix = "", suffix = "", duration = 2 }: { 
  value: number | string, 
  prefix?: string, 
  suffix?: string,
  duration?: number 
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    if (typeof value === 'number') {
      let start = 0;
      const end = value;
      const increment = end / (duration * 60); // 60fps
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 1000 / 60);
      
      return () => clearInterval(timer);
    }
  }, [value, duration]);
  
  if (typeof value === 'string') {
    return <span>{prefix}{value}{suffix}</span>;
  }
  
  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
};

export default function KeyMetrics({ viabilityData, financialData, marketData, currencySymbol }: KeyMetricsProps) {
  // Animation variants for metrics
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Startup Costs */}
      <motion.div variants={itemVariants}>
        <Card className="bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20 dark:border-blue-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-blue-600 dark:text-blue-400">Startup Costs</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-500/70 dark:text-blue-400/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              <AnimatedNumber 
                value={viabilityData?.startup_budget_amount || financialData?.startup_costs || 0} 
                prefix={currencySymbol ? currencySymbol + " " : ""} 
              />
            </div>
            {viabilityData?.budget_adequacy && (
              <Badge variant={
                viabilityData.budget_adequacy === "generous" ? "default" : 
                viabilityData.budget_adequacy === "adequate" ? "secondary" : "destructive"
              } className="text-sm">
                {viabilityData.budget_adequacy.charAt(0).toUpperCase() + viabilityData.budget_adequacy.slice(1)} Budget
              </Badge>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Time to Profitability */}
      <motion.div variants={itemVariants}>
        <Card className="bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-emerald-600 dark:text-emerald-400">Time to Profitability</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-500/70 dark:text-emerald-400/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
              <AnimatedNumber 
                value={viabilityData?.time_to_profitability || financialData?.break_even_month || 0} 
                suffix=" months" 
              />
            </div>
            <Badge variant={
              (viabilityData?.time_to_profitability ?? financialData?.break_even_month ?? 12) <= 6 ? "default" : 
              (viabilityData?.time_to_profitability ?? financialData?.break_even_month ?? 12) <= 12 ? "secondary" : "destructive"
            } className="text-sm">
              {(viabilityData?.time_to_profitability ?? financialData?.break_even_month ?? 12) <= 6 ? "Fast Break-even" : 
               (viabilityData?.time_to_profitability ?? financialData?.break_even_month ?? 12) <= 12 ? "Moderate Break-even" : "Slow Break-even"}
            </Badge>
          </CardContent>
        </Card>
      </motion.div>

      {/* Market Difficulty */}
      <motion.div variants={itemVariants}>
        <Card className="bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/20 dark:border-orange-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-orange-600 dark:text-orange-400">Market Difficulty</CardTitle>
            <BarChart3 className="h-5 w-5 text-orange-500/70 dark:text-orange-400/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              <AnimatedNumber 
                value={viabilityData?.market_difficulty || marketData?.market_difficulty || 0} 
                suffix="/10" 
              />
            </div>
            <Badge variant={(viabilityData?.market_difficulty ?? marketData?.market_difficulty ?? 5) > 7 ? "destructive" : (viabilityData?.market_difficulty ?? marketData?.market_difficulty ?? 5) > 4 ? "secondary" : "default"} className="text-sm">
              {(viabilityData?.market_difficulty ?? marketData?.market_difficulty ?? 5) > 7 ? "High Difficulty" : 
               (viabilityData?.market_difficulty ?? marketData?.market_difficulty ?? 5) > 4 ? "Medium Difficulty" : "Low Difficulty"}
            </Badge>
          </CardContent>
        </Card>
      </motion.div>

      {/* Success Probability */}
      <motion.div variants={itemVariants}>
        <Card className="bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/20 dark:border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-purple-600 dark:text-purple-400">Success Probability</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-500/70 dark:text-purple-400/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              <AnimatedNumber 
                value={viabilityData?.success_probability || Math.max(financialData?.profit_margin || 0, 20)} 
                suffix="%" 
              />
            </div>
            <Badge variant={
              (viabilityData?.success_probability ?? 0) > 70 ? "default" : 
              (viabilityData?.success_probability ?? 0) > 40 ? "secondary" : "destructive"
            } className="text-sm">
              {(viabilityData?.success_probability ?? 0) > 70 ? "High Success" : 
               (viabilityData?.success_probability ?? 0) > 40 ? "Moderate Success" : "Low Success"}
            </Badge>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
