"use client";

import { SparklesIcon, UserIcon, CopyIcon, PencilEditIcon, PaperclipIcon } from "./icons";
import { Action, Actions } from "./elements/actions";
import { cn } from "@/lib/utils";
import type { RAGSourceDocument, AIStatus } from "@/lib/types";

interface ChatBubbleProps {
  message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    isTyping?: boolean;
    sources?: RAGSourceDocument[];
    aiStatus?: AIStatus;
    generatedWithAI?: boolean;
  };
  className?: string;
}

export function ChatBubble({ message, className }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const isTyping = message.isTyping;

  const handleCopy = async () => {
    if (!message.content.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(message.content);
      // Show success feedback (you could add a toast notification here)
      console.log("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleEdit = () => {
    // Edit functionality can be implemented later
    console.log("Edit message:", message.id);
  };

  return (
    <div
      className={cn(
        "group/message flex w-full items-start gap-2 md:gap-3",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      {message.role === "assistant" && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <SparklesIcon size={14} />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col",
          isUser && "max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]",
          !isUser && "w-full"
        )}
      >
        {isUser ? (
          <div className="bg-transparent px-0 py-0 text-right leading-tight">
            <div className="whitespace-pre-wrap break-words text-foreground" style={{ marginTop: '4.5px' }}>
              {message.content}
            </div>
            <Actions className="-mr-0.5 mt-2 justify-end opacity-0 transition-opacity group-hover/message:opacity-100">
              <div className="relative">
                <Action onClick={handleEdit} tooltip="Edit">
                  <PencilEditIcon />
                </Action>
                <Action onClick={handleCopy} tooltip="Copy">
                  <CopyIcon />
                </Action>
              </div>
            </Actions>
          </div>
        ) : (
          <div className="bg-transparent px-0 py-0 text-left leading-tight">
            {isTyping ? (
              <div className="text-muted-foreground text-sm flex items-center gap-2" style={{ marginTop: '4.5px' }}>
                <span className="inline-block w-2 h-2 bg-current rounded-full animate-pulse"></span>
                Thinking...
              </div>
            ) : (
              <div className="text-foreground leading-tight" style={{ marginTop: '4.5px' }}>
                {/* AI Status Indicator */}
                {message.generatedWithAI && message.aiStatus && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 mb-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md text-xs font-medium">
                    <SparklesIcon size={12} />
                    <span>AI Generated</span>
                    {message.aiStatus.model && (
                      <span className="text-xs opacity-70">({message.aiStatus.model})</span>
                    )}
                  </div>
                )}
                {/* Don't use TypingAnimation for streaming - text should appear naturally */}
                <div className="whitespace-pre-wrap break-words">
                  {message.content || <span className="text-muted-foreground">Generating response...</span>}
                </div>
              </div>
            )}
            {!isTyping && (
              <>
                {/* Display sources if available */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <PaperclipIcon size={14} className="text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Sources ({message.sources.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {message.sources.slice(0, 3).map((source, index) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          <span className="font-medium">
                            {source.metadata.file_name || 'Unknown document'}
                          </span>
                          {source.metadata.page_number && (
                            <span className="ml-2">
                              Page {source.metadata.page_number}
                            </span>
                          )}
                          {source.metadata.similarity_score && (
                            <span className="ml-2 text-xs">
                              ({Math.round((1 - source.metadata.similarity_score) * 100)}% match)
                            </span>
                          )}
                        </div>
                      ))}
                      {message.sources.length > 3 && (
                        <div className="text-xs text-muted-foreground italic">
                          ...and {message.sources.length - 3} more sources
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <Actions className="-ml-0.5 mt-2">
                  <Action onClick={handleCopy} tooltip="Copy">
                    <CopyIcon />
                  </Action>
                </Actions>
              </>
            )}
          </div>
        )}
      </div>
      {message.role === "user" && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <UserIcon size={14} />
        </div>
      )}
    </div>
  );
}