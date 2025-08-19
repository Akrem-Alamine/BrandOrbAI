'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { motion } from "framer-motion";

interface MarketData {
  competitors?: Array<{
    name: string;
    strength_score: number;
    market_share: number;
    threat_level: string;
  }>;
}

interface CompetitorsProps {
  marketData: MarketData | null;
}

export default function Competitors({ marketData }: CompetitorsProps) {
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

  if (!marketData?.competitors || marketData.competitors.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Identified Competitors
          </CardTitle>
          <CardDescription>
            Companies operating in your market space
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {marketData.competitors.slice(0, 6).map((competitor, index) => (
              <motion.div 
                key={index} 
                variants={itemVariants}
                className="p-4 border rounded-lg space-y-2 hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-sm">{competitor.name}</h4>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Strength: {competitor.strength_score}/10</span>
                  <Badge variant={
                    competitor.threat_level === 'High' ? 'destructive' : 
                    competitor.threat_level === 'Medium' ? 'secondary' : 'default'
                  }>
                    {competitor.threat_level}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
