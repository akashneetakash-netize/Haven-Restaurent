'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { CanvasFramePlayer } from '@/components/CanvasFramePlayer';

interface StoryStep {
  number: string;
  subtitle: string;
  title: string;
  description: string;
}

const DRINKS_AFTER_STEPS: StoryStep[] = [
  {
    number: '01',
    subtitle: 'Artisanal Distillation',
    title: 'Rare Spirits & Smoked Rye',
    description: 'Small-batch botanical spirits aged in oak barrels and infused with rare single-origin spices.',
  },
  {
    number: '02',
    subtitle: 'The Smoked Barrel',
    title: 'Wood & Amber Fire',
    description: 'Hand-flamed citrus oils, smoked aromatic herbs, and hand-carved crystal ice spheres.',
  },
  {
    number: '03',
    subtitle: 'Botanical Harmony',
    title: 'Curated Mixology',
    description: 'Every cocktail balanced to complement your dinner tasting journey.',
  },
  {
    number: '04',
    subtitle: 'Nightfall Lounge',
    title: 'Unwind in Warm Velvet',
    description: 'Sink into dark velvet seating as live vinyl jazz rhythms set the tone for the night.',
  },
];

function DrinksStepItem({
  step,
  idx,
  scrollYProgress,
}: {
  step: StoryStep;
  idx: number;
  scrollYProgress: MotionValue<number>;
}) {
  const start = idx * 0.25;
  const end = (idx + 1) * 0.25;
  const mid = (start + end) / 2;

  const opacity = useTransform(
    scrollYProgress,
    idx === 0 ? [0, 0.18, 0.25] : [start, mid - 0.05, mid + 0.05, end],
    idx === 0 ? [1, 1, 0] : [0, 1, 1, 0]
  );

  const y = useTransform(
    scrollYProgress,
    idx === 0 ? [0, 0, -30] : [start, mid - 0.05, mid + 0.05, end],
    idx === 0 ? [0, 0, -30] : [30, 0, 0, -30]
  );

  return (
    <motion.div
      key={`drink-step-${step.number}`}
      style={{ opacity, y }}
      className="absolute inset-x-6 sm:inset-x-12 max-w-2xl text-left"
    >
      <div className="flex items-center gap-3 text-haven-gold font-serif text-sm sm:text-base tracking-[0.25em] uppercase mb-4">
        <span className="font-bold text-xl sm:text-2xl">{step.number}</span>
        <span className="w-8 h-[1px] bg-haven-gold/60" />
        <span>{step.subtitle}</span>
      </div>

      <h2 className="font-serif text-4xl sm:text-6xl md:text-7xl font-light text-[#F5F0E8] tracking-wide leading-tight mb-4 drop-shadow-lg">
        {step.title}
      </h2>

      <p className="font-sans text-lg sm:text-2xl text-[#E8D5A3]/95 font-light leading-relaxed max-w-xl drop-shadow-md">
        {step.description}
      </p>
    </motion.div>
  );
}

function DrinksStepIndicator({
  step,
  idx,
  scrollYProgress,
}: {
  step: StoryStep;
  idx: number;
  scrollYProgress: MotionValue<number>;
}) {
  const start = idx * 0.25;
  const end = (idx + 1) * 0.25;

  const stepOpacity = useTransform(
    scrollYProgress,
    [start, start + 0.05, end - 0.05, end],
    [0.4, 1, 1, 0.4]
  );

  return (
    <motion.span style={{ opacity: stepOpacity }}>
      {step.number} — {step.subtitle}
    </motion.span>
  );
}

export function AfterDrinksStorytellerCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  return (
    <div ref={containerRef} className="relative border-t border-haven-gold/20">
      <CanvasFramePlayer folderPath="/frames/drinks_after" frameCount={300}>
        <div className="relative h-full w-full flex items-center justify-center">
          <div className="max-w-5xl w-full px-6 sm:px-12 flex flex-col justify-center">
            {DRINKS_AFTER_STEPS.map((step, idx) => (
              <DrinksStepItem
                key={`drink-step-${step.number}`}
                step={step}
                idx={idx}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>

          <div className="absolute bottom-10 inset-x-0 flex flex-col items-center gap-3 px-6 pointer-events-none">
            <div className="flex items-center gap-4 text-xs font-serif tracking-widest text-[#F5F0E8]/80">
              {DRINKS_AFTER_STEPS.map((step, idx) => (
                <DrinksStepIndicator
                  key={step.number}
                  step={step}
                  idx={idx}
                  scrollYProgress={scrollYProgress}
                />
              ))}
            </div>

            <div className="w-48 sm:w-64 h-[2px] bg-white/20 rounded-full overflow-hidden relative">
              <motion.div
                style={{ scaleX: scrollYProgress, transformOrigin: '0%' }}
                className="w-full h-full bg-haven-gold"
              />
            </div>
          </div>
        </div>
      </CanvasFramePlayer>
    </div>
  );
}
