"use client";

import { useEffect, useRef } from 'react';

interface LottieAnimationProps {
  src: string;
  className?: string;
  autoplay?: boolean;
  loop?: boolean;
  speed?: number;
}

export function LottieAnimation({ 
  src, 
  className = "", 
  autoplay = true, 
  loop = true, 
  speed = 1 
}: LottieAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically import lottie-web to avoid SSR issues
    import('lottie-web').then((lottie) => {
      if (containerRef.current) {
        const animation = lottie.default.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop,
          autoplay,
          path: src,
        });

        animation.setSpeed(speed);

        return () => {
          animation.destroy();
        };
      }
    }).catch(error => {
      console.warn('Failed to load Lottie animation:', error);
    });
  }, [src, autoplay, loop, speed]);

  return <div ref={containerRef} className={className} />;
}
