"use client";

import { motion } from "framer-motion";

export function VideoLoadingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative w-[600px] h-[400px] rounded-lg shadow-lg overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900"
    >
      {/* Animated border corners - same style as image creation */}
      <div className="absolute top-2 left-2 w-4 h-4 border border-gray-400 dark:border-gray-300 z-10" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border border-gray-400 dark:border-gray-300 z-10" />
      <div className="absolute top-2 right-2 w-4 h-4 border border-gray-400 dark:border-gray-300 z-10" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border border-gray-400 dark:border-gray-300 z-10" />

      {/* Loading animation */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Video icon */}
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          {/* Rotating ring */}
          <motion.div
            className="absolute inset-0 w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Loading text */}
        <div className="text-center space-y-2">
          <p className="text-white font-medium">Generating Video...</p>
          <p className="text-gray-400 text-sm">This may take a few minutes</p>
        </div>

        {/* Progress bars */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Processing frames</span>
            <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subtle animated particles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-primary/30 rounded-full"
          initial={{
            x: Math.random() * 600,
            y: 400,
            opacity: 0,
          }}
          animate={{
            y: -20,
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeOut",
          }}
        />
      ))}
    </motion.div>
  );
}