"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Zap, Target, Sparkles, Brain, Rocket, Shield, ArrowUpRight } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Transform Ideas Fast",
    description: "AI-driven ideation and concept validation for rapid product scoping.",
    gradient: "from-blue-500 to-cyan-500",
    size: "large",
    stats: "10x faster"
  },
  {
    icon: Target,
    title: "Smarter Strategy",
    description: "Comprehensive research and brand strategy streamlined.",
    gradient: "from-purple-500 to-pink-500",
    size: "medium",
    stats: "95% accuracy"
  },
  {
    icon: Sparkles,
    title: "Launch Confident",
    description: "Data-backed KPIs and automated compliance.",
    gradient: "from-green-500 to-emerald-500",
    size: "medium",
    stats: "$2M+ saved"
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Advanced ML algorithms analyze market trends and consumer behavior.",
    gradient: "from-orange-500 to-red-500",
    size: "large",
    stats: "1000+ insights"
  },
  {
    icon: Rocket,
    title: "10-Stage Development",
    description: "Comprehensive lifecycle management from concept to launch.",
    gradient: "from-pink-500 to-rose-500",
    size: "medium",
    stats: "10 stages"
  },
  {
    icon: Shield,
    title: "Risk Mitigation",
    description: "Identify challenges before they become costly problems.",
    gradient: "from-indigo-500 to-purple-500",
    size: "small",
    stats: "99% secure"
  }
];

export default function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-surface px-4 py-2 rounded-full text-sm font-medium border border-surface mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Sparkles className="h-4 w-4 text-surface-accent" />
            <span className="text-surface-accent">Powerful Features</span>
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-surface mb-6">
            Why Choose <span className="gradient-text">BrandOrb AI</span>?
          </h2>
          <p className="text-lg md:text-xl text-surface-muted max-w-3xl mx-auto leading-relaxed">
            Discover how our AI-powered platform transforms the way you develop and launch products with cutting-edge technology.
          </p>
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 h-auto">
          
          {/* Large Feature Card - Transform Ideas */}
          <motion.div
            className="md:col-span-2 lg:col-span-3 md:row-span-2"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="h-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-200/20 dark:border-blue-700/20 overflow-hidden group hover:shadow-xl transition-all duration-500">
              <CardContent className="p-8 h-full flex flex-col justify-between relative">
                <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity">
                  <Zap className="h-20 w-20 text-blue-500" />
                </div>
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-surface mb-4">
                    Transform Ideas Fast
                  </h3>
                  <p className="text-surface-muted text-lg leading-relaxed mb-6">
                    AI-driven ideation, concept validation, and market feedback integration for rapid product scoping. Turn concepts into reality in record time.
                  </p>
                </div>
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                    <span className="text-2xl font-bold">10x</span>
                    <span>faster</span>
                  </div>
                  <motion.div 
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400"
                    whileHover={{ x: 5 }}
                  >
                    <span className="text-sm font-medium">Learn More</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Analysis - Large Card */}
          <motion.div
            className="md:col-span-2 lg:col-span-3 md:row-span-2"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="h-full bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-200/20 dark:border-orange-700/20 overflow-hidden group hover:shadow-xl transition-all duration-500">
              <CardContent className="p-8 h-full flex flex-col justify-between relative">
                <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity">
                  <Brain className="h-20 w-20 text-orange-500" />
                </div>
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-surface mb-4">
                    AI-Powered Analysis
                  </h3>
                  <p className="text-surface-muted text-lg leading-relaxed mb-6">
                    Advanced machine learning algorithms analyze market trends, consumer behavior, and competitive landscapes to optimize your strategy.
                  </p>
                </div>
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold">
                    <span className="text-2xl font-bold">1000+</span>
                    <span>insights</span>
                  </div>
                  <motion.div 
                    className="flex items-center gap-2 text-orange-600 dark:text-orange-400"
                    whileHover={{ x: 5 }}
                  >
                    <span className="text-sm font-medium">Explore</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Medium Cards Row */}
          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Card className="h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200/20 dark:border-purple-700/20 overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-surface mb-3">
                  Smarter Strategy
                </h3>
                <p className="text-surface-muted mb-4">
                  Comprehensive research and brand strategy streamlined with AI insights.
                </p>
                <div className="text-purple-600 dark:text-purple-400 font-semibold">
                  95% accuracy
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Card className="h-full bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-200/20 dark:border-green-700/20 overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 relative">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-surface mb-3">
                  Launch Confident
                </h3>
                <p className="text-surface-muted mb-4">
                  Data-backed KPIs and automated compliance keep you competitive.
                </p>
                <div className="text-green-600 dark:text-green-400 font-semibold">
                  $2M+ saved
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Card className="h-full bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-200/20 dark:border-pink-700/20 overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 relative">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
                  <Rocket className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-surface mb-3">
                  10-Stage Development
                </h3>
                <p className="text-surface-muted mb-4">
                  Comprehensive lifecycle management from concept to launch.
                </p>
                <div className="text-pink-600 dark:text-pink-400 font-semibold">
                  10 stages
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
