"use client";

import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

export function TextLoadingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </motion.div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                AI Assistant
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Generating response...</span>
              </div>
            </div>

            <div className="space-y-2">
              {/* Animated placeholder lines */}
              <motion.div
                className="h-3 bg-muted rounded-full"
                initial={{ width: "40%" }}
                animate={{ width: "90%" }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
              />
              <motion.div
                className="h-3 bg-muted rounded-full"
                initial={{ width: "60%" }}
                animate={{ width: "80%" }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", delay: 0.2 }}
              />
              <motion.div
                className="h-3 bg-muted rounded-full w-3/4"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", delay: 0.4 }}
              />
              <motion.div
                className="h-3 bg-muted rounded-full w-1/2"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", delay: 0.6 }}
              />
            </div>

            <div className="text-xs text-muted-foreground pt-2">
              Using {typeof window !== 'undefined' ? window.localStorage.getItem('selectedModel') || 'GPT-4' : 'GPT-4'} • This usually takes a few seconds
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}