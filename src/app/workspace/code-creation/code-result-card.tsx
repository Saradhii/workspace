"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Download, Trash2, Code } from "lucide-react";

// Language options
const languages = [
  { id: "javascript", name: "JavaScript", icon: "⚡" },
  { id: "python", name: "Python", icon: "🐍" },
  { id: "typescript", name: "TypeScript", icon: "📘" },
  { id: "java", name: "Java", icon: "☕" },
  { id: "cpp", name: "C++", icon: "⚙️" },
  { id: "html", name: "HTML", icon: "🌐" },
  { id: "css", name: "CSS", icon: "🎨" },
  { id: "sql", name: "SQL", icon: "🗃️" },
  { id: "json", name: "JSON", icon: "📄" },
  { id: "bash", name: "Bash", icon: "💻" },
  { id: "powershell", name: "PowerShell", icon: "💪" },
];

interface CodeResultCardProps {
  message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    language?: string;
  };
  onCopy?: (code: string) => void;
  onDownload?: (code: string) => void;
  onDelete?: () => void;
  language?: string;
  showLineNumbers?: boolean;
}

export function CodeResultCard({ message, onCopy, onDownload, onDelete, language, showLineNumbers }: CodeResultCardProps) {
  const isUser = message.role === "user";
  const copied = false;

  // Language syntax highlighting colors
  const languageColors: Record<string, { [key: string]: string }> = {
    javascript: { keyword: "color: #3b82f6", string: "#d4d4d4", comment: "#6a9955", function: "#82a0d2", number: "#79c0ff", operator: "#f92672" },
    python: { keyword: "color: #ff6b5b", string: "#8ec07c", comment: "#6a9955", function: "#82a0d2", number: "#79c0ff", operator: "#f92672" },
    typescript: { keyword: "color: #3b82f6", string: "#d4d4d4", comment: "#6a9955", function: "#82a0d2", number: "#79c0ff", operator: "#f92672" },
    java: { keyword: "color: #cc7852", string: "#fbbf24", comment: "#5f5a5f", function: "#ff6b6b", number: "#79c0ff", operator: "#f92672" },
    cpp: { keyword: "color: #f92672", string: "#d4d4d4", comment: "#5f5a5f", function: "#ff6b6b", number: "#79c0ff", operator: "#f92672" },
    html: { keyword: "color: #e34c26", string: "#b84f32", comment: "#6a9955", function: "#d73a3d", number: "#79c0ff", operator: "#f92672" },
    css: { keyword: "color: #8ec07c", string: "#d4d4d4", comment: "#6a9955", function: "#82a0d2", number: "#79c0ff", operator: "#f92672" },
    sql: { keyword: "color: #ff6b5b", string: "#c7a8d1", comment: "#5f5a5f", function: "#ff6b6b", number: "#79c0ff", operator: "#f92672" },
    json: { keyword: "color: #3b82f6", string: "#d4d4d4", comment: "#6a9955", function: "#82a0d2", number: "#79c0ff", operator: "#f92672" },
    bash: { keyword: "color: #4e9a06", string: "#4e9a06", comment: "#5f5a5f", function: "#56d64c", number: "#79c0ff", operator: "#f92672" },
    powershell: { keyword: "color: #0a9cdf", string: "#5eead4", comment: "#5f5a5f", function: "#56d64c", number: "#79c0ff", operator: "#f92672" },
  };

  const handleCopy = async () => {
    if (!message.content) return;
    if (onCopy) onCopy(message.content);
  };

  
  const handleDownload = () => {
    if (!message.content) return;
    if (onDownload) onDownload(message.content);
  };

  const formatCode = (code: string, language?: string) => {
    if (!language) return { lines: [{ text: code, segments: [{ text: code, style: {} }] }] };

    const colors = languageColors[language as keyof typeof languageColors] || languageColors.javascript || { keyword: "#3b82f6", string: "#d4d4d4", comment: "#6a9955", function: "#82a0d2", number: "#79c0ff", operator: "#f92672" };
    const lines = code.split('\n');

    return {
      lines: lines.map(line => {
        const segments = [];
        let currentSegment = "";
        let currentStyle: any = {};
        let inString = false;
        let stringChar = '';

        // Simple syntax highlighting
        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          // Handle string detection
          if ((char === '"' || char === "'" || char === '`') && !inString) {
            inString = true;
            stringChar = char;
            if (currentSegment) {
              segments.push({ text: currentSegment, style: currentStyle });
              currentSegment = "";
            }
            currentSegment = char;
            currentStyle = colors.string;
          } else if (char === stringChar && inString) {
            inString = false;
            currentSegment += char;
            segments.push({ text: currentSegment, style: colors.string });
            currentSegment = "";
            currentStyle = {};
            stringChar = '';
          } else if (inString) {
            currentSegment += char;
          } else {
            // Check for keywords (only when not in strings)
            const remainingText = line.slice(i);
            const keywordMatch = remainingText.match(/\b(function|const|let|var|if|for|while|return|class|import|export|default|new|try|catch|finally|throw|break|case|switch|continue|do|else|enum|struct|interface|type|async|await|yield|public|private|protected|static|final|abstract|extends|implements|super)\b/);

            if (keywordMatch && keywordMatch.index === 0) {
              if (currentSegment) {
                segments.push({ text: currentSegment, style: currentStyle });
                currentSegment = "";
              }
              segments.push({ text: keywordMatch[0], style: colors.keyword });
              i += keywordMatch[0].length - 1;
              currentStyle = {};
            } else {
              currentSegment += char;
              currentStyle = {};
            }
          }
        }

        if (currentSegment) {
          segments.push({ text: currentSegment, style: currentStyle });
        }

        return { text: line, segments: segments.length > 0 ? segments : [{ text: line, style: {} }] };
      })
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* User icon */}
      {message.role === "assistant" && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Code className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className={`flex flex-col ${isUser ? "max-w-[80%]" : "w-full"}`}>
        {/* Header with actions */}
        <div className={`flex items-center gap-2 mb-2 ${isUser ? "justify-end" : "justify-start"}`}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {message.language ? languages.find(l => l.id === message.language)?.icon : "📄"}
            </span>
            <span className="ml-1">
              {message.language ? languages.find(l => l.id === message.language)?.name || "Code" : "Code"}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString()}
          </div>

          {/* Action buttons for assistant messages */}
          {!isUser && (
            <div className="flex items-center gap-1">
              {onCopy && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 transition-opacity hover:opacity-80"
                  onClick={handleCopy}
                  title="Copy code"
                >
                  {copied ? <Copy className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
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
                  title="Delete code"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Code content with syntax highlighting */}
        <div
          className={`rounded-xl border p-4 shadow-sm font-mono text-sm leading-relaxed overflow-x-auto ${
            isUser
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border"
          }`}
          style={{
            backgroundColor: isUser ? "" : (language && languageColors[language]?.background) || "",
          }}
        >
          <pre className={`${showLineNumbers ? "line-numbers" : ""}`}>
            {formatCode(message.content, message.language).lines.map((line, index) => (
              <div key={index} className="flex">
                {showLineNumbers && (
                  <span className="w-8 text-right text-muted-foreground select-none mr-2" style={{ userSelect: 'none' }}>
                    {String(index + 1).padStart(3, ' ')}
                  </span>
                )}
                <code>
                  {line.segments.map((segment, segIndex) => (
                    <span key={segIndex} style={segment.style}>
                      {segment.text}
                    </span>
                  ))}
                </code>
              </div>
            ))}
          </pre>
        </div>
      </div>
    </motion.div>
  );
}