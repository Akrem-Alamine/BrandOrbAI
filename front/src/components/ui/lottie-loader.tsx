import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

interface LottieLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LottieLoader({ size = 'md', className = '' }: LottieLoaderProps) {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    // Load the Lottie animation file
    fetch('/sparkles_loop_loader.lottie')
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => {
        console.error('Error loading Lottie animation:', error);
      });
  }, []);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  if (!animationData) {
    // Fallback to regular spinner if Lottie fails to load
    return (
      <div className={`${sizeClasses[size]} ${className} animate-spin rounded-full border-4 border-primary border-t-transparent`} />
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
