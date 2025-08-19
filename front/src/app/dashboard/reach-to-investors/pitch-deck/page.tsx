"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Presentation, FileText, Image, BarChart } from "lucide-react";

export default function PitchDeckPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Pitch Deck</h1>
        <p className="text-muted-foreground">
          Create a compelling presentation for investors and stakeholders
        </p>
      </div>

      {/* Locked State */}
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Presentation className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Pitch Deck Generator</CardTitle>
            <CardDescription>
              Complete previous steps to unlock your professional pitch deck
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Coming Soon</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
