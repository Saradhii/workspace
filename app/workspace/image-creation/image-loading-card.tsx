"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";

interface ImageLoadingCardProps {
  colorTheme?: "chroma" | "neta-lumina" | "flux";
}

export function ImageLoadingCard({ colorTheme = "chroma" }: ImageLoadingCardProps) {
  return (
    <div className="relative w-[600px] h-[400px] rounded-lg shadow-lg overflow-hidden">

      <AnimatePresence>
        <div className="h-full w-full absolute inset-0">
          <CanvasRevealEffect
            animationSpeed={2}
            containerClassName={
              colorTheme === "neta-lumina"
                ? "bg-gradient-to-br from-emerald-900 to-emerald-800 dark:from-gray-900 dark:to-emerald-900"
                : colorTheme === "flux"
                ? "bg-gradient-to-br from-blue-900 to-purple-900 dark:from-indigo-900 dark:to-purple-900"
                : "bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900"
            }
            colors={
              colorTheme === "neta-lumina"
                ? [
                    [16, 185, 129],  // Emerald-500
                    [5, 150, 105],   // Emerald-600
                    [4, 120, 87],    // Emerald-700
                  ]
                : colorTheme === "flux"
                ? [
                    [59, 130, 246],  // Blue-500
                    [147, 51, 234],  // Purple-600
                    [236, 72, 153],  // Pink-600
                  ]
                : [
                    [236, 72, 153],  // Pink
                    [232, 121, 249], // Purple
                    [139, 92, 246],  // Violet
                  ]
            }
            dotSize={2}
            showGradient={true}
          />
        </div>
      </AnimatePresence>

      {/* Loading content */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mb-6">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-12 w-12 text-white animate-pulse"
            >
              <path
                d="M24 4L4 14L24 24L44 14L24 4Z"
                fill="currentColor"
                fillOpacity="0.8"
              />
              <path
                d="M4 34L24 44L44 34"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 24L24 34L44 24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <motion.h2
            className="text-2xl font-semibold text-white mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Generating your image...
          </motion.h2>

          </motion.div>
      </div>
    </div>
  );
}