"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Zap, TrendingUp } from "lucide-react";

interface EmbeddingCardProps {
  onStatusChange?: (status: string) => void;
}

export function EmbeddingCard({ onStatusChange }: EmbeddingCardProps) {
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("text-embedding-3-small");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const modelOptions = {
    openai: [
      { value: "text-embedding-3-small", label: "text-embedding-3-small", dim: "1536" },
      { value: "text-embedding-3-large", label: "text-embedding-3-large", dim: "3072" },
      { value: "text-embedding-ada-002", label: "text-embedding-ada-002", dim: "1536" },
    ],
    huggingface: [
      { value: "all-MiniLM-L6-v2", label: "all-MiniLM-L6-v2", dim: "384" },
      { value: "all-mpnet-base-v2", label: "all-mpnet-base-v2", dim: "768" },
    ],
    llamacloud: [
      { value: "llama-embed", label: "llama-embed", dim: "4096" },
    ],
    cohere: [
      { value: "embed-english-v3.0", label: "embed-english-v3.0", dim: "1024" },
      { value: "embed-multilingual-v3.0", label: "embed-multilingual-v3.0", dim: "1024" },
    ],
  };

  const currentModels = modelOptions[provider as keyof typeof modelOptions] || modelOptions.openai;
  const currentModel = currentModels.find(m => m.value === model) || currentModels[0];

  const handleGenerate = () => {
    setIsProcessing(true);
    onStatusChange?.("processing");

    // Simulate embedding generation
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsProcessing(false);
        onStatusChange?.("active");
        setTimeout(() => {
          setProgress(0);
        }, 1000);
      }
    }, 300);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Embedding Generation
            </CardTitle>
            <CardDescription>Convert text to vector embeddings</CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            AI
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="provider" className="text-sm font-medium">
            Embedding Provider
          </Label>
          <Select value={provider} onValueChange={(val) => {
            setProvider(val);
            setModel(modelOptions[val as keyof typeof modelOptions][0].value);
          }}>
            <SelectTrigger id="provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="huggingface">HuggingFace</SelectItem>
              <SelectItem value="llamacloud">LlamaCloud</SelectItem>
              <SelectItem value="cohere">Cohere</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model" className="text-sm font-medium">
            Model
          </Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currentModels.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Dimensions
            </div>
            <p className="text-lg font-bold font-mono">{currentModel?.dim || "N/A"}</p>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Batch Size</div>
            <p className="text-lg font-bold font-mono">100</p>
          </div>
        </div>

        <Separator />

        {/* Processing Status */}
        <div className="space-y-3">
          {isProcessing ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Generating embeddings...</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ready to generate</span>
                <Badge variant="secondary">2 documents</Badge>
              </div>
              <Button
                onClick={handleGenerate}
                className="w-full"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Embeddings
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total Chunks</span>
            <span className="font-medium">127</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Embedded</span>
            <span className="font-medium text-green-600">127</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
