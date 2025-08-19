"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getSWOTOutput } from "@/services/agents";
import { TrendingUp, TrendingDown, Target, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

interface SWOTData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

const iconMap = {
  strengths: CheckCircle,
  weaknesses: TrendingDown,
  opportunities: Target,
  threats: AlertTriangle
};

const colorMap = {
  strengths: "bg-card border border-emerald-200 dark:border-emerald-800/50",
  weaknesses: "bg-card border border-rose-200 dark:border-rose-800/50",
  opportunities: "bg-card border border-blue-200 dark:border-blue-800/50",
  threats: "bg-card border border-orange-200 dark:border-orange-800/50"
};

const textColorMap = {
  strengths: "text-card-foreground",
  weaknesses: "text-card-foreground",
  opportunities: "text-card-foreground",
  threats: "text-card-foreground"
};

const accentColorMap = {
  strengths: {
    light: "bg-emerald-100 border-emerald-300 text-emerald-800",
    dark: "bg-emerald-900/20 border-emerald-700/50 text-emerald-300"
  },
  weaknesses: {
    light: "bg-rose-100 border-rose-300 text-rose-800",
    dark: "bg-rose-900/20 border-rose-700/50 text-rose-300"
  },
  opportunities: {
    light: "bg-blue-100 border-blue-300 text-blue-800",
    dark: "bg-blue-900/20 border-blue-700/50 text-blue-300"
  },
  threats: {
    light: "bg-orange-100 border-orange-300 text-orange-800",
    dark: "bg-orange-900/20 border-orange-700/50 text-orange-300"
  }
};

const badgeColorMap = {
  strengths: "bg-emerald-600 dark:bg-emerald-500",
  weaknesses: "bg-rose-600 dark:bg-rose-500",
  opportunities: "bg-blue-600 dark:bg-blue-500",
  threats: "bg-orange-600 dark:bg-orange-500"
};

const dotColorMap = {
  strengths: "bg-emerald-600",
  weaknesses: "bg-rose-600",
  opportunities: "bg-blue-600",
  threats: "bg-orange-600"
};

export default function SWOTAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [swotData, setSWOTData] = useState<SWOTData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    fetchSWOTData();
  }, []);

  const fetchSWOTData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getSWOTOutput();
      console.log('SWOT response received:', response);
      console.log('Response content type:', typeof response.content);
      console.log('Response content:', response.content);
      
      // Parse the SWOT data from the response
      let parsedData: SWOTData;
      
      // Check if content is already a proper SWOT object
      if (response.content && typeof response.content === 'object' && 
          'strengths' in response.content && 'weaknesses' in response.content &&
          'opportunities' in response.content && 'threats' in response.content) {
        // Content is already a proper SWOT object
        parsedData = response.content as SWOTData;
      } else if (typeof response.content === 'string') {
        try {
          // Try to parse as JSON first
          const jsonParsed = JSON.parse(response.content);
          if (jsonParsed && typeof jsonParsed === 'object' && 
              'strengths' in jsonParsed && 'weaknesses' in jsonParsed &&
              'opportunities' in jsonParsed && 'threats' in jsonParsed) {
            parsedData = jsonParsed as SWOTData;
          } else {
            // If JSON doesn't have SWOT structure, try text parsing
            parsedData = parseTextSWOT(response.content);
          }
        } catch {
          // If JSON parsing fails, try to parse as text
          parsedData = parseTextSWOT(response.content);
        }
      } else {
        // Fallback: treat as SWOT object
        parsedData = response.content as SWOTData;
      }
      
      console.log('Parsed SWOT data:', parsedData);
      setSWOTData(parsedData);
      
    } catch (error) {
      console.error('Failed to fetch SWOT data:', error);
      setError('Failed to load SWOT analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const parseTextSWOT = (text: string): SWOTData => {
    // Ensure text is actually a string
    if (typeof text !== 'string') {
      console.warn('parseTextSWOT received non-string input:', text);
      return {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: []
      };
    }

    const sections = {
      strengths: [] as string[],
      weaknesses: [] as string[],
      opportunities: [] as string[],
      threats: [] as string[]
    };

    const lines = text.split('\n').filter(line => line.trim());
    let currentSection: keyof SWOTData | null = null;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('strength')) {
        currentSection = 'strengths';
      } else if (lowerLine.includes('weakness')) {
        currentSection = 'weaknesses';
      } else if (lowerLine.includes('opportunit')) {
        currentSection = 'opportunities';
      } else if (lowerLine.includes('threat')) {
        currentSection = 'threats';
      } else if (currentSection && (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().match(/^\d+\./))) {
        const cleanLine = line.replace(/^[-•\d.]\s*/, '').trim();
        if (cleanLine && currentSection) {
          sections[currentSection].push(cleanLine);
        }
      }
    }

    return sections;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(5)].map((_, j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading SWOT Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl font-bold tracking-tight">SWOT Analysis</h1>
        <p className="text-l text-muted-foreground max-w-2xl mx-auto">
          Strategic analysis of your business strengths, weaknesses, opportunities, and threats
        </p>
      </motion.div>

      {/* SWOT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {swotData && Object.entries(swotData).map(([category, items], index) => {
          const Icon = iconMap[category as keyof typeof iconMap];
          const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
          
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={`h-full ${colorMap[category as keyof typeof colorMap]} shadow-sm`}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${badgeColorMap[category as keyof typeof badgeColorMap]}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-semibold ${textColorMap[category as keyof typeof textColorMap]}`}>
                        {categoryTitle}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {items.map((item: string, itemIndex: number) => {
                      const accentClasses = isDark 
                        ? accentColorMap[category as keyof typeof accentColorMap].dark
                        : accentColorMap[category as keyof typeof accentColorMap].light;
                      
                      return (
                        <motion.div
                          key={itemIndex}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: (index * 0.1) + (itemIndex * 0.05) }}
                          className={`p-3 rounded-lg border ${accentClasses} text-sm leading-relaxed`}
                        >
                          {item}
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
