"use client";

import { useRef, useCallback, memo, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ArrowUpIcon,
  StopIcon,
  CpuIcon,
  ChevronDownIcon,
} from "../image-creation/icons";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputSubmit,
} from "../image-creation/elements/prompt-input";
import { Context } from "../image-creation/elements/context";
import { CodeModelSelectorModal } from "./model-selector-modal";
import type { CodeModel } from "@/lib/api";

interface CodeMultimodalInputProps {
  input: string;
  setInput: (value: string) => void;
  status: "ready" | "submitted" | "streaming" | "error";
  sendMessage: () => void;
  onClearChat?: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  models: CodeModel[];
  className?: string;
}

function PureCodeMultimodalInput({
  input,
  setInput,
  status,
  sendMessage,
  selectedModel,
  className,
  onModelChange,
  models,
}: CodeMultimodalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const contextProps = useMemo(
    () => ({}),
    []
  );

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

  const submitForm = useCallback(() => {
    if (!input.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    sendMessage();
  }, [input, sendMessage]);

  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      <PromptInput
        className="rounded-xl border border-border bg-background p-3 shadow-xs transition-all duration-200 focus-within:border-border hover:border-muted-foreground/50 w-full"
        onSubmit={(event) => {
          event.preventDefault();
          if (status !== "ready") {
            toast.error("Please wait for the model to finish its response!");
          } else {
            submitForm();
          }
        }}
      >
        <div className="flex flex-row items-start gap-1 sm:gap-2">
          <PromptInputTextarea
            autoFocus
            className="grow resize-none border-0! border-none! bg-transparent p-2 text-sm outline-none ring-0 [-ms-overflow-style:none] [scrollbar-width:none] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden"
            data-testid="multimodal-input"
            disableAutoResize={true}
            maxHeight={60}
            minHeight={44}
            onChange={handleInput}
            placeholder="Describe the code you want to generate..."
            ref={textareaRef}
            rows={1}
            value={input}
          />{" "}
          <Context {...contextProps} />
        </div>
        <PromptInputToolbar className="!border-top-0 border-t-0! p-0 shadow-none dark:border-0 dark:border-transparent!">
          <PromptInputTools className="gap-0 sm:gap-0.5">
            <CodeModelSelectorModal
              selectedModel={selectedModel ?? ""}
              onSelectionChange={(model) => onModelChange?.(model)}
              models={models}
              title="Select Code Generation Model"
              trigger={
                <Button
                  variant="ghost"
                  className="flex h-8 items-center gap-2 rounded-lg border-0 bg-background px-2 text-foreground shadow-none transition-colors hover:bg-accent focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  type="button"
                >
                  <CpuIcon size={16} />
                  <span className="hidden font-medium text-xs sm:block">
                    {models.find(m => m.id === selectedModel)?.display_name || "Select model"}
                  </span>
                  <ChevronDownIcon size={16} />
                </Button>
              }
            />
          </PromptInputTools>

          <div className="flex items-center gap-2">
            {status === "submitted" || status === "streaming" ? (
              <StopButton stop={() => {}} />
            ) : (
              <PromptInputSubmit
                className="size-8 rounded-full bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                disabled={!input.trim()}
                status={status}
              >
                <ArrowUpIcon size={14} />
              </PromptInputSubmit>
            )}
          </div>
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}

function PureStopButton({
  stop,
}: {
  stop: () => void;
}) {
  return (
    <Button
      className="size-7 rounded-full bg-foreground p-1 text-background transition-colors duration-200 hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground"
      data-testid="stop-button"
      onClick={(event) => {
        event.preventDefault();
        stop();
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

export const CodeMultimodalInput = memo(PureCodeMultimodalInput);
