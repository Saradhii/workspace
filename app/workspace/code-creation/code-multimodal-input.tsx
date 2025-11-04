"use client";

import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputSubmit,
} from "../image-creation/elements/prompt-input";
import { Context } from "../image-creation/elements/context";
import { Select, SelectContent, SelectTrigger, SelectItem } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { List } from "lucide-react";
import { CodeModelSelectorModal } from "./model-selector-modal";
import type { CodeModel } from "@/types/models";

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

interface CodeMultimodalInputProps {
  input: string;
  setInput: (value: string) => void;
  status: "ready" | "submitted" | "streaming" | "error";
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  showLineNumbers: boolean;
  onToggleLineNumbers: (value: boolean) => void;
  sendMessage: () => void;
  onClearChat?: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  models: CodeModel[];
  onSuggestionClick: (suggestion: string) => void;
}

export function CodeMultimodalInput({
  input,
  setInput,
  status,
  selectedLanguage,
  onLanguageChange,
  showLineNumbers,
  onToggleLineNumbers,
  sendMessage,
  onClearChat,
  selectedModel,
  onModelChange,
  models: availableModels,
  onSuggestionClick,
}: CodeMultimodalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(scrollHeight, 44)}px`;
    }
  }, []);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  
  return (
    <PromptInput
      className="rounded-xl border border-border bg-background p-3 shadow-xs transition-all duration-200 focus-within:border-border"
      style={{ height: "120px" }}
      onSubmit={(event) => {
        event.preventDefault();
        if (status !== "ready") {
          return;
        }
        sendMessage();
      }}
    >
      <div className="flex flex-col space-y-4">
        {/* Top toolbar with language and model selection */}
        <PromptInputToolbar className="!border-top-0 border-b-0">
          <PromptInputTools>
            {/* Model selector */}
            <CodeModelSelectorModal
              selectedModel={selectedModel}
              onSelectionChange={onModelChange}
              models={availableModels}
            />

            {/* Language selector */}
            <Select value={selectedLanguage} onValueChange={onLanguageChange}>
              <SelectTrigger className="w-32">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{languages.find(l => l.id === selectedLanguage)?.icon}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    {languages.find(l => l.id === selectedLanguage)?.name || "Language"}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {languages.map((language) => (
                  <SelectItem key={language.id} value={language.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{language.icon}</span>
                      <span>{language.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Line numbers toggle */}
            <ToggleGroup type="single" value={showLineNumbers ? 'true' : 'false'} onValueChange={(value) => onToggleLineNumbers(value === 'true')}>
              <ToggleGroupItem value="true">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  <span className="text-sm">Line Numbers</span>
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem value="false">
                <span className="text-sm">No Line Numbers</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </PromptInputTools>
        </PromptInputToolbar>

        {/* Text area */}
        <div className="flex flex-col gap-2">
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Describe the code you want to generate..."
            disabled={status === "streaming"}
            className="min-h-[120px] resize-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:ring-inset focus:ring-border"
            style={{
              fontFamily: '"Monaco", "Menlo", "DejaVu Sans Mono", monospace',
              fontSize: showLineNumbers ? "13px" : "14px",
              lineHeight: showLineNumbers ? "1.5" : "1.4",
            } as React.CSSProperties}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Bottom toolbar */}
      <PromptInputToolbar className="!border-t-0 border-t-0">
        <PromptInputTools>
          <div className="flex items-center gap-2 ml-auto">
            {/* Character count */}
            <span className="text-xs text-muted-foreground">
              {input.length} characters
            </span>
          </div>
          {status === "submitted" || status === "streaming" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearChat}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          ) : (
            <PromptInputSubmit
              className="size-8 rounded-full bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
              disabled={!input.trim() || status !== "ready"}
            >
              <Context className="size-5" />
            </PromptInputSubmit>
          )}
        </PromptInputTools>
      </PromptInputToolbar>
    </PromptInput>
  );
}