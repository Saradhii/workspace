"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { CodeMultimodalInput } from "./code-multimodal-input";
import { CodeLoadingCard } from "./code-loading-card";
import { CodeResultCard } from "./code-result-card";
import { getUserSession, getCodeModels, generateCodeStream, type CodeModel } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Code, Download } from "lucide-react";

interface CodeMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  reasoning?: string;
  language?: string;
}

export default function CodeCreation() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<CodeMessage[]>([]);
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming" | "error">("ready");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState("zai-org/GLM-4.5-Air");
  const [availableModels, setAvailableModels] = useState<CodeModel[]>([]);
  const chatId = "code-creation-chat";
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
        const modelsResponse = await getCodeModels();
        if (modelsResponse.success && modelsResponse.models) {
          setAvailableModels(modelsResponse.models);
        }
      } catch (error) {
        console.error("Failed to load models:", error);
        // Set default models if API fails
        setAvailableModels([{
          id: "zai-org/GLM-4.5-Air",
          name: "glm-4.5-air",
          display_name: "ZLM 4.5 Air",
          description: "Advanced coding assistant with excellent code generation capabilities",
          provider: "Zhipu AI",
          context_length: 128000,
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

  // Handle code generation
  const handleSubmit = async () => {
    if (!input.trim() || !userId) return;

    setIsGenerating(true);
    setStatus("submitted");

    // Add user message
    const userMessage: CodeMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Add assistant message placeholder
    const assistantMessage: CodeMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, assistantMessage]);
    setStatus("streaming");

    try {
      const stream = generateCodeStream({
        prompt: input,
        language: selectedLanguage,
        model: selectedModelId,
        temperature: 0.3,
        max_tokens: 4000,
        ...(userId && { user_id: userId }),
      });

      let accumulatedContent = '';

      for await (const event of stream) {
        if (event.type === 'content') {
          accumulatedContent += event.content;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, content: accumulatedContent, isTyping: true }
                : msg
            )
          );
        } else if (event.type === 'start') {
          // Stream started
        } else if (event.type === 'done') {
          // Final response
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, content: accumulatedContent, isTyping: false }
                : msg
            )
          );
          setGeneratedCode(accumulatedContent);
          break;
        } else if (event.type === 'error') {
          throw new Error(event.error || 'Generation failed');
        }
      }

      scrollToBottom();
    } catch (error) {
      console.error('Error generating code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate code';

      // Update assistant message with error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content: `Sorry, I encountered an error: ${errorMessage}`, isTyping: false }
            : msg
        )
      );

      setStatus("error");
      toast.error(errorMessage);
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
    setStatus("submitted");

    // Add user message
    const userMessage: CodeMessage = {
      id: Date.now().toString(),
      role: "user",
      content: suggestion,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Add assistant message placeholder
    const assistantMessage: CodeMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, assistantMessage]);
    setStatus("streaming");

    try {
      const response = await fetch('/api/v1/chat/ask-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: suggestion,
          conversation_id: chatId,
          temperature: 0.7,
          document_ids: [],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

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
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              break;
            }

            try {
              const event = JSON.parse(data);

              if (event.type === 'content') {
                accumulatedContent += event.content;
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: accumulatedContent, isTyping: true }
                      : msg
                  )
                );
              } else if (event.type === 'sources') {
                // Sources received (from RAG)
              } else if (event.type === 'done') {
                // Final response
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: accumulatedContent, isTyping: false }
                      : msg
                  )
                );
                setGeneratedCode(accumulatedContent);
                break;
              } else if (event.type === 'error') {
                throw new Error(event.error || 'Generation failed');
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }

      scrollToBottom();
    } catch (error) {
      console.error('Error generating code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate code';

      // Update assistant message with error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content: `Sorry, I encountered an error: ${errorMessage}`, isTyping: false }
            : msg
        )
      );

      setStatus("error");
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
      setStatus("ready");
    }
  };

  // Clear chat
  const handleClearChat = () => {
    setMessages([]);
    setGeneratedCode(null);
    setStatus("ready");
    setInput("");
  };

  // Copy code
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy code: ", err);
      toast.error("Failed to copy code");
    }
  };

  // Download code
  const handleDownloadCode = () => {
    if (!generatedCode) return;

    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated-code-${Date.now()}.${selectedLanguage}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Code downloaded successfully!");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Content Area - Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {messages.length > 0 ? (
          // Messages state - show scrollable conversation
          <div className="flex flex-col gap-4 w-full max-w-6xl pb-4 mx-auto">
            {messages.map((message) => (
              <CodeResultCard
                key={message.id}
                message={message}
                onCopy={handleCopyCode}
                onDownload={handleDownloadCode}
                language={selectedLanguage}
                showLineNumbers={showLineNumbers}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : isGenerating ? (
          // Loading state - centered
          <div className="flex items-center justify-center min-h-full">
            <CodeLoadingCard />
          </div>
        ) : status === "error" ? (
          // Error state - centered
          <div className="flex items-center justify-center min-h-full">
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                <Code className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Generation Failed
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {messages.length > 0 && messages[messages.length - 1]?.content.includes("Sorry, I encountered an error")
                    ? messages[messages.length - 1]?.content
                    : "Failed to generate code. Please try again."}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setStatus("ready");
                  setInput("");
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : generatedCode ? (
          // Generated code state - show result with download
          <div className="flex flex-col items-center gap-6 w-full max-w-6xl pb-4 mx-auto">
            <CodeResultCard
              message={{
                id: "final",
                role: "assistant",
                content: generatedCode,
                timestamp: new Date(),
              }}
              onCopy={handleCopyCode}
              onDownload={handleDownloadCode}
              language={selectedLanguage}
                showLineNumbers={showLineNumbers}
            />
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleDownloadCode}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Code
              </Button>
            </div>
          </div>
        ) : (
          // Empty state - centered welcome
          <div className="flex items-center justify-center min-h-full">
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-8">
                <Code className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Generate Your First Code
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter a prompt below to generate code with AI models
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Input Section */}
      <div className="mx-auto p-4 bg-gradient-to-t from-background via-background/95 to-transparent" style={{ width: '702.547px' }}>
        <CodeMultimodalInput
          input={input}
          setInput={setInput}
          status={isGenerating ? "submitted" : status}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          showLineNumbers={showLineNumbers}
          onToggleLineNumbers={setShowLineNumbers}
          sendMessage={handleSubmit}
          onSuggestionClick={handleSuggestionClick}
          onClearChat={handleClearChat}
          selectedModel={selectedModelId}
          onModelChange={(model) => setSelectedModelId(model)}
          models={availableModels}
        />
      </div>
    </div>
  );
}