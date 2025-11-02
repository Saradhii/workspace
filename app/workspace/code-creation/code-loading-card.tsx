"use client";

import { motion } from "framer-motion";
import { Code } from "lucide-react";

export function CodeLoadingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-4">
          <Code className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-pulse" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Generating Code
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
            <p className="text-sm text-muted-foreground">
              Powered by Chutes AI
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}