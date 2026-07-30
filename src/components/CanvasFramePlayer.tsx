'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useScroll, useTransform } from 'framer-motion';

interface CanvasFramePlayerProps {
  folderPath: string; // e.g. '/frames/hero' or '/frames/experience'
  frameCount?: number;
  className?: string;
  children?: React.ReactNode;
}

export const CanvasFramePlayer: React.FC<CanvasFramePlayerProps> = ({
  folderPath,
  frameCount = 300,
  className = '',
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // Track scroll progress of container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Map scroll (0 to 1) to frame index (0 to 299)
  const currentFrameIndex = useTransform(scrollYProgress, [0, 1], [0, frameCount - 1]);

  // Format frame number to 3-digit string (e.g., ezgif-frame-001.jpg)
  const getFrameFilename = useCallback(
    (index: number) => {
      const padded = String(index + 1).padStart(3, '0');
      return `${folderPath}/ezgif-frame-${padded}.jpg`;
    },
    [folderPath]
  );

  // Preload frames with instant fallback for localhost stability
  useEffect(() => {
    let isMounted = true;
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    // Fail-safe timeout: Ensure page is marked loaded within 1 second max
    const fallbackTimeout = setTimeout(() => {
      if (isMounted) {
        setIsLoaded(true);
      }
    }, 1000);

    const checkLoaded = () => {
      if (!isMounted) return;
      loadedCount++;
      setLoadProgress(Math.round((loadedCount / frameCount) * 100));
      if (loadedCount >= frameCount || loadedCount >= 15) {
        setIsLoaded(true);
      }
    };

    // Load every frame progressively
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = getFrameFilename(i);
      img.onload = checkLoaded;
      img.onerror = checkLoaded;
      loadedImages.push(img);
    }
    setImages(loadedImages);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
    };
  }, [getFrameFilename, frameCount]);

  // Draw frame on canvas
  const drawFrame = useCallback(
    (frameIdx: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = images[frameIdx];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      // Set canvas dimensions to window resolution
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Object-fit: cover calculation
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = canvas.width / canvas.height;

      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        drawHeight = canvas.width / imgRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    },
    [images]
  );

  // Render loop driven by scroll transform
  useEffect(() => {
    const unsubscribe = currentFrameIndex.on('change', (latestIndex) => {
      const idx = Math.min(frameCount - 1, Math.max(0, Math.round(latestIndex)));
      requestAnimationFrame(() => drawFrame(idx));
    });

    // Initial draw
    if (images.length > 0) {
      drawFrame(0);
    }

    const handleResize = () => {
      const idx = Math.min(frameCount - 1, Math.max(0, Math.round(currentFrameIndex.get())));
      drawFrame(idx);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      unsubscribe();
      window.removeEventListener('resize', handleResize);
    };
  }, [currentFrameIndex, drawFrame, frameCount, images, isLoaded]);

  return (
    <div ref={containerRef} className={`relative h-[300vh] ${className}`}>
      {/* Sticky Fullscreen Canvas Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-haven-bg">
        {/* Canvas background layer */}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />

        {/* Ambient Dark Overlay + Gold Glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-haven-bg via-transparent to-haven-bg/60 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,162,39,0.08)_0%,transparent_70%)] pointer-events-none" />

        {/* Loading Indicator */}
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-haven-bg/90 z-40 backdrop-blur-md">
            <div className="w-16 h-16 border-2 border-haven-gold/20 border-t-haven-gold rounded-full animate-spin mb-4" />
            <p className="font-serif text-lg tracking-widest text-haven-gold uppercase">Loading Cinematic Experience...</p>
            <p className="font-sans text-xs text-haven-text-muted mt-1">{loadProgress}% loaded</p>
          </div>
        )}

        {/* Foreground Animated Storytelling Overlay */}
        <div className="relative z-20 h-full w-full pointer-events-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
