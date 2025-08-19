"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const statistics = [
  {
    value: 88,
    suffix: "%",
    label: "AI Accuracy Rate",
    description: "Precision in market analysis"
  },
  {
    value: 1000,
    suffix: "+",
    label: "Monthly Active Users",
    description: "Growing community of innovators"
  },
  {
    value: 40,
    suffix: "%",
    label: "Time Reduction",
    description: "Faster product development"
  }
];

function AnimatedCounter({ value, suffix, duration = 2000 }: { value: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      setCount(prev => {
        const next = prev + increment;
        if (next >= value) {
          clearInterval(timer);
          return value;
        }
        return next;
      });
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration, isVisible]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      onViewportEnter={() => setIsVisible(true)}
      className="text-center"
    >
      <div className="text-4xl md:text-5xl font-bold text-surface mb-2">
        {Math.floor(count).toLocaleString()}{suffix}
      </div>
    </motion.div>
  );
}

export default function Stats() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface-muted">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-surface mb-4">
            Trusted by Innovators Worldwide
          </h2>
          <p className="text-lg text-surface-muted max-w-2xl mx-auto">
            Join thousands of entrepreneurs and businesses who have transformed their ideas into successful products.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {statistics.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-surface rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-surface">
                <AnimatedCounter 
                  value={stat.value} 
                  suffix={stat.suffix} 
                  duration={2000 + index * 500}
                />
                <h3 className="text-xl font-semibold text-surface mb-2">
                  {stat.label}
                </h3>
                <p className="text-surface-muted">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-6 py-3 rounded-full border border-blue-200 dark:border-blue-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-surface-accent">
              Join the next generation of product innovators
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
