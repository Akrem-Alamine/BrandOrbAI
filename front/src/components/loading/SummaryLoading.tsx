"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Header from "@/components/landing/Header";

interface SummaryLoadingProps {
  onComplete?: () => void;
  duration?: number; // Duration in milliseconds
}

const loadingMessages = [
  "Hold on a second, we are cooking...",
  "Analyzing your business idea...",
  "Crafting your personalized strategy...",
  "Processing market insights...",
  "Building your business roadmap...",
  "Finalizing your success plan...",
  "Almost there, preparing your dashboard...",
  "Getting everything ready for you...",
];

export default function SummaryLoading({ onComplete, duration = 12000 }: SummaryLoadingProps) {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    // Cycle through loading messages
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % loadingMessages.length);
    }, 1500);

    // Complete loading after specified duration
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(completeTimer);
    };
  }, [onComplete, duration]);

  return (
    <>
      {/* Header */}
      <Header />
      
      {/* Full white page background */}
      <div className="min-h-screen bg-white pt-20 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Subtle background pattern */}
        <motion.div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, #3b82f6 2px, transparent 0),
                             radial-gradient(circle at 75px 75px, #8b5cf6 2px, transparent 0)`,
            backgroundSize: '100px 100px'
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Video Container - Larger and more prominent */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 mb-12"
        >
          <div className="relative w-96 md:w-[500px] lg:w-[600px] aspect-video rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="/loading_summary.mp4" type="video/mp4" />
              {/* Fallback animation if video doesn't load */}
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <motion.div
                  animate={{
                    rotate: 360,
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full"
                />
              </div>
            </video>
          </div>

          {/* Glowing effect around video */}
          <motion.div
            className="absolute inset-0 rounded-3xl"
            style={{
              boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)',
            }}
            animate={{
              boxShadow: [
                '0 0 40px rgba(59, 130, 246, 0.3)',
                '0 0 60px rgba(139, 92, 246, 0.4)',
                '0 0 40px rgba(59, 130, 246, 0.3)',
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Loading Messages */}
        <motion.div
          className="relative z-10 text-center space-y-6 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <motion.h2
            key={currentMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-gray-800"
          >
            {loadingMessages[currentMessage]}
          </motion.h2>

          <motion.p
            className="text-gray-600 text-xl leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            Our AI is analyzing your responses and creating a comprehensive business plan tailored just for you.
          </motion.p>

          {/* Enhanced Progress indicator */}
          <motion.div
            className="w-full max-w-md mx-auto mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 rounded-full relative"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: duration / 1000, ease: "easeInOut" }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </div>
            <p className="text-sm text-gray-500 mt-3 text-center font-medium">
              Processing your business insights...
            </p>
          </motion.div>
        </motion.div>

        {/* Floating elements for visual interest */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20"
            style={{
              left: `${10 + i * 12}%`,
              top: `${15 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [-15, 15, -15],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </>
  );
}
