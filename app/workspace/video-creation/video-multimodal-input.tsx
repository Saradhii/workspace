"use client";

import { useState, useRef, useCallback, memo, useMemo } from "react";
import { toast } from "sonner";
import type { Attachment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ArrowUpIcon,
  PaperclipIcon,
  StopIcon,
} from "../image-creation/icons";
import { PreviewAttachment } from "../image-creation/preview-attachment";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputSubmit,
} from "../image-creation/elements/prompt-input";
import { Context } from "../image-creation/elements/context";
import { VideoSettingsPopover } from "./video-settings-popover";
import { SuggestedActions } from "./suggested-actions";
import { ModelSelectorModal } from "../image-creation/model-selector-modal";
import { WanLogo } from "@/components/ai-logos";
import type { ImageModel } from "@/types/models";
import type { ChatMessage } from "@/lib/types";
import type { VideoParams } from "@/types/components";

// Video generation model
const videoModels: ImageModel[] = [
  {
    id: "wan-2-2-i2v-14b-fast",
    name: "wan-2-2-i2v-14b-fast",
    displayName: "WAN 2.2",
    description: "Fast image-to-video generation",
    provider: "Internal",
    color: "text-blue-500",
    icon: WanLogo,
  },
];

interface VideoMultimodalInputProps {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  status: "ready" | "submitted" | "streaming" | "error";
  stop: () => void;
  attachments: Attachment[];
  setAttachments: (attachments: Attachment[]) => void;
  sendMessage: () => void;
  selectedVisibilityType: string;
  selectedModelId: string;
  className?: string;
  onModelChange?: (modelId: string) => void;
  onSuggestionClick: (suggestion: string) => void;
  videoParams: VideoParams;
  setVideoParams: (params: Partial<VideoParams> | ((prev: VideoParams) => VideoParams)) => void;
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
}

function PureVideoMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  sendMessage,
  selectedModelId,
  className,
  onModelChange,
  onSuggestionClick,
  videoParams,
  setVideoParams,
  messages,
  setMessages,
}: VideoMultimodalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);

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
      toast.error("Please enter a prompt describing the desired motion");
      return;
    }
    if (attachments.length === 0) {
      toast.error("Please upload an image to animate");
      return;
    }
    sendMessage();
  }, [input, attachments, sendMessage]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      // Only accept image files
      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      if (imageFiles.length === 0) {
        toast.error("Please upload an image file");
        return;
      }

      // Only allow one image for video generation
      if (imageFiles.length > 1) {
        toast.error("Please upload only one image for video generation");
        return;
      }

      const file = imageFiles[0];
      if (!file) return;

      setUploadQueue([file.name]);

      try {
        const reader = new FileReader();

        reader.onload = (e) => {
          const url = e.target?.result as string;
          if (!url) return;
          const newAttachment: Attachment = {
            id: Math.random().toString(36).substr(2, 9),
            url,
            name: file.name || 'unknown',
            type: file.type || "application/octet-stream",
            size: file.size || 0,
            contentType: file.type,
          };

          // Replace existing attachment (only one image allowed for video)
          setAttachments([newAttachment]);
          toast.success("Image uploaded successfully");
        };

        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error uploading file!", error);
        toast.error("Failed to upload image");
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments]
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [attachments, setAttachments]);

  const duration = videoParams.frames / videoParams.fps;

  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      {/*messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (*/}
          <SuggestedActions
            onSuggestionClick={onSuggestionClick}
          />
        {/*)}*/}

      <input
        className="-top-4 -left-4 pointer-events-none fixed size-0.5 opacity-0"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />

      <PromptInput
        className="rounded-xl border border-border bg-background p-3 shadow-xs transition-all duration-200 focus-within:border-border hover:border-muted-foreground/50"
        onSubmit={(event) => {
          event.preventDefault();
          if (status !== "ready") {
            toast.error("Please wait for the model to finish its response!");
          } else {
            submitForm();
          }
        }}
      >
        {(attachments.length > 0 || uploadQueue.length > 0) && (
          <div
            className="flex flex-row items-end gap-2 overflow-x-scroll"
            data-testid="attachments-preview"
          >
            {attachments.map((attachment) => (
              <PreviewAttachment
                attachment={attachment}
                key={attachment.url}
                onRemove={() => removeAttachment(attachment.id)}
              />
            ))}

            {uploadQueue.map((filename) => (
              <PreviewAttachment
                attachment={{
                  id: `upload-${filename}`,
                  url: "",
                  name: filename,
                  type: "application/octet-stream",
                  size: 0,
                  contentType: "",
                }}
                isUploading={true}
                key={filename}
              />
            ))}
          </div>
        )}
        <div className="flex flex-row items-start gap-1 sm:gap-2">
          <PromptInputTextarea
            autoFocus
            className="grow resize-none border-0! border-none! bg-transparent p-2 text-sm outline-none ring-0 [-ms-overflow-style:none] [scrollbar-width:none] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden"
            data-testid="multimodal-input"
            disableAutoResize={true}
            maxHeight={200}
            minHeight={44}
            onChange={handleInput}
            placeholder="Describe the motion you want to create..."
            ref={textareaRef}
            rows={1}
            value={input}
          />{" "}
          <Context {...contextProps} />
        </div>
        <PromptInputToolbar className="!border-top-0 border-t-0! p-0 shadow-none dark:border-0 dark:border-transparent!">
          <PromptInputTools className="gap-0 sm:gap-0.5">
            <AttachmentsButton
              fileInputRef={fileInputRef}
              status={status}
            />
            <ModelSelectorModal
              selectedModels={[selectedModelId ?? ""]}
              onSelectionChange={(models) => onModelChange?.(models[0] ?? "")}
              models={videoModels}
              title="Select Video Generation Model"
            />
            <VideoSettingsPopover
              videoParams={videoParams}
              setVideoParams={setVideoParams}
            />
          </PromptInputTools>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {duration.toFixed(1)}s
            </span>

            {status === "submitted" || status === "streaming" ? (
              <StopButton stop={stop} />
            ) : (
              <PromptInputSubmit
                className="size-8 rounded-full bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                disabled={!input.trim() || attachments.length === 0 || uploadQueue.length > 0}
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

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: "ready" | "submitted" | "streaming" | "error";
}) {
  return (
    <Button
      className="aspect-square h-8 rounded-lg p-1 transition-colors hover:bg-accent"
      data-testid="attachments-button"
      disabled={status !== "ready"}
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      variant="ghost"
    >
      <PaperclipIcon size={14} style={{ width: 14, height: 14 }} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

const StopButton = memo(PureStopButton);

export const VideoMultimodalInput = memo(PureVideoMultimodalInput);