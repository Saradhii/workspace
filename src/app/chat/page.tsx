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
import { queryRAGStream, type RAGSourceDocument, type AIStatus } from "@/lib/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  sources?: RAGSourceDocument[];
  aiStatus?: AIStatus;
  generatedWithAI?: boolean;
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming" | "error">("ready");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedVisibilityType, setSelectedVisibilityType] = useState<VisibilityType>("private");
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const chatId = "default-chat";
  const selectedModelId = "gpt-4";
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

    // Check if we have any uploaded documents
    if (uploadedDocs.length === 0) {
      // No documents uploaded, show a helpful message
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Please upload a document first using the paperclip icon above. I'll then be able to answer questions about your documents!",
          timestamp: new Date(),
          isTyping: false,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStatus("ready");
      }, 500);
      return;
    }

    // Create streaming assistant message
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: false,
      sources: [],
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setStatus("streaming");

    let sources: RAGSourceDocument[] = [];
    let accumulatedText = "";

    try {
      // Query RAG system with streaming
      await queryRAGStream(
        content,
        uploadedDocs,
        // onChunk
        (chunk) => {
          if (controller.signal.aborted) return;

          if (chunk.type === 'sources') {
            sources = (chunk.sources || []).map((s: any) => ({
              content: s.content,
              metadata: s.metadata
            }));
          } else if (chunk.type === 'content') {
            accumulatedText = chunk.accumulated || (accumulatedText + chunk.content);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? { ...msg, content: accumulatedText, sources }
                  : msg
              )
            );
          } else if (chunk.type === 'done') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? {
                      ...msg,
                      content: accumulatedText || "I couldn't find relevant information in your uploaded documents.",
                      sources,
                      generatedWithAI: chunk.generated_with_ai || false,
                      aiStatus: {
                        enabled: true,
                        status: "success",
                        service: "chutes"
                      }
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
                    content: "Sorry, I encountered an error while searching your documents. Please make sure the backend server is running on localhost:8000.",
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
                content: "Sorry, I encountered an error while searching your documents. Please make sure the backend server is running on localhost:8000.",
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