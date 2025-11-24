"use client";

import React, { useEffect, useRef, useState } from "react";

type TubesCursorProps = {
  className?: string;
  /** Array of tube colors in hex format */
  tubeColors?: string[];
  /** Array of light colors in hex format */
  lightColors?: string[];
  /** Light intensity (default: 200) */
  lightIntensity?: number;
  /** Enable random color changes on click */
  enableClickColorChange?: boolean;
  /** Disable on mobile devices for performance */
  disableOnMobile?: boolean;
};

/**
 * 3D Tubes Cursor effect using threejs-components
 * Creates an animated cursor trail effect with glowing tubes that follow the mouse
 * Click anywhere to change colors randomly (just like the CodePen example)
 */
export function TubesCursor({
  className = "",
  tubeColors = ["#f967fb", "#53bc28", "#6958d5"],
  lightColors = ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"],
  lightIntensity = 200,
  enableClickColorChange = true,
  disableOnMobile = true,
}: TubesCursorProps) {
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

  // Generate random colors (from CodePen example)
  const randomColors = (count: number): string[] => {
    return new Array(count)
      .fill(0)
      .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"));
  };

  // Initialize TubesCursor
  useEffect(() => {
    // Skip if mobile and disabled
    if (disableOnMobile && isMobile) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dynamically import the TubesCursor library
    let cleanup: (() => void) | undefined;

    const initTubes = async () => {
      try {
        // Import the cursor component (follows mouse)
        const TubesCursorModule = await import("threejs-components/build/cursors/tubes1.min.js");
        const TubesCursorFn = TubesCursorModule.default;

        // Initialize the cursor effect (exact CodePen config)
        const app = TubesCursorFn(canvas, {
          tubes: {
            colors: tubeColors,
            lights: {
              intensity: lightIntensity,
              colors: lightColors,
            },
          },
        });

        appRef.current = app;

        // Handle click events for color changes (from CodePen)
        const handleClick = () => {
          if (!enableClickColorChange || !app) return;

          const newTubeColors = randomColors(tubeColors.length);
          const newLightColors = randomColors(lightColors.length);

          app.tubes?.setColors?.(newTubeColors);
          app.tubes?.setLightsColors?.(newLightColors);
        };

        if (enableClickColorChange) {
          document.body.addEventListener("click", handleClick);
        }

        // Cleanup function
        cleanup = () => {
          if (enableClickColorChange) {
            document.body.removeEventListener("click", handleClick);
          }

          // Dispose of Three.js resources if available
          if (app && typeof app.dispose === "function") {
            app.dispose();
          }

          appRef.current = null;
        };
      } catch (error) {
        console.error("Failed to load TubesCursor:", error);
      }
    };

    initTubes();

    return () => {
      cleanup?.();
    };
  }, [tubeColors, lightColors, lightIntensity, enableClickColorChange, isMobile, disableOnMobile]);

  // Don't render on mobile if disabled
  if (disableOnMobile && isMobile) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      id="tubes-cursor-canvas"
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

export default TubesCursor;
