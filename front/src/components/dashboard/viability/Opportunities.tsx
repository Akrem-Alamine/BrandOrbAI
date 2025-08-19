'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Mail, Phone, Building2, Users, Globe } from "lucide-react";
import { motion } from "framer-motion";

interface OpportunityData {
  name: string;
  description: string;
  city: string;
  email: string;
  homepage: string;
  logoUrl: string;
  phoneNumber: string;
}

interface OpportunitiesProps {
  opportunitiesData: OpportunityData[] | null;
  businessContext?: {
    business_type?: string;
    industry?: string;
    target_market?: string;
    location?: string;
  };
}

export default function Opportunities({ opportunitiesData, businessContext }: OpportunitiesProps) {
  // Generate dynamic opportunity types based on business context
  const getOpportunityTypes = () => {
    const types = ['Partnership'];
    
    if (businessContext?.business_type?.toLowerCase().includes('platform') || 
        businessContext?.business_type?.toLowerCase().includes('saas')) {
      types.push('Integration', 'API Partner');
    }
    
    if (businessContext?.business_type?.toLowerCase().includes('marketplace')) {
      types.push('Vendor', 'Supplier');
    }
    
    if (businessContext?.industry?.toLowerCase().includes('health') ||
        businessContext?.industry?.toLowerCase().includes('mental')) {
      types.push('Healthcare Provider', 'Wellness Partner');
    }
    
    if (businessContext?.industry?.toLowerCase().includes('financial') ||
        businessContext?.industry?.toLowerCase().includes('fintech')) {
      types.push('Financial Institution', 'Investment Partner');
    }
    
    return types;
  };

  const opportunityTypes = getOpportunityTypes();
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

  if (!opportunitiesData || opportunitiesData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Opportunities
            </CardTitle>
            <CardDescription>
              Partnership and collaboration opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No opportunities data available
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Opportunities
          </CardTitle>
          <CardDescription>
            Partnership and collaboration opportunities in your industry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {opportunitiesData.map((opportunity, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {opportunity.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {opportunity.description}
                    </p>
                  </div>
                  {opportunity.logoUrl && (
                    <div className="ml-4">
                      <img 
                        src={opportunity.logoUrl} 
                        alt={`${opportunity.name} logo`}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  {opportunity.city && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{opportunity.city}</span>
                    </div>
                  )}
                  
                  {opportunity.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a 
                        href={`mailto:${opportunity.email}`}
                        className="hover:text-primary truncate"
                      >
                        {opportunity.email}
                      </a>
                    </div>
                  )}
                  
                  {opportunity.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a 
                        href={`tel:${opportunity.phoneNumber}`}
                        className="hover:text-primary"
                      >
                        {opportunity.phoneNumber}
                      </a>
                    </div>
                  )}
                  
                  {opportunity.homepage && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a 
                        href={opportunity.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary truncate"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {opportunityTypes[index % opportunityTypes.length]}
                    </Badge>
                    {opportunity.city && (
                      <Badge variant="outline" className="text-xs">
                        {opportunity.city}
                      </Badge>
                    )}
                  </div>
                  
                  {opportunity.homepage && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      asChild
                    >
                      <a 
                        href={opportunity.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Connect
                      </a>
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          {opportunitiesData.length > 0 && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Opportunity Insights</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-primary">{opportunitiesData.length}</span>
                  <span className="text-muted-foreground ml-1">Total Opportunities</span>
                </div>
                <div>
                  <span className="font-medium text-primary">
                    {new Set(opportunitiesData.map(o => o.city).filter(Boolean)).size}
                  </span>
                  <span className="text-muted-foreground ml-1">Cities</span>
                </div>
                <div>
                  <span className="font-medium text-primary">
                    {opportunitiesData.filter(o => o.homepage).length}
                  </span>
                  <span className="text-muted-foreground ml-1">With Websites</span>
                </div>
              </div>
              
              {businessContext?.industry && (
                <div className="mt-3 p-3 bg-primary/5 rounded-md">
                  <div className="text-sm">
                    <span className="font-medium text-primary">Industry Focus:</span>
                    <span className="text-muted-foreground ml-2">
                      These opportunities are curated for the {businessContext.industry.toLowerCase()} sector
                      {businessContext.target_market && `, targeting ${businessContext.target_market.toLowerCase()}`}.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
