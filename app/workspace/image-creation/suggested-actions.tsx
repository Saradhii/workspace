"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "./elements/suggestion";

type SuggestedActionsProps = {
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  onClearChat?: () => void;
  onSuggestionClick?: (suggestion: string) => void;
  chatId?: string;
  selectedVisibilityType?: string;
};

function PureSuggestedActions({ sendMessage, onClearChat, onSuggestionClick }: SuggestedActionsProps) {
  const suggestedActions = [
    "A futuristic city skyline at sunset",
    "A cute robot reading a book in a library",
    "A mystical forest with glowing mushrooms",
    "A serene beach with crystal clear water",
  ];

  const handleClearChat = () => {
    if (onClearChat) {
      onClearChat();
    }
  };

  return (
    <div className="space-y-4">
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
              onClick={(suggestion) => {
                if (onSuggestionClick) {
                  onSuggestionClick(suggestion);
                } else {
                  sendMessage({
                    role: "user",
                    parts: [{ type: "text", text: suggestion }],
                  });
                }
              }}
              suggestion={suggestedAction}
            >
              {suggestedAction}
            </Suggestion>
          </motion.div>
        ))}
      </div>

      {onClearChat && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * suggestedActions.length }}
        >
          <Suggestion
            className="w-full p-3 bg-muted/50 hover:bg-muted border border-muted-foreground/20"
            onClick={handleClearChat}
            suggestion="🗑️ Clear Chat"
          >
            🗑️ Clear Chat
          </Suggestion>
        </motion.div>
      )}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);