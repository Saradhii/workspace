"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const GlowingStarsBackground = ({ className }: { className?: string }) => {
  const stars = 200;
  const columns = 20;
  const [glowingStars, setGlowingStars] = useState<number[]>([]);
  const highlightedStars = useRef<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      highlightedStars.current = Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * stars)
      );
      setGlowingStars([...highlightedStars.current]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden",
        className
      )}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `2px`,
        padding: `20px`,
      }}
    >
      {[...Array(stars)].map((_, starIdx) => {
        const isGlowing = glowingStars.includes(starIdx);
        const delay = (starIdx % 10) * 0.1;
        const staticDelay = starIdx * 0.01;

        return (
          <div
            key={`matrix-col-${starIdx}`}
            className="relative flex items-center justify-center"
          >
            <motion.div
              key={delay}
              initial={{
                scale: 1,
                opacity: 0.3,
              }}
              animate={{
                scale: isGlowing ? [1, 1.5, 2, 1.5, 1] : 1,
                opacity: isGlowing ? [0.3, 0.8, 1, 0.8, 0.3] : 0.3,
                backgroundColor: isGlowing ? "#ffffff" : "#6366f1",
              }}
              transition={{
                duration: 3,
                ease: "easeInOut",
                delay: isGlowing ? delay : staticDelay,
              }}
              className={cn(
                "h-[2px] w-[2px] rounded-full relative z-20"
              )}
            />
            {isGlowing && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 2, 0],
                }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                  delay: delay,
                }}
                className="absolute left-1/2 -translate-x-1/2 z-10 h-[8px] w-[8px] rounded-full bg-blue-400 blur-sm"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};