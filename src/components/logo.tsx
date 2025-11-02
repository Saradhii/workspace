"use client";

import { motion } from "motion/react";
import { IconBrandTabler } from "@tabler/icons-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <IconBrandTabler className="size-8" />
      </motion.div>
      <span className="text-lg font-bold">
        Workspace
      </span>
    </div>
  );
}