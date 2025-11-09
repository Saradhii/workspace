"use client";

import React from "react";
import { motion } from "framer-motion";
import { useState } from "react";
import { User, Copy, Download, ChevronDown, ChevronUp, Brain, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

interface TextResultCardProps {
  message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    isTyping?: boolean;
    reasoning?: string;
  };
}

export function TextResultCard({ message }: TextResultCardProps) {
  const isUser = message.role === "user";
  const isTyping = message.isTyping;
  const [showReasoning, setShowReasoning] = useState(false);
  const hasReasoning = message.reasoning && message.reasoning.trim() && !isUser;

  // Auto-show reasoning when streaming starts for reasoning models
  React.useEffect(() => {
    if (hasReasoning && isTyping) {
      setShowReasoning(true);
    }
  }, [hasReasoning, isTyping]);

  const handleCopy = async () => {
    if (!message.content.trim()) return;

    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Text copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast.error("Failed to copy text");
    }
  };

  const handleDownload = () => {
    if (!message.content.trim()) return;

    const blob = new Blob([message.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${message.role}-${message.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Text downloaded successfully!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {message.role === "assistant" && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <MessageCircle className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className={`flex flex-col ${isUser ? "max-w-[80%]" : "w-full"}`}>
        {/* Reasoning Section - Show during streaming for reasoning models and after completion */}
        {hasReasoning && (
          <div className="mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground h-auto px-2 py-1"
            >
              <Brain className="h-3 w-3" />
              <span>Thought process {isTyping && message.reasoning ? "(Streaming...)" : ""}</span>
              {showReasoning ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            {showReasoning && message.reasoning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-3"
              >
                <div className="text-xs text-muted-foreground mb-1 font-mono">
                  Thinking{isTyping ? " (Live)" : ":"}
                </div>
                <div className="whitespace-pre-wrap text-xs italic font-mono text-muted-foreground leading-relaxed">
                  {message.reasoning}
                  {isTyping && (
                    <span className="inline-block w-2 h-3 ml-1 bg-current animate-pulse" />
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}

        <div
          className={`rounded-xl border p-4 shadow-sm ${
            isUser
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border"
          }`}
        >
          {isTyping ? (
          <>
            {/* Show content if it exists while typing */}
            {message.content ? (
              <div className="space-y-2">
                <MarkdownRenderer
                  content={message.content}
                  isTyping={true}
                />
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span>Generating...</span>
                </div>
              </div>
            ) : (
              // Show thinking animation only when no content yet
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-sm">Thinking...</span>
              </div>
            )}
          </>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
        </div>

        {!isTyping && (
          <div className={`flex items-center gap-2 mt-2 ${isUser ? "justify-end" : "justify-start"}`}>
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString()}
            </span>
            {!isUser && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCopy}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleDownload}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {message.role === "user" && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </motion.div>
  );
}