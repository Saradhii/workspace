"use client";

import React, { useEffect, useRef, useState } from "react";

type NeonBackgroundProps = {
  className?: string;
  /** Array of neon colors in hex format */
  colors?: string[];
  /** Disable on mobile devices for performance */
  disableOnMobile?: boolean;
};

/**
 * 3D Neon Background effect using threejs-components
 * Creates an animated full-screen neon effect with glowing tubes that spread across the entire screen
 */
export function NeonBackground({
  className = "",
  colors = ["#f967fb", "#53bc28", "#6958d5", "#83f36e", "#fe8a2e", "#ff008a", "#60aed5"],
  disableOnMobile = true,
}: NeonBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Initialize Neon Background
  useEffect(() => {
    // Skip if mobile and disabled
    if (disableOnMobile && isMobile) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dynamically import the Neon Background library
    let cleanup: (() => void) | undefined;

    const initNeonBackground = async () => {
      try {
        // Import the neon background component to avoid SSR issues
        const NeonBackgroundModule = await import("threejs-components/build/backgrounds/neon1.min.js");
        const NeonBackgroundFn = NeonBackgroundModule.default;

        // Initialize the full-screen neon background effect
        const app = NeonBackgroundFn(canvas, {
          colors: colors,
        });

        appRef.current = app;

        // Cleanup function
        cleanup = () => {
          // Dispose of Three.js resources if available
          if (app && typeof app.dispose === "function") {
            app.dispose();
          }

          appRef.current = null;
        };
      } catch (error) {
        console.error("Failed to load Neon Background:", error);
      }
    };

    initNeonBackground();

    return () => {
      cleanup?.();
    };
  }, [colors, isMobile, disableOnMobile]);

  // Don't render on mobile if disabled
  if (disableOnMobile && isMobile) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      id="neon-background-canvas"
      className={className}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

export default NeonBackground;
