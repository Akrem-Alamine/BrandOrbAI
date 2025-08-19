'use client';

import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface DynamicBusinessInfo {
  type: string;
  industry: string;
  target: string;
  market: string;
  budget: number;
  currency: string;
  fulfillment: string;
  location: string;
}

interface ViabilityData {
  risk_level: string;
}

interface ViabilityHeaderProps {
  viabilityData: ViabilityData | null;
  dynamicBusinessInfo: DynamicBusinessInfo;
}

export default function ViabilityHeader({ viabilityData, dynamicBusinessInfo }: ViabilityHeaderProps) {
  const budgetInfo = `${dynamicBusinessInfo.currency} ${dynamicBusinessInfo.budget.toLocaleString()} Budget`;

  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">
        {viabilityData ? 
          `${dynamicBusinessInfo.type} Viability Assessment` : 
          "Business Viability Assessment"
        }
      </h1>
      <p className="text-muted-foreground">
        {viabilityData ? 
          `Comprehensive AI-powered viability analysis for your ${dynamicBusinessInfo.type.toLowerCase()} targeting ${dynamicBusinessInfo.target.toLowerCase()} in the ${dynamicBusinessInfo.market.toLowerCase()} with a ${dynamicBusinessInfo.currency}${dynamicBusinessInfo.budget.toLocaleString()} budget` :
          "Loading comprehensive business viability analysis..."
        }
      </p>
      {viabilityData && (
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline">{dynamicBusinessInfo.market}</Badge>
          <Badge variant="outline">{dynamicBusinessInfo.type}</Badge>
          <Badge variant="outline">{dynamicBusinessInfo.target}</Badge>
          <Badge variant="outline">{dynamicBusinessInfo.industry}</Badge>
          <Badge variant="outline">{budgetInfo}</Badge>
          <Badge variant="outline">{dynamicBusinessInfo.fulfillment} Operations</Badge>
          <Badge variant="outline">{dynamicBusinessInfo.location}</Badge>
          <Badge variant={viabilityData.risk_level === 'low' ? 'default' : viabilityData.risk_level === 'medium' ? 'secondary' : 'destructive'}>
            {viabilityData.risk_level.charAt(0).toUpperCase() + viabilityData.risk_level.slice(1)} Risk
          </Badge>
        </div>
      )}
    </div>
  );
}
