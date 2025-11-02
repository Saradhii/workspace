"use client";

import React from "react";
import { motion } from "framer-motion";

export const Sparkles = ({ count = 12 }: { count?: number }) => {
  const [sparkles, setSparkles] = React.useState<Array<{
    id: number;
    initialTop: string;
    initialLeft: string;
    animateTop: string;
    animateLeft: string;
    opacity: number;
    duration: number;
  }>>([]);

  React.useEffect(() => {
    const randomMove = () => Math.random() * 6 - 3;
    const random = () => Math.random();

    const newSparkles = Array.from({ length: count }, (_, i) => ({
      id: i,
      initialTop: `${random() * 100}%`,
      initialLeft: `${random() * 100}%`,
      animateTop: `calc(${random() * 100}% + ${randomMove()}px)`,
      animateLeft: `calc(${random() * 100}% + ${randomMove()}px)`,
      opacity: random(),
      duration: random() * 1.5 + 2,
    }));
    setSparkles(newSparkles);
  }, [count]);

  return (
    <div className="absolute inset-0">
      {sparkles.map((sparkle) => (
        <motion.span
          key={sparkle.id}
          animate={{
            top: sparkle.animateTop,
            left: sparkle.animateLeft,
            opacity: sparkle.opacity,
            scale: [1, 1.2, 0],
          }}
          transition={{
            duration: sparkle.duration,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            top: sparkle.initialTop,
            left: sparkle.initialLeft,
            width: "2px",
            height: "2px",
            borderRadius: "50%",
            zIndex: 1,
          }}
          className="inline-block bg-black dark:bg-white"
        />
      ))}
    </div>
  );
};