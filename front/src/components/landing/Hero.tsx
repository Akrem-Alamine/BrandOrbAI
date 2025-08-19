"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Target, Play, Pause, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export default function Hero() {
  const [showVideo, setShowVideo] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Check if user has seen the intro before
    const hasSeenIntro = localStorage.getItem('hasSeenIntro');
    
    if (!hasSeenIntro) {
      // Auto-play video on first visit
      if (videoRef.current) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    } else {
      // Skip intro if user has seen it before
      setShowVideo(false);
      setVideoEnded(true);
    }
  }, []);

  const handleVideoEnd = () => {
    setVideoEnded(true);
    localStorage.setItem('hasSeenIntro', 'true');
    
    // Animate video to bento box after a brief pause
    setTimeout(() => {
      setShowVideo(false);
    }, 1000);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skipIntro = () => {
    setVideoEnded(true);
    setShowVideo(false);
    localStorage.setItem('hasSeenIntro', 'true');
  };

  return (
    <>
      {/* Full Screen Video Intro */}
      <AnimatePresence>
        {showVideo && !videoEnded && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="relative w-full h-full"
              initial={{ scale: 1 }}
              exit={{ 
                scale: 0.3,
                x: "40vw",
                y: "20vh",
                borderRadius: "16px"
              }}
              transition={{ duration: 1, ease: "easeInOut" }}
            >
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted={isMuted}
                onEnded={handleVideoEnd}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src="/landing.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Video Controls */}
              <div className="absolute bottom-8 left-8 flex items-center gap-4">
                <motion.button
                  onClick={togglePlay}
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
                </motion.button>
                
                <motion.button
                  onClick={toggleMute}
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </motion.button>
              </div>

              {/* Skip Button */}
              <motion.button
                onClick={skipIntro}
                className="absolute top-8 right-8 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Skip Intro
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Hero Section with Bento Layout */}
      <section className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 flex">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-12 gap-6 min-h-[80vh]">
            
            {/* Left Side - Main Content */}
            <motion.div
              className="col-span-12 lg:col-span-7 flex flex-col justify-center space-y-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: showVideo ? 1.5 : 0, duration: 0.8 }}
            >
              {/* Badge */}
              <motion.div
                className="inline-flex items-center gap-2 bg-surface px-4 py-2 rounded-full text-sm font-medium border border-surface w-fit"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: showVideo ? 1.7 : 0.2, duration: 0.5 }}
              >
                <Sparkles className="h-4 w-4 text-surface-accent" />
                <span className="text-surface-accent">AI-Powered Product Development</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: showVideo ? 1.8 : 0.3, duration: 0.8 }}
              >
                <span className="gradient-text">
                  AI-powered.
                </span>
                <br />
                <span className="text-surface">
                  Product Launches.
                </span>
                <br />
                <span className="text-surface-muted text-3xl md:text-4xl lg:text-5xl">
                  From concept to launch.
                </span>
              </motion.h1>

              {/* Description */}
              <motion.p
                className="text-lg md:text-xl text-surface-muted max-w-2xl leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: showVideo ? 1.9 : 0.4, duration: 0.8 }}
              >
                AI-driven ideation, concept validation, and market feedback integration 
                for rapid product scoping. Experience a smarter way to innovate.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: showVideo ? 2.0 : 0.5, duration: 0.8 }}
              >
                <Button size="lg" asChild className="group flex-1">
                  <Link href="/onboarding" className="flex items-center gap-2 justify-center text-white">
                    <span className="text-white">Get Started</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 text-white" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="flex-1">
                  <Link href="#demo" className="flex items-center justify-center">
                    Watch Demo
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Side - Bento Grid */}
            <motion.div
              className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-4 h-full"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: showVideo ? 2.1 : 0.6, duration: 0.8 }}
            >
              
              {/* Video Bento Box - Only show after intro */}
              <AnimatePresence>
                {videoEnded && (
                  <motion.div
                    className="col-span-2 row-span-2"
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    <Card className="h-full bg-surface/30 backdrop-blur-sm overflow-hidden group p-0">
                      <CardContent className="h-full relative p-0">
                        <div className="w-full h-full aspect-video">
                          <video
                            className="w-full h-full object-cover rounded-lg cursor-pointer"
                            muted
                            loop
                            autoPlay
                            onClick={togglePlay}
                          >
                            <source src="/landing.mp4" type="video/mp4" />
                          </video>
                        </div>
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <motion.div
                            className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                            whileHover={{ scale: 1.1 }}
                          >
                            <Play className="h-8 w-8 text-white ml-1" />
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Feature Cards */}
              <motion.div
                className={`${videoEnded ? 'col-span-1' : 'col-span-2'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: showVideo ? 2.2 : 0.7, duration: 0.6 }}
              >
                <Card className="h-full bg-surface/30 backdrop-blur-sm border-surface/20 hover:border-surface/40 transition-colors">
                  <CardContent className="p-3 h-full flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-surface mb-2">
                      Transform Ideas Fast
                    </h3>
                    <p className="text-sm text-surface-muted">
                      Rapid product scoping with AI
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                className={`${videoEnded ? 'col-span-1' : 'col-span-1'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: showVideo ? 2.3 : 0.8, duration: 0.6 }}
              >
                <Card className="h-full bg-surface/30 backdrop-blur-sm border-surface/20 hover:border-surface/40 transition-colors">
                  <CardContent className="p-3 h-full flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-surface mb-2">
                      Smarter Strategy
                    </h3>
                    <p className="text-sm text-surface-muted">
                      Go-to-market insights
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                className={`${videoEnded ? 'col-span-1' : 'col-span-1'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: showVideo ? 2.4 : 0.9, duration: 0.6 }}
              >
                <Card className="h-full bg-surface/30 backdrop-blur-sm border-surface/20 hover:border-surface/40 transition-colors">
                  <CardContent className="p-3 h-full flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Sparkles className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-surface mb-2">
                      Launch Confident
                    </h3>
                    <p className="text-sm text-surface-muted">
                      Data-backed decisions
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}