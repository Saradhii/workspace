"use client";

import { motion } from "framer-motion";
import { memo } from "react";
import { Suggestion } from "../image-creation/elements/suggestion";

type SuggestedActionsProps = {
  onSuggestionClick: (suggestion: string) => void;
};

function PureSuggestedActions({ onSuggestionClick }: SuggestedActionsProps) {
  const suggestedActions = [
    "Write a short story about time travel",
    "Create a professional email template",
    "Write SEO-optimized meta descriptions",
    "Write a blog post about the benefits of AI",
  ];

  return (
    <div className="space-y-4 mx-auto max-w-3xl">
      <div
        className="grid w-full gap-2 sm:grid-cols-2"
        data-testid="suggested-actions"
      >
        {suggestedActions.map((suggestedAction, index) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            initial={{ opacity: 0, y: 20 }}
            key={suggestedAction}
            transition={{ delay: 0.05 * index }}
          >
            <Suggestion
              className="w-full p-3"
              onClick={() => onSuggestionClick(suggestedAction)}
              suggestion={suggestedAction}
            >
              {suggestedAction}
            </Suggestion>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions);