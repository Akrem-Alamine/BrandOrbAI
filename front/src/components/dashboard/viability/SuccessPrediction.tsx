'use client';

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface ViabilityData {
  overall_viability_score: number;
  market_opportunity_score: number;
  success_probability: number;
  risk_level: string;
  time_to_profitability: number;
  startup_budget_amount: number;
}

interface DynamicBusinessInfo {
  type: string;
}

interface SuccessPredictionProps {
  viabilityData: ViabilityData | null;
  dynamicBusinessInfo: DynamicBusinessInfo;
  currencySymbol: string;
  getSuccessColor: (value: number) => string;
}

export default function SuccessPrediction({ 
  viabilityData, 
  dynamicBusinessInfo, 
  currencySymbol, 
  getSuccessColor 
}: SuccessPredictionProps) {
  if (!viabilityData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-gradient-to-r from-primary/5 to-blue-500/5 dark:from-primary/10 dark:to-blue-500/10 border-primary/20 dark:border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-1" style={{ color: getSuccessColor(viabilityData.overall_viability_score) }}>
                  {viabilityData.overall_viability_score}%
                </div>
                <p className="text-sm text-muted-foreground">Overall Viability</p>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  {viabilityData.market_opportunity_score}/10
                </div>
                <p className="text-sm text-muted-foreground">Market Opportunity</p>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {viabilityData.success_probability}%
                </div>
                <p className="text-sm text-muted-foreground">Success Probability</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-foreground">
                {dynamicBusinessInfo.type} Viability Assessment
              </div>
              <p className="text-sm text-muted-foreground">
                {currencySymbol} {viabilityData.startup_budget_amount.toLocaleString()} budget • {viabilityData.risk_level} risk • {viabilityData.time_to_profitability}mo to profit
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
