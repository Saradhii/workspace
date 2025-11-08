"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { MultimodalInput } from "./components/multimodal-input";
import { ChatHeader } from "./components/chat-header";
import { AppSidebar } from "./components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarRail } from "@/components/ui/sidebar";
import { ChatBubble } from "./components/chat-bubble";
import type { VisibilityType } from "./components/visibility-selector";
import type { Attachment } from "@/lib/types";
import { queryRAGStream, type RAGSourceDocument, type AIStatus, getTextModels } from "@/lib/api";
import type { TextModel } from "@/types/models";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  sources?: RAGSourceDocument[];
  aiStatus?: AIStatus;
  generatedWithAI?: boolean;
  reasoning?: string; // For models with thinking capabilities
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming" | "error">("ready");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedVisibilityType, setSelectedVisibilityType] = useState<VisibilityType>("private");
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>("chutes:openai/gpt-oss-20b");
  const [availableModels, setAvailableModels] = useState<TextModel[]>([]);
  const chatId = "default-chat";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const stop = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setStatus("ready");

    // Remove typing indicator
    setMessages((prev) => prev.filter((m) => !m.isTyping));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load available models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const modelsResponse = await getTextModels();
        if (modelsResponse.success && modelsResponse.models) {
          setAvailableModels(modelsResponse.models);
        }
      } catch (error) {
        console.error("Failed to load models:", error);
      }
    };
    loadModels();
  }, []);

  // Chat streaming function
  const chatStream = async (
    messages: { role: string; content: string }[],
    modelId: string,
    onChunk: (chunk: any) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ) => {
    try {
      const response = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          stream: true,
          think: true, // Enable thinking for reasoning models
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              onComplete();
              return;
            }

            try {
              const event = JSON.parse(data);

              // Map Ollama events to our expected format
              if (event.message) {
                if (event.message.content) {
                  onChunk({
                    type: 'content',
                    content: event.message.content,
                  });
                }
                if (event.message.thinking) {
                  onChunk({
                    type: 'reasoning',
                    content: event.message.thinking,
                  });
                }
              }

              if (event.type === 'complete') {
                onChunk({
                  type: 'done',
                  reasoning: event.message?.thinking,
                });
                onComplete();
                return;
              } else if (event.type === 'error') {
                throw new Error(event.error || 'Chat failed');
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }

      onComplete();
    } catch (error) {
      console.error('Error in chat streaming:', error);
      onError(error as Error);
    }
  };

  
  const handleUploadComplete = (result: any) => {
    if (result.success) {
      setUploadedDocs(prev => [...prev, result.document_id]);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setUploadedDocs([]);
    setAttachments([]);
    setInput("");
    setStatus("ready");
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    // Create user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: content,
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setStatus("submitted");

    // For now, we'll use chat directly without requiring documents
    // (You can re-enable document checking later if needed)

    // Create streaming assistant message
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setStatus("streaming");

    let accumulatedText = "";
    let accumulatedReasoning = "";

    try {
      // Use chat streaming
      await chatStream(
        [{ role: "user", content }],
        selectedModelId,
        // onChunk
        (chunk) => {
          if (controller.signal.aborted) return;

          if (chunk.type === 'content') {
            accumulatedText += chunk.content || "";
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? { ...msg, content: accumulatedText }
                  : msg
              )
            );
          } else if (chunk.type === 'reasoning') {
            accumulatedReasoning += chunk.content || "";
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? { ...msg, reasoning: accumulatedReasoning, isTyping: true }
                  : msg
              )
            );
          } else if (chunk.type === 'done') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? {
                      ...msg,
                      content: accumulatedText,
                      reasoning: chunk.reasoning || accumulatedReasoning,
                      generatedWithAI: true,
                      aiStatus: {
                        enabled: true,
                        status: "success",
                        service: "ollama",
                        model: selectedModelId
                      },
                      isTyping: false
                    }
                  : msg
              )
            );
          } else if (chunk.type === 'error') {
            throw new Error(chunk.error);
          }
        },
        // onError
        (error: Error) => {
          if (controller.signal.aborted) return;

          console.error('Streaming error:', error);
          toast.error("Failed to process your request. Please try again.");

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? {
                    ...msg,
                    content: `Sorry, I encountered an error: ${errorMessage}`,
                    isTyping: false
                  }
                : msg
            )
          );
        },
        // onComplete
        () => {
          if (!controller.signal.aborted) {
            setStatus("ready");
            setAbortController(null);
          }
        }
      );
    } catch (error) {
      if (controller.signal.aborted) return;

      console.error('Error querying RAG:', error);
      toast.error("Failed to process your request. Please try again.");

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: `Sorry, I encountered an error: ${errorMessage}`,
                isTyping: false
              }
            : msg
        )
      );
      setStatus("ready");
      setAbortController(null);
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-screen flex-col">
          <ChatHeader
            selectedVisibilityType={selectedVisibilityType}
            onVisibilityChange={setSelectedVisibilityType}
          />
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto flex min-w-0 max-w-4xl flex-col gap-4 md:gap-6">
              <div className="flex flex-col gap-4 px-2 py-4 md:gap-6 md:px-4">
                {messages.length === 0 ? (
                  <div className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8">
                    <div className="font-semibold text-xl md:text-2xl">
                      Hello there!
                    </div>
                    <div className="text-xl text-zinc-500 md:text-2xl">
                      How can I help you today?
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <ChatBubble key={message.id} message={message} />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="bg-background">
            <div className="max-w-3xl mx-auto p-4">
              <MultimodalInput
                chatId={chatId}
                input={input}
                setInput={setInput}
                status={status}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={[]}
                setMessages={() => {}}
                sendMessage={async () => {
                  await sendMessage(input);
                  setInput("");
                }}
                selectedVisibilityType={selectedVisibilityType}
                selectedModelId={selectedModelId}
                onModelChange={setSelectedModelId}
                availableModels={availableModels}
                onUploadComplete={handleUploadComplete}
                onClearChat={clearChat}
              />
            </div>
          </div>
        </div>
        <SidebarRail />
      </SidebarInset>
    </SidebarProvider>
  );
}