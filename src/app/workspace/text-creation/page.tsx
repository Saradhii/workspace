"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { TextMultimodalInput } from "./text-multimodal-input";
import { TextLoadingCard } from "./text-loading-card";
import { TextResultCard } from "./text-result-card";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { getUserSession, generateTextStream, getTextModels } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { FileText, MessageCircle, Download } from "lucide-react";

interface TextMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  reasoning?: string; // For models like Tongyi that show thinking process
}

export default function TextCreation() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<TextMessage[]>([]);
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming" | "error">("ready");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState("meta-llama/llama-3.2-3b-instruct:free");
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const chatId = "text-creation-chat";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user session and models on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user session
        const session = await getUserSession();
        setUserId(session.user_id);
      } catch (error) {
        console.error("Failed to load user session:", error);
      }

      try {
        // Load available models
        const modelsResponse = await getTextModels();
        if (modelsResponse.success && modelsResponse.models) {
          // Convert models to the format expected by ModelSelectorModal
          const formattedModels = modelsResponse.models.map((model) => ({
            id: model.id,
            name: model.name,
            displayName: model.display_name,
            description: model.description,
            color: "text-blue-500", // Default color
          }));
          setAvailableModels(formattedModels);
        }
      } catch (error) {
        console.error("Failed to load models:", error);
        // Set default models if API fails
        setAvailableModels([{
          id: "meta-llama/llama-3.2-3b-instruct:free",
          name: "llama-3.2-3b-instruct",
          displayName: "Llama 3.2 3B",
          description: "Fast and efficient small model",
          color: "text-blue-500",
        }]);
      }
    };

    loadData();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle text generation with streaming
  const handleSubmit = async () => {
    if (!input.trim() || !userId) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedText(null);
    setStatus("submitted");

    // Add user message
    const userMessage: TextMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Add assistant message placeholder
    const assistantMessage: TextMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, assistantMessage]);
    setStatus("streaming");

    try {
      let accumulatedContent = "";
      let accumulatedReasoning = "";
      const stream = generateTextStream({
        messages: [
          { role: "user", content: input }
        ],
        model: selectedModelId,
        temperature: 0.7,
        max_tokens: 1000,
        ...(userId && { user_id: userId })
      });

      for await (const event of stream) {
        if (event.type === "content") {
          accumulatedContent += event.content;
          console.log(`[STREAM] Content chunk: "${event.content}" | Total: "${accumulatedContent}"`);

          // Update message content without flushSync - React will batch updates
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, content: accumulatedContent, isTyping: true }
                : msg
            )
          );
        } else if (event.type === "reasoning") {
          accumulatedReasoning += event.content;
          console.log(`[STREAM] Reasoning chunk: "${event.content}" | Reasoning Total: "${accumulatedReasoning}"`);

          // Update reasoning without flushSync
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, ...(accumulatedReasoning && { reasoning: accumulatedReasoning }), isTyping: true }
                : msg
            )
          );
        } else if (event.type === "done") {
          console.log("[STREAM] Stream completed");
          // Final response - set all final state
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? {
                    ...msg,
                    content: accumulatedContent,
                    ...(event.reasoning && { reasoning: event.reasoning }),
                    isTyping: false
                  }
                : msg
            )
          );
          setGeneratedText(accumulatedContent);
          break;
        } else if (event.type === "error") {
          throw new Error(event.error);
        }
      }

      // Scroll to bottom when streaming is complete
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Error generating text:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate text";

      // Update assistant message with error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content: `Sorry, I encountered an error: ${errorMessage}`, isTyping: false }
            : msg
        )
      );

      setError(errorMessage);
      toast.error(errorMessage);
      setStatus("error");
    } finally {
      setIsGenerating(false);
      setStatus("ready");
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion: string) => {
    if (!userId) return;

    setInput(suggestion);
    setIsGenerating(true);
    setError(null);
    setGeneratedText(null);
    setStatus("submitted");

    // Add user message
    const userMessage: TextMessage = {
      id: Date.now().toString(),
      role: "user",
      content: suggestion,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Add assistant message placeholder
    const assistantMessage: TextMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, assistantMessage]);
    setStatus("streaming");

    try {
      let accumulatedContent = "";
      let accumulatedReasoning = "";
      const stream = generateTextStream({
        messages: [
          { role: "user", content: suggestion }
        ],
        model: selectedModelId,
        temperature: 0.7,
        max_tokens: 1000,
        ...(userId && { user_id: userId })
      });

      for await (const event of stream) {
        if (event.type === "content") {
          accumulatedContent += event.content;
          console.log(`[STREAM] Suggestion - Content chunk: "${event.content}" | Total: "${accumulatedContent}"`);

          // Update content without flushSync
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, content: accumulatedContent, isTyping: true }
                : msg
            )
          );
        } else if (event.type === "reasoning") {
          accumulatedReasoning += event.content;
          console.log(`[STREAM] Suggestion - Reasoning chunk: "${event.content}" | Reasoning Total: "${accumulatedReasoning}"`);

          // Update reasoning without flushSync
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, ...(accumulatedReasoning && { reasoning: accumulatedReasoning }), isTyping: true }
                : msg
            )
          );
        } else if (event.type === "done") {
          console.log("[STREAM] Suggestion stream completed");
          // Final response - set all final state
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? {
                    ...msg,
                    content: accumulatedContent,
                    ...(event.reasoning && { reasoning: event.reasoning }),
                    isTyping: false
                  }
                : msg
            )
          );
          setGeneratedText(accumulatedContent);
          break;
        } else if (event.type === "error") {
          throw new Error(event.error);
        }
      }

      // Scroll to bottom when streaming is complete
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Error generating text from suggestion:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate text";

      // Update assistant message with error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content: `Sorry, I encountered an error: ${errorMessage}`, isTyping: false }
            : msg
        )
      );

      setError(errorMessage);
      toast.error(errorMessage);
      setStatus("error");
    } finally {
      setIsGenerating(false);
      setStatus("ready");
    }
  };

  // Stop generation
  const stop = () => {
    setIsGenerating(false);
    setStatus("ready");
    // Remove typing indicator
    setMessages(prev => prev.filter(m => !m.isTyping));
  };

  // Clear chat
  const handleClearChat = () => {
    setMessages([]);
    setGeneratedText(null);
    setError(null);
    setInput("");
    setStatus("ready");
  };

  // Download text
  const downloadText = () => {
    if (!generatedText) return;

    const blob = new Blob([generatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated-text-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
        {/* Content Area with TracingBeam */}
        <div className="flex-1 relative overflow-hidden">
          <TracingBeam className="h-full overflow-y-auto px-6">
            <div className="max-w-4xl mx-auto antialiased py-8">
              {messages.length > 0 ? (
                // Messages state - show scrollable conversation
                <div className="space-y-10">
                  {messages.map((message, _index) => (
                    <div key={message.id}>
                      <TextResultCard
                        message={message}
                      />
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : isGenerating ? (
                // Loading state
                <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
                  <TextLoadingCard />
                </div>
              ) : error ? (
                // Error state
                <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
                  <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                      <FileText className="h-8 w-8 text-red-600 dark:text-red-400" />
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
                </div>
              ) : generatedText ? (
                // Generated text state - show result with download
                <div className="flex flex-col items-center gap-6">
                  <TextResultCard
                    message={{
                      id: "final",
                      role: "assistant",
                      content: generatedText,
                      timestamp: new Date(),
                    }}
                  />
                  <Button
                    onClick={downloadText}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Text
                  </Button>
                </div>
              ) : (
                // Empty state - centered welcome
                <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
                  <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <div className="rounded-full bg-primary/10 p-8">
                      <MessageCircle className="h-12 w-12 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Generate Your First Text
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Enter a prompt below to generate text with AI models
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TracingBeam>
        </div>

        {/* Fixed Input Section */}
        <div className="max-w-3xl mx-auto p-4 w-full min-w-0">
          <TextMultimodalInput
            chatId={chatId}
            input={input}
            setInput={setInput}
            status={isGenerating ? "submitted" : status}
            stop={stop}
            messages={isGenerating || generatedText ? [] : messages}
            actualMessagesCount={messages.length}
            setMessages={setMessages}
            sendMessage={async () => {
              await handleSubmit();
            }}
            selectedVisibilityType="private"
            selectedModelId={selectedModelId}
            onModelChange={setSelectedModelId}
            onSuggestionClick={handleSuggestionClick}
            onClearChat={handleClearChat}
            models={availableModels}
          />
        </div>
    </div>
  );
}