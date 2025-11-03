"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AuroraEncryptedTextProps {
  text: string;
  encryptedDuration?: number;
  colors?: string[];
  speed?: number;
  encryptedClassName?: string;
  className?: string;
}

export function AuroraEncryptedText({
  text,
  encryptedDuration = 2000,
  colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981"],
  speed = 1.5,
  encryptedClassName = "text-gray-600 dark:text-gray-500",
  className = "",
}: AuroraEncryptedTextProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    // Start with encrypted state, reveal after delay
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, encryptedDuration);

    return () => clearTimeout(timer);
  }, [encryptedDuration]);

  if (!isRevealed) {
    // Show encrypted/obfuscated text without random characters to avoid hydration issues
    return (
      <span className={cn(encryptedClassName, className)}>
        {text
          .split("")
          .map((char, i) => (char === " " ? " " : String.fromCharCode(33 + (i % 94))))
          .join("")}
      </span>
    );
  }

  // Show AuroraText effect after reveal
  return (
    <span
      className={cn(
        "relative inline-block",
        "bg-gradient-to-r",
        "bg-clip-text text-transparent",
        "animate-gradient-x",
        className
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, ${colors.join(", ")}, ${colors[0]})`,
        backgroundSize: "200% 100%",
        animationDuration: `${10 / speed}s`,
      }}
    >
      {text}
      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          animation: gradient-x 6s ease infinite;
          background-size: 200% 100%;
        }
      `}</style>
    </span>
  );
}