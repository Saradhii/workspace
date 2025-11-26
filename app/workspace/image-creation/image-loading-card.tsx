"use client";

import React from "react";
import { motion } from "motion/react";

interface ImageLoadingCardProps {
  colorTheme?: "chroma" | "neta-lumina";
}

export function ImageLoadingCard({ colorTheme = "chroma" }: ImageLoadingCardProps) {
  const backgroundClass = colorTheme === "neta-lumina"
    ? "bg-gradient-to-br from-emerald-900 to-emerald-800 dark:from-gray-900 dark:to-emerald-900"
    : "bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900";

  return (
    <div className={`relative w-[600px] h-[400px] rounded-lg shadow-lg overflow-hidden ${backgroundClass}`}>

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