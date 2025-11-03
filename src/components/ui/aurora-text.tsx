"use client"

import React, { memo } from "react"
import { cn } from "@/lib/utils"

interface AuroraTextProps {
  children: React.ReactNode
  className?: string
  colors?: string[]
  speed?: number
}

export const AuroraText = memo(
  ({
    children,
    className = "",
    colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981"],
    speed = 1.5,
  }: AuroraTextProps) => {
    return (
      <span className={cn("relative inline-block", className)}>
        <span
          className="bg-gradient-to-r bg-clip-text text-transparent"
          style={{
            backgroundImage: `linear-gradient(135deg, ${colors.join(", ")}, ${colors[0]})`,
            backgroundSize: "200% 100%",
            animation: `gradient ${10 / speed}s ease infinite`,
          }}
        >
          {children}
          <style jsx global>{`
            @keyframes gradient {
              0%, 100% {
                background-position: 0% 50%;
              }
              50% {
                background-position: 100% 50%;
              }
            }
          `}</style>
        </span>
      </span>
    )
  }
)

AuroraText.displayName = "AuroraText"
