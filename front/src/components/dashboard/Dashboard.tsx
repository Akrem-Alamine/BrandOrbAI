"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  Circle, 
  FileText, 
  Target, 
  BarChart3, 
  Lightbulb,
  Download,
  Share2,
  Edit3,
  ArrowLeft
} from "lucide-react";
import Header from "@/components/landing/Header";

interface DashboardProps {
  sessionId: string;
  businessIdea: string;
  summary: string;
  onBack?: () => void;
  onStartNew?: () => void;
}

interface SidebarItem {
  id: string;
  title: string;
  icon: any;
  status: 'completed' | 'locked' | 'available';
  description: string;
}

export default function Dashboard({ 
  sessionId, 
  businessIdea, 
  summary, 
  onBack, 
  onStartNew 
}: DashboardProps) {
  const [activeSection, setActiveSection] = useState('summary');

  const sidebarItems: SidebarItem[] = [
    {
      id: 'ideation',
      title: 'Ideation',
      icon: Lightbulb,
      status: 'completed',
      description: 'Business idea analysis complete'
    },
    {
      id: 'critical-report',
      title: 'Critical Report',
      icon: FileText,
      status: 'locked',
      description: 'Coming soon'
    },
    {
      id: 'business-model',
      title: 'Business Model',
      icon: Target,
      status: 'locked',
      description: 'Coming soon'
    },
    {
      id: 'business-plan',
      title: 'Business Plan',
      icon: BarChart3,
      status: 'locked',
      description: 'Coming soon'
    }
  ];

  // Session persistence
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('brandorb_session_id', sessionId);
      localStorage.setItem('brandorb_business_idea', businessIdea);
      localStorage.setItem('brandorb_summary', summary);
      localStorage.setItem('brandorb_dashboard_timestamp', new Date().toISOString());
    }
  }, [sessionId, businessIdea, summary]);

  const handleDownloadSummary = () => {
    const element = document.createElement('a');
    const file = new Blob([summary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `business-plan-summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleShareSummary = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Business Plan Summary',
          text: summary,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(summary);
      // You could add a toast notification here
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-surface pt-20">
        <div className="flex">
          {/* Sidebar */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-80 min-h-screen bg-surface/50 backdrop-blur-sm border-r border-surface-muted/50 p-6"
          >
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6"
            >
              <Button
                variant="ghost"
                onClick={onBack}
                className="flex items-center gap-2 text-surface-muted hover:text-surface"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Onboarding
              </Button>
            </motion.div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold text-surface mb-2">Your Journey</h2>
              <p className="text-surface-muted text-sm">
                Track your business development progress
              </p>
            </motion.div>

            {/* Navigation Items */}
            <div className="space-y-3">
              {sidebarItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                const isLocked = item.status === 'locked';
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                  >
                    <button
                      onClick={() => !isLocked && setActiveSection(item.id)}
                      disabled={isLocked}
                      className={`w-full p-4 rounded-xl border text-left transition-all duration-300 ${
                        isActive 
                          ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                          : isLocked
                          ? 'bg-surface/30 border-surface-muted/30 text-surface-muted/50 cursor-not-allowed'
                          : 'bg-surface/50 border-surface-muted/50 text-surface hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          item.status === 'completed' 
                            ? 'bg-green-100 dark:bg-green-900/50' 
                            : isLocked 
                            ? 'bg-surface-muted/30' 
                            : 'bg-primary/10'
                        }`}>
                          {item.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <Icon className={`h-4 w-4 ${isLocked ? 'text-surface-muted/50' : 'text-primary'}`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{item.title}</h3>
                          <p className="text-xs opacity-70">{item.description}</p>
                        </div>
                        {item.status === 'completed' && (
                          <Badge variant="secondary" className="bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-300 border-green-200 dark:border-green-700/50">
                            Done
                          </Badge>
                        )}
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>

            <Separator className="my-8" />

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="space-y-3"
            >
              <Button
                onClick={onStartNew}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Start New Plan
              </Button>
            </motion.div>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            <AnimatePresence mode="wait">
              {activeSection === 'ideation' && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-4xl"
                >
                  {/* Header */}
                  <div className="mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/50">
                          <Lightbulb className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h1 className="text-3xl font-bold text-surface">Business Idea Analysis</h1>
                          <p className="text-surface-muted">Your personalized business plan summary</p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          onClick={handleDownloadSummary}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </Button>
                        <Button
                          onClick={handleShareSummary}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Share2 className="h-4 w-4" />
                          Share
                        </Button>
                      </div>
                    </motion.div>
                  </div>

                  {/* Business Idea Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mb-8"
                  >
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader>
                        <CardTitle className="text-primary">Your Business Idea</CardTitle>
                        <CardDescription>The foundation of your entrepreneurial journey</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-surface leading-relaxed">{businessIdea}</p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Summary Content */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>AI-Generated Business Plan Summary</CardTitle>
                        <CardDescription>
                          Comprehensive analysis and strategic recommendations based on your responses
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="prose max-w-none text-surface">
                          <div className="whitespace-pre-wrap text-base leading-relaxed">
                            {summary}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              )}

              {/* Other sections (locked for now) */}
              {activeSection !== 'ideation' && (
                <motion.div
                  key="locked"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center justify-center h-96"
                >
                  <Circle className="h-16 w-16 text-surface-muted mb-4" />
                  <h2 className="text-2xl font-bold text-surface mb-2">Coming Soon</h2>
                  <p className="text-surface-muted text-center max-w-md">
                    This section is currently under development. Complete your ideation phase to unlock additional features.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
