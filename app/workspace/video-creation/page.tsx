"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { VideoMultimodalInput } from "./video-multimodal-input";
import { VideoLoadingCard } from "./video-loading-card";
import { VideoResultCard } from "./video-result-card";
import type { Attachment } from "@/lib/types";
import { generateVideo, getUserSession, type VideoGenerationRequest } from "@/lib/api";
import type { VideoGenerationResponse } from "@/types/api";
import type { ChatMessage } from "@/lib/types";
import type { VideoParams } from "@/types/components";
import { Button } from "@/components/ui/button";
import { Download, Video as VideoIcon } from "lucide-react";

export default function VideoCreation() {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming" | "error">("ready");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<VideoGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const chatId = "video-creation-chat";
  const selectedModelId = "gpt-4";

  // Video parameters with defaults
  const [videoParams, setVideoParams] = useState({
    frames: 21,
    fps: 16,
    resolution: "480p" as "480p" | "720p",
    fast: true,
    guidanceScale: 1.0,
    seed: 42,
  });

  // Wrapper to handle partial updates
  const updateVideoParams = (update: Partial<VideoParams> | ((prev: VideoParams) => VideoParams)) => {
    if (typeof update === 'function') {
      setVideoParams(update);
    } else {
      setVideoParams(prev => ({ ...prev, ...update }));
    }
  };

  // Get user session on mount
  useEffect(() => {
    const loadUserSession = async () => {
      try {
        const session = await getUserSession();
        setUserId(session.user_id);
      } catch (error) {
        console.error("Failed to load user session:", error);
      }
    };
    loadUserSession();
  }, []);

  // Handle video generation
  const handleSubmit = async () => {
    if (!input.trim() || !userId || attachments.length === 0) {
      if (attachments.length === 0) {
        toast.error("Please upload an image to animate");
      }
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedVideo(null);
    setStatus("submitted");

    try {
      // Get base64 image from attachment
      const imageBase64 = attachments[0]?.url?.split(',')[1]; // Remove data:image/...;base64, prefix

      const params: VideoGenerationRequest = {
        ...(imageBase64 && { image: imageBase64 }), // Send raw base64, not with data URI prefix
        prompt: input,
        frames: videoParams.frames,
        fps: videoParams.fps,
        resolution: videoParams.resolution,
        fast: videoParams.fast,
        guidance_scale: videoParams.guidanceScale,
        guidance_scale_2: 1.0,
        seed: videoParams.seed,
        user_id: userId || '',
      };

      toast.info("Starting video generation... This may take a few minutes");

      const result = await generateVideo(params);

      if (result.success) {
        setGeneratedVideo(result);
        toast.success("Video generated successfully!");
      } else {
        throw new Error(result.error || "Failed to generate video");
      }
    } catch (error) {
      console.error("Error generating video:", error);
      const rawErrorMessage = error instanceof Error ? error.message : "Failed to generate video";

      // Provide user-friendly messages for common errors
      let userMessage = rawErrorMessage;

      if (rawErrorMessage.includes("quota exceeded") || rawErrorMessage.includes("account balance")) {
        userMessage = "Service quota exceeded. Please check your account balance or try again later.";
      } else if (rawErrorMessage.includes("rate limit") || rawErrorMessage.includes("too many requests")) {
        userMessage = "Rate limit exceeded. Please wait a moment and try again.";
      } else if (rawErrorMessage.includes("invalid") && rawErrorMessage.includes("image")) {
        userMessage = "Invalid image format. Please upload a valid image file (JPEG, PNG, etc.).";
      } else if (rawErrorMessage.includes("timeout")) {
        userMessage = "Request timed out. Please try again with a smaller image or fewer frames.";
      } else if (rawErrorMessage.includes("network") || rawErrorMessage.includes("connection")) {
        userMessage = "Network error. Please check your connection and try again.";
      }

      setError(userMessage);
      toast.error(userMessage);
      setStatus("error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion: string) => {
    setInput(suggestion);
    // Auto-submit after a short delay
    setTimeout(() => {
      if (userId && attachments.length > 0) {
        handleSubmit();
      } else if (attachments.length === 0) {
        toast.error("Please upload an image first");
      }
    }, 500);
  };

  
  // Download video
  const downloadVideo = () => {
    if (!generatedVideo?.video_base64 && !generatedVideo?.video_url) return;

    const link = document.createElement("a");
    if (generatedVideo.video_base64) {
      link.href = `data:video/${generatedVideo.format};base64,${generatedVideo.video_base64}`;
    } else if (generatedVideo.video_url) {
      link.href = generatedVideo.video_url;
    }
    link.download = `video-${Date.now()}.${generatedVideo.format || 'mp4'}`;
    link.click();
  };

  return (
    <div className="flex h-full flex-col">
        {/* Content Area - Generated Video Display */}
        <div className="flex-1 flex items-center justify-center p-8">
            {isGenerating && (
              <div className="flex flex-col items-center gap-4">
                <VideoLoadingCard />
                <div className="text-center max-w-md">
                  <p className="text-sm text-muted-foreground">
                    Generating {videoParams.frames} frames at {videoParams.fps} FPS...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This typically takes 1-5 minutes. Please be patient.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                  <VideoIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Generation Failed
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {error}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    setStatus("ready");
                  }}
                >
                  Try Again
                </Button>
              </div>
            )}

            {generatedVideo && !isGenerating && (
              <div className="flex flex-col items-center gap-6 w-full">
                <VideoResultCard
                  videoId={generatedVideo.video_id}
                  userId={userId!}
                  {...(generatedVideo.video_url && { videoUrl: generatedVideo.video_url })}
                  {...(generatedVideo.video_base64 && { videoBase64: generatedVideo.video_base64 })}
                  duration={generatedVideo.duration}
                  frames={generatedVideo.frames}
                  fps={generatedVideo.fps}
                  {...(generatedVideo.file_size && { fileSize: generatedVideo.file_size })}
                  format={generatedVideo.format}
                  width={generatedVideo.width}
                  height={generatedVideo.height}
                  generationTime={generatedVideo.generation_time_ms}
                  prompt={input}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={downloadVideo}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Video
                  </Button>
                  <Button
                    onClick={() => {
                      setGeneratedVideo(null);
                      setError(null);
                      setStatus("ready");
                      setInput("");
                      setAttachments([]);
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    Generate Another
                  </Button>
                </div>
              </div>
            )}

            {!isGenerating && !error && !generatedVideo && (
              <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <div className="rounded-full bg-primary/10 p-8">
                  <VideoIcon className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Create Your First Video
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Upload an image and describe the motion you want to create
                  </p>
                </div>
                <div className="text-left bg-muted/50 rounded-lg p-4 mt-4">
                  <h4 className="font-medium mb-2">Quick Tips:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Upload a clear, high-quality image</li>
                    <li>• Describe simple, subtle motions</li>
                    <li>• Use fewer frames for faster generation</li>
                    <li>• Enable Fast Mode for quicker results</li>
                  </ul>
                </div>
              </div>
            )}
        </div>
        <div className="max-w-3xl mx-auto p-4">
          <VideoMultimodalInput
            chatId={chatId}
            input={input}
            setInput={setInput}
            status={isGenerating ? "submitted" : status}
            stop={() => {
              setIsGenerating(false);
              setStatus("ready");
            }}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={isGenerating || generatedVideo ? [] : messages}
            setMessages={setMessages}
            sendMessage={async () => {
              await handleSubmit();
            }}
            selectedVisibilityType="private"
            selectedModelId={selectedModelId}
            onSuggestionClick={handleSuggestionClick}
            videoParams={videoParams}
            setVideoParams={updateVideoParams}
          />
        </div>
      </div>
  );
}