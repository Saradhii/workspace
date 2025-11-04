"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MultimodalInput } from "./image-multimodal-input";
import { ImageLoadingCard } from "./image-loading-card";
import { ImageResultCard } from "./image-result-card";
import type { Attachment } from "@/lib/types";
import { generateDualImage, generateImage, getUserSession } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon } from "lucide-react";

export default function ImageCreation() {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming" | "error">("ready");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chromaImage, setChromaImage] = useState<any>(null);
  const [netaImage, setNetaImage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>(["chroma"]);
  const chatId = "image-creation-chat";

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

  const handleSubmit = async () => {
    if (!input.trim() || !userId || selectedModels.length === 0) return;

    setIsGenerating(true);
    setError(null);
    setChromaImage(null);
    setNetaImage(null);
    setStatus("submitted");

    try {
      const params = {
        prompt: input,
        width: 600,
        height: 400,
        steps: 30,
        cfg: 4.5,
        user_id: userId,
      };

      let errorMessage = null;

      if (selectedModels.length === 2) {
        // Generate both images using dual endpoint
        const result = await generateDualImage(params);

        if (result.success) {
          if (result.chroma) setChromaImage(result.chroma);
          if (result.neta_lumina) setNetaImage(result.neta_lumina);

          if (result.chroma && result.neta_lumina) {
            toast.success("Both images generated successfully!");
          } else if (result.chroma || result.neta_lumina) {
            toast.warning("One image generated successfully, one failed");
          } else {
            errorMessage = "Both image generations failed";
          }

          if (result.errors) {
            console.error("Generation errors:", result.errors);
            // Show specific error if both failed
            if (!result.chroma && !result.neta_lumina && result.errors) {
              const firstError = Object.values(result.errors)[0];
              errorMessage = firstError || "Both image generations failed";
            }
          }
        } else {
          errorMessage = "Failed to generate images";
        }
      } else {
        // Generate single image
        const modelName = selectedModels[0];
        const result = await generateImage({
          ...params,
          model: modelName as 'chroma' | 'neta-lumina' | 'flux' | undefined,
        });

        if (result.success && result.image_url || result.image_base64) {
          if (modelName === 'chroma') {
            setChromaImage(result.image_url || result.image_base64);
          } else {
            setNetaImage(result.image_url || result.image_base64);
          }
          toast.success(`${modelName === 'chroma' ? 'Chroma' : 'FLUX.1 Dev'} image generated successfully!`);
        } else {
          // Use the error from the API response if available
          errorMessage = result.error || `Failed to generate ${modelName} image`;
        }
      }

      // If there's an error, display it
      if (errorMessage) {
        setError(errorMessage);
        toast.error(errorMessage);
        setStatus("error");
      }
    } catch (error) {
      console.error("Error generating images:", error);
      const caughtErrorMessage = error instanceof Error ? error.message : "Failed to generate images";
      setError(caughtErrorMessage);
      toast.error(caughtErrorMessage);
      setStatus("error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInput(suggestion);
    // Use a small timeout to ensure the input is updated before submitting
    setTimeout(async () => {
      if (!userId || selectedModels.length === 0) return;

      setIsGenerating(true);
      setError(null);
      setChromaImage(null);
      setNetaImage(null);
      setStatus("submitted");

      try {
        const params = {
          prompt: suggestion,
          width: 600,
          height: 400,
          steps: 30,
          cfg: 4.5,
          user_id: userId,
        };

        let errorMessage = null;

        if (selectedModels.length === 2) {
          // Generate both images using dual endpoint
          const result = await generateDualImage(params);

          if (result.success) {
            if (result.chroma) setChromaImage(result.chroma);
            if (result.neta_lumina) setNetaImage(result.neta_lumina);

            if (result.chroma && result.neta_lumina) {
              toast.success("Both images generated successfully!");
            } else if (result.chroma || result.neta_lumina) {
              toast.warning("One image generated successfully, one failed");
            } else {
              errorMessage = "Both image generations failed";
            }

            if (result.errors) {
              console.error("Generation errors:", result.errors);
              // Show specific error if both failed
              if (!result.chroma && !result.neta_lumina && result.errors) {
                const firstError = Object.values(result.errors)[0];
                errorMessage = firstError || "Both image generations failed";
              }
            }
          } else {
            errorMessage = "Failed to generate images";
          }
        } else {
          // Generate single image
          const modelName = selectedModels[0];
          const result = await generateImage({
            ...params,
            model: modelName as 'chroma' | 'neta-lumina' | 'flux' | undefined,
          });

          if (result.success && result.image_url || result.image_base64) {
            if (modelName === 'chroma') {
              setChromaImage(result.image_url || result.image_base64);
            } else {
              setNetaImage(result.image_url || result.image_base64);
            }
            toast.success(`${modelName === 'chroma' ? 'Chroma' : 'FLUX.1 Dev'} image generated successfully!`);
          } else {
            // Use the error from the API response if available
            errorMessage = result.error || `Failed to generate ${modelName} image`;
          }
        }

        // If there's an error, display it
        if (errorMessage) {
          setError(errorMessage);
          toast.error(errorMessage);
          setStatus("error");
        }
      } catch (error) {
        console.error("Error generating images:", error);
        const caughtErrorMessage = error instanceof Error ? error.message : "Failed to generate images";
        setError(caughtErrorMessage);
        toast.error(caughtErrorMessage);
        setStatus("error");
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  const downloadChromaImage = () => {
    if (!chromaImage?.image_base64) return;

    const link = document.createElement("a");
    link.href = `data:image/${chromaImage.format};base64,${chromaImage.image_base64}`;
    link.download = `chroma-${Date.now()}.${chromaImage.format || 'png'}`;
    link.click();
  };

  const downloadNetaImage = () => {
    if (!netaImage?.image_base64) return;

    const link = document.createElement("a");
    link.href = `data:image/${netaImage.format};base64,${netaImage.image_base64}`;
    link.download = `neta-lumina-${Date.now()}.${netaImage.format || 'png'}`;
    link.click();
  };

  return (
    <div className="flex h-full flex-col">
        {/* Content Area - Generated Images Display */}
        <div className="flex-1 flex items-center justify-center p-8">
            {isGenerating && (
              <div className={selectedModels.length === 1 ? "flex justify-center" : "flex gap-8 items-center justify-center"}>
                {selectedModels.includes("chroma") && (
                  <div className="flex flex-col gap-2 items-center">
                    <ImageLoadingCard colorTheme="chroma" />
                    <p className="text-sm text-muted-foreground mt-2">Chroma</p>
                  </div>
                )}
                {selectedModels.includes("FLUX.1 [dev]") && (
                  <div className="flex flex-col gap-2 items-center">
                    <ImageLoadingCard colorTheme="flux" />
                    <p className="text-sm text-muted-foreground mt-2">FLUX.1 Dev</p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                  <ImageIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
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

            {(chromaImage || netaImage) && !isGenerating && (
              <div className="flex flex-col items-center gap-6 w-full">
                <div className={selectedModels.length === 1 ? "flex justify-center" : "flex gap-8 items-start justify-center"}>
                  {chromaImage && (
                    <ImageResultCard
                      imageBase64={chromaImage.image_base64}
                      format={chromaImage.format}
                      width={chromaImage.width}
                      height={chromaImage.height}
                      modelName="chroma"
                      modelDisplayName="Chroma"
                      generationTime={chromaImage.generation_time_ms}
                      onDownload={downloadChromaImage}
                    />
                  )}
                  {netaImage && (
                    <ImageResultCard
                      imageBase64={netaImage.image_base64}
                      format={netaImage.format}
                      width={netaImage.width}
                      height={netaImage.height}
                      modelName="neta-lumina"
                      modelDisplayName="Neta-Lumina"
                      generationTime={netaImage.generation_time_ms}
                      onDownload={downloadNetaImage}
                    />
                  )}
                </div>
                <Button
                  onClick={() => {
                    setChromaImage(null);
                    setNetaImage(null);
                    setError(null);
                    setStatus("ready");
                    setInput("");
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  Generate Another
                </Button>
              </div>
            )}

            {!isGenerating && !error && !chromaImage && !netaImage && (
              <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <div className="rounded-full bg-primary/10 p-8">
                  <ImageIcon className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Create Your First Images
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Enter a prompt below to generate images with both Chroma and FLUX.1 Dev models
                  </p>
                </div>
              </div>
            )}
        </div>
        <div className="max-w-3xl mx-auto p-4">
          <MultimodalInput
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
            messages={isGenerating || chromaImage || netaImage ? [] : messages}
            setMessages={setMessages}
            sendMessage={async () => {
              await handleSubmit();
            }}
            selectedVisibilityType="private"
            selectedModels={selectedModels}
            onSelectedModelsChange={setSelectedModels}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>
    </div>
  );
}