"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StageSkeleton from "@/components/dashboard/StageSkeleton";
import { 
  Target, 
  ArrowLeft,
  User,
  Settings,
  LogOut,
  Download,
  Edit,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function MilestonesPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        {/* Top Bar */}
        <header className="flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
          <div className="flex items-center gap-2 px-4 flex-1">
            <h1 className="text-lg font-semibold">Development Milestones - Stage 4</h1>
            <Badge className="bg-gray-100 text-gray-500 border-gray-200">
              Locked
            </Badge>
          </div>
          
          {/* Top Right Buttons */}
          <div className="flex items-center gap-2 px-4">
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <StageSkeleton
              stage={{
                title: "Smart Milestone Planning",
                description: "Generate and manage development milestones with AI-powered insights and progress tracking",
                status: "locked",
                features: [
                  "AI-generated milestone recommendations",
                  "Customizable milestone templates",
                  "Progress tracking and analytics",
                  "Team collaboration and task assignment",
                  "Integration with popular project tools",
                  "Risk assessment for each milestone",
                  "Resource allocation suggestions",
                  "Automated progress reporting"
                ],
                estimatedTime: "20-30 minutes",
                actionText: "Generate Milestones"
              }}
            />
          </motion.div>

          {/* Bottom Right Action Buttons */}
          <div className="fixed bottom-6 right-6 flex gap-3">
            <Button variant="outline" disabled>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" disabled>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button disabled>
              Validate
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
