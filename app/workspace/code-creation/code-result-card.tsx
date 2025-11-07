"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Download, Trash2, Code as CodeIcon, Palette } from "lucide-react";
import { Code, CodeBlock, CodeHeader } from '@/components/animate-ui/components/animate/code';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Content segment types
type ContentSegment = {
  type: 'text' | 'code';
  content: string;
  language?: string;
};

// Parse content into text and code segments
const parseContent = (content: string): ContentSegment[] => {
  const segments: ContentSegment[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index).trim();
      if (textContent) {
        segments.push({ type: 'text', content: textContent });
      }
    }

    // Add code block
    const language = match[1] || detectLanguage(match[2]);
    segments.push({
      type: 'code',
      content: match[2].trim(),
      language
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last code block
  if (lastIndex < content.length) {
    const textContent = content.slice(lastIndex).trim();
    if (textContent) {
      segments.push({ type: 'text', content: textContent });
    }
  }

  // If no code blocks found, treat entire content as code (fallback for plain code responses)
  if (segments.length === 0 && content.trim()) {
    segments.push({
      type: 'code',
      content: content.trim(),
      language: detectLanguage(content)
    });
  }

  return segments;
};

// Language detection helper
const detectLanguage = (code: string): string => {
  if (code.includes('import React') || code.includes('useState') || code.includes('useEffect') || code.includes('<div') || code.includes('JSX.Element')) return 'tsx';
  if (code.includes('function') && (code.includes('=>') || code.includes('const '))) return 'javascript';
  if (code.includes('def ') || code.includes('import ') && code.includes('print(')) return 'python';
  if (code.includes('public class') || code.includes('public static void')) return 'java';
  if (code.includes('#include') || code.includes('std::')) return 'cpp';
  if (code.includes('<!DOCTYPE') || code.includes('<html')) return 'html';
  if (code.includes('{') && code.includes('}') && code.includes(':') && !code.includes('function')) return 'css';
  if (code.includes('SELECT') || code.includes('INSERT INTO') || code.includes('CREATE TABLE')) return 'sql';
  if (code.match(/^[\s\n]*\{/)) return 'json';
  if (code.includes('#!/bin/bash') || code.includes('echo ')) return 'bash';
  return 'javascript'; // default
};

// Language metadata
const languageInfo = {
  tsx: { name: 'TypeScript React', icon: '⚛️' },
  typescript: { name: 'TypeScript', icon: '📘' },
  javascript: { name: 'JavaScript', icon: '⚡' },
  python: { name: 'Python', icon: '🐍' },
  java: { name: 'Java', icon: '☕' },
  cpp: { name: 'C++', icon: '⚙️' },
  html: { name: 'HTML', icon: '🌐' },
  css: { name: 'CSS', icon: '🎨' },
  sql: { name: 'SQL', icon: '🗃️' },
  json: { name: 'JSON', icon: '📄' },
  bash: { name: 'Bash', icon: '💻' },
};

// Theme options for code syntax highlighting
const themeOptions = [
  { value: 'auto', label: 'Auto (System)', group: 'System' },
  { value: 'github-dark-default', label: 'GitHub Dark', group: 'Dark' },
  { value: 'dracula', label: 'Dracula', group: 'Dark' },
  { value: 'nord', label: 'Nord', group: 'Dark' },
  { value: 'tokyo-night', label: 'Tokyo Night', group: 'Dark' },
  { value: 'one-dark-pro', label: 'One Dark Pro', group: 'Dark' },
  { value: 'vitesse-dark', label: 'Vitesse Dark', group: 'Dark' },
  { value: 'min-light', label: 'Minimal Light', group: 'Light' },
  { value: 'github-light', label: 'GitHub Light', group: 'Light' },
  { value: 'vitesse-light', label: 'Vitesse Light', group: 'Light' },
  { value: 'rose-pine-dawn', label: 'Rosé Pine Dawn', group: 'Light' },
];

interface CodeResultCardProps {
  message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    language?: string;
    isTyping?: boolean;
  };
  onCopy?: (code: string) => void;
  onDownload?: (code: string) => void;
  onDelete?: () => void;
  language?: string;
  showLineNumbers?: boolean;
}

export function CodeResultCard({ message, onCopy, onDownload, onDelete }: CodeResultCardProps) {
  const isUser = message.role === "user";
  const segments = parseContent(message.content);

  // Theme state with localStorage persistence
  const [codeTheme, setCodeTheme] = useState<string>('auto');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('code-theme');
    if (savedTheme) {
      setCodeTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage when it changes
  const handleThemeChange = (newTheme: string) => {
    setCodeTheme(newTheme);
    localStorage.setItem('code-theme', newTheme);
  };

  // Get theme object based on selection
  const getThemes = () => {
    if (codeTheme === 'auto') {
      return {
        light: 'min-light',
        dark: 'github-dark-default'
      };
    }
    // Single theme for both modes
    return {
      light: codeTheme,
      dark: codeTheme
    };
  };

  const handleCopy = async () => {
    if (!message.content) return;
    if (onCopy) onCopy(message.content);
  };

  const handleDownload = () => {
    if (!message.content) return;
    if (onDownload) onDownload(message.content);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* Assistant icon */}
      {message.role === "assistant" && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <CodeIcon className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className={`flex flex-col gap-4 ${isUser ? "max-w-[80%]" : "w-full max-w-4xl"}`}>
        {/* Header with metadata and actions */}
        <div className={`flex items-center gap-2 flex-wrap ${isUser ? "justify-end" : "justify-start"}`}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>💻</span>
            <span>Code Generation</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString()}
          </div>

          {/* Theme selector for assistant messages */}
          {!isUser && (
            <div className="flex items-center gap-1 ml-auto">
              <Select value={codeTheme} onValueChange={handleThemeChange}>
                <SelectTrigger className="h-7 w-[140px] text-xs gap-1">
                  <Palette className="h-3 w-3" />
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto" className="text-xs">
                    🎨 Auto (System)
                  </SelectItem>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Dark Themes
                  </div>
                  <SelectItem value="github-dark-default" className="text-xs">
                    🌙 GitHub Dark
                  </SelectItem>
                  <SelectItem value="dracula" className="text-xs">
                    🧛 Dracula
                  </SelectItem>
                  <SelectItem value="nord" className="text-xs">
                    ❄️ Nord
                  </SelectItem>
                  <SelectItem value="tokyo-night" className="text-xs">
                    🌃 Tokyo Night
                  </SelectItem>
                  <SelectItem value="one-dark-pro" className="text-xs">
                    🌑 One Dark Pro
                  </SelectItem>
                  <SelectItem value="vitesse-dark" className="text-xs">
                    🌌 Vitesse Dark
                  </SelectItem>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Light Themes
                  </div>
                  <SelectItem value="min-light" className="text-xs">
                    ☀️ Minimal Light
                  </SelectItem>
                  <SelectItem value="github-light" className="text-xs">
                    ☁️ GitHub Light
                  </SelectItem>
                  <SelectItem value="vitesse-light" className="text-xs">
                    🌤️ Vitesse Light
                  </SelectItem>
                  <SelectItem value="rose-pine-dawn" className="text-xs">
                    🌸 Rosé Pine Dawn
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Action buttons */}
              {onCopy && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 transition-opacity hover:opacity-80"
                  onClick={handleCopy}
                  title="Copy all code"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
              {onDownload && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 transition-opacity hover:opacity-80"
                  onClick={handleDownload}
                  title="Download code"
                >
                  <Download className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500 hover:text-red-400 transition-opacity hover:opacity-80"
                  onClick={onDelete}
                  title="Delete message"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Content segments */}
        {isUser ? (
          // Simple display for user messages
          <div className="rounded-xl border border-primary bg-primary text-primary-foreground p-4 shadow-sm text-sm leading-relaxed">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ) : (
          // Render segments for assistant messages
          <div className="space-y-4">
            {segments.map((segment, index) => {
              const isLastSegment = index === segments.length - 1;
              const shouldAnimate = message.isTyping && isLastSegment;

              if (segment.type === 'text') {
                // Render text segment
                return (
                  <div
                    key={index}
                    className="text-sm text-foreground leading-relaxed whitespace-pre-wrap"
                  >
                    {segment.content}
                  </div>
                );
              } else {
                // Render code segment with Animate UI (out of the box)
                return (
                  <Code
                    key={index}
                    className="w-full"
                    code={segment.content}
                  >
                    <CodeHeader copyButton>
                      code.{segment.language || 'js'}
                    </CodeHeader>
                    <CodeBlock
                      cursor={shouldAnimate}
                      lang={segment.language as any}
                      writing={shouldAnimate}
                      duration={shouldAnimate ? 30 : 0}
                      delay={0}
                      themes={getThemes()}
                    />
                  </Code>
                );
              }
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
