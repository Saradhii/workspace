"use client";

import { motion } from "framer-motion";
import { memo } from "react";
import { Suggestion } from "../image-creation/elements/suggestion";

type SuggestedActionsProps = {
  onSuggestionClick: (suggestion: string) => void;
};

function PureSuggestedActions({ onSuggestionClick }: SuggestedActionsProps) {
  // Generic video motion suggestions that work with any uploaded image
  const suggestedActions = [
    "Slow panning movement across the scene",
    "Gentle breathing/living motion effect",
  ];

  return (
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
  );
}

export const SuggestedActions = memo(PureSuggestedActions);