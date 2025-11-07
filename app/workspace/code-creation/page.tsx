"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { CodeMultimodalInput } from "./code-multimodal-input";
import { CodeLoadingCard } from "./code-loading-card";
import { CodeResultCard } from "./code-result-card";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { getUserSession, getCodeModels, generateCodeStream, type CodeModel } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Code, Download, Database, Zap, Lightbulb, Shield, TrendingUp, Sparkles } from "lucide-react";

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
          // Filter to only 2 models: GLM 4.5 Air and one other
          const filteredModels = modelsResponse.models.filter(model =>
            model.id === "zai-org/GLM-4.5-Air" ||
            model.id.includes("qwen") ||
            model.id.includes("deepseek")
          ).slice(0, 2);
          setAvailableModels(filteredModels);
        }
      } catch (error) {
        console.error("Failed to load models:", error);
        // Set default models if API fails (only 2 models)
        setAvailableModels([
          {
            id: "zai-org/GLM-4.5-Air",
            name: "glm-4.5-air",
            displayName: "GLM 4.5 Air",
            description: "Advanced coding assistant with excellent code generation capabilities",
            provider: "Zhipu AI",
            context_length: 128000,
            display_name: "GLM 4.5 Air",
          },
          {
            id: "deepseek-ai/DeepSeek-Coder-V2-Instruct",
            name: "deepseek-coder-v2",
            displayName: "DeepSeek Coder V2",
            description: "Powerful code generation model",
            provider: "DeepSeek",
            context_length: 128000,
            display_name: "DeepSeek Coder V2",
          }
        ]);
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
        language: "javascript", // Default language
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
          console.log('[CODE STREAM] Started');
        } else if (event.type === 'done') {
          // Final response
          console.log('[CODE STREAM] Completed');
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
          console.error('[CODE STREAM] Error:', event.error);
          const errorMessage = event.error || 'Code generation failed';
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, content: `Sorry, I encountered an error: ${errorMessage}`, isTyping: false }
                : msg
            )
          );
          setStatus("error");
          toast.error(errorMessage);
          break;
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
    link.download = `generated-code-${Date.now()}.js`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Code downloaded successfully!");
  };

  // Code suggestions for the empty state
  const codeSuggestions = [
    {
      icon: <Code className="h-4 w-4" />,
      title: "React Component",
      description: "Create a React component with hooks",
      action: "Create a React component with useState, useEffect, and custom hooks for state management",
    },
    {
      icon: <Database className="h-4 w-4" />,
      title: "REST API",
      description: "Build an Express.js server",
      action: "Build an Express.js server with CRUD operations for a database",
    },
    {
      icon: <Zap className="h-4 w-4" />,
      title: "Sorting Algorithms",
      description: "Quick sort, bubble sort, merge sort",
      action: "Implement quick sort, bubble sort, merge sort, and binary search algorithms",
    },
    {
      icon: <Shield className="h-4 w-4" />,
      title: "Authentication",
      description: "JWT auth with protected routes",
      action: "Create JWT authentication with login, registration, and protected routes",
    },
    {
      icon: <Lightbulb className="h-4 w-4" />,
      title: "Dashboard",
      description: "Responsive admin dashboard",
      action: "Build a responsive admin dashboard with charts and data visualization",
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      title: "Performance",
      description: "Implement lazy loading",
      action: "Add React.lazy, Suspense, and error boundaries for better performance",
    },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Content Area with TracingBeam */}
      <div className="flex-1 relative overflow-hidden">
        <TracingBeam className="h-full overflow-y-auto px-6">
          <div className="max-w-4xl mx-auto antialiased py-8">
            {messages.length > 0 ? (
              // Messages state - show scrollable conversation
              <div className="space-y-10">
                {messages.map((message) => (
                  <div key={message.id}>
                    <CodeResultCard
                      message={message}
                      onCopy={handleCopyCode}
                      onDownload={handleDownloadCode}
                      language="javascript"
                      showLineNumbers={false}
                    />
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : isGenerating ? (
              // Loading state
              <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
                <CodeLoadingCard />
              </div>
            ) : status === "error" ? (
              // Error state
              <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
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
              <div className="flex flex-col items-center gap-6">
                <CodeResultCard
                  message={{
                    id: "final",
                    role: "assistant",
                    content: generatedCode,
                    timestamp: new Date(),
                  }}
                  onCopy={handleCopyCode}
                  onDownload={handleDownloadCode}
                  language="javascript"
                  showLineNumbers={false}
                />
                <Button
                  onClick={handleDownloadCode}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Code
                </Button>
              </div>
            ) : (
              // Empty state with integrated suggestions
              <div className="flex flex-col items-center justify-center" style={{ minHeight: '400px' }}>
                <div className="w-full max-w-4xl space-y-8">
                  {/* Header */}
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
                      <Code className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">
                        Start Generating Code
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choose a suggestion below or describe what you want to build
                      </p>
                    </div>
                  </div>

                  {/* Suggestions Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {codeSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.title}
                        onClick={() => {
                          setInput(suggestion.action);
                          // Auto-submit after setting input
                          setTimeout(async () => {
                            if (!userId) return;

                            setIsGenerating(true);
                            setStatus("submitted");

                            // Add user message
                            const userMessage: CodeMessage = {
                              id: Date.now().toString(),
                              role: "user",
                              content: suggestion.action,
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

                            // Generate code
                            try {
                              const stream = generateCodeStream({
                                prompt: suggestion.action,
                                language: "javascript",
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
                                } else if (event.type === 'done') {
                                  setMessages(prev =>
                                    prev.map(msg =>
                                      msg.id === assistantMessage.id
                                        ? { ...msg, content: accumulatedContent, isTyping: false }
                                        : msg
                                    )
                                  );
                                  setGeneratedCode(accumulatedContent);
                                  scrollToBottom();
                                  break;
                                } else if (event.type === 'error') {
                                  throw new Error(event.error || 'Generation failed');
                                }
                              }
                            } catch (error) {
                              console.error('Error generating code:', error);
                              const errorMessage = error instanceof Error ? error.message : 'Failed to generate code';

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
                          }, 100);
                        }}
                        className="group flex items-start gap-3 p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-all duration-200 text-left"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          {suggestion.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                            {suggestion.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {suggestion.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TracingBeam>
      </div>

      {/* Fixed Input Section */}
      <div className="mx-auto p-4 w-full min-w-0" style={{ maxWidth: '635px' }}>
        <CodeMultimodalInput
          input={input}
          setInput={setInput}
          status={isGenerating ? "submitted" : status}
          sendMessage={handleSubmit}
          onClearChat={handleClearChat}
          selectedModel={selectedModelId}
          onModelChange={(model) => setSelectedModelId(model)}
          models={availableModels}
        />
      </div>
    </div>
  );
}