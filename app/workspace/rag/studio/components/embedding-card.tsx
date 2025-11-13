"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Zap, TrendingUp, FileText, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Document {
  id: string;
  fileName: string;
  hasChunks: boolean;
  chunkCount?: number;
  hasEmbeddings?: boolean;
  embeddingModel?: string;
  dimensions?: number;
}

interface EmbeddingCardProps {
  onStatusChange?: (status: string) => void;
}

export function EmbeddingCard({ onStatusChange }: EmbeddingCardProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [provider, setProvider] = useState("huggingface");
  const [model, setModel] = useState("all-MiniLM-L6-v2");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const modelOptions = {
    huggingface: [
      { value: "all-MiniLM-L6-v2", label: "all-MiniLM-L6-v2", dim: "384" },
      { value: "all-mpnet-base-v2", label: "all-mpnet-base-v2", dim: "768" },
    ],
  };

  const currentModels = modelOptions[provider as keyof typeof modelOptions] || modelOptions.huggingface;
  const currentModel = currentModels.find(m => m.value === model) || currentModels[0];

  // Fetch available documents on mount and periodically
  useEffect(() => {
    fetchDocuments();

    // Poll for new documents every 2 seconds
    const interval = setInterval(fetchDocuments, 2000);

    return () => clearInterval(interval);
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/rag/documents/upload');
      const result = await response.json();

      if (result.success && result.documents) {
        setDocuments(result.documents);

        // Auto-select first document with chunks if none selected
        if (!selectedDocId && result.documents.length > 0) {
          const docWithChunks = result.documents.find((d: Document) => d.hasChunks);
          if (docWithChunks) {
            setSelectedDocId(docWithChunks.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedDocId) {
      toast.error('Please select a document');
      return;
    }

    const selectedDoc = documents.find(d => d.id === selectedDocId);
    if (!selectedDoc) {
      toast.error('Document not found');
      return;
    }

    if (!selectedDoc.hasChunks) {
      toast.error('Please process the document first to create chunks');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProgressMessage('Starting embedding generation...');
    setError(null);
    onStatusChange?.("processing");

    try {
      const response = await fetch('/api/rag/embeddings/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: selectedDocId,
          model,
          provider,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate embeddings');
      }

      // Simulate progress updates (since we don't have streaming yet)
      const totalChunks = selectedDoc.chunkCount || 0;
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        setProgressMessage(`Generating embeddings... ${i}%`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setProgress(100);
      setProgressMessage('Completed!');

      // Refresh documents
      await fetchDocuments();

      toast.success(
        `✅ Generated ${result.document.embeddingCount} embeddings for ${selectedDoc.fileName} (${result.document.dimensions}D)`
      );

      onStatusChange?.("active");

      // Reset after a delay
      setTimeout(() => {
        setProgress(0);
        setProgressMessage('');
        setIsProcessing(false);
      }, 1500);

    } catch (error) {
      console.error('Error generating embeddings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate embeddings';
      setError(errorMessage);
      toast.error(errorMessage);
      onStatusChange?.("idle");
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const selectedDoc = documents.find(d => d.id === selectedDocId);
  const canGenerate = selectedDoc && selectedDoc.hasChunks && !isProcessing;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Embedding Generation
            </CardTitle>
            <CardDescription>Convert text chunks to vector embeddings</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchDocuments()}
              disabled={loading}
              className="h-7 px-2"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              AI
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Document Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="document" className="text-sm font-medium">
              Select Document
            </Label>
            {documents.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {documents.filter(d => d.hasEmbeddings).length}/{documents.length} embedded
              </Badge>
            )}
          </div>
          <Select value={selectedDocId} onValueChange={setSelectedDocId}>
            <SelectTrigger id="document">
              <SelectValue placeholder="Choose a document" />
            </SelectTrigger>
            <SelectContent>
              {documents.length === 0 ? (
                <SelectItem value="none" disabled>
                  No documents uploaded yet
                </SelectItem>
              ) : (
                documents.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id} disabled={!doc.hasChunks}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      {doc.fileName}
                      {doc.hasEmbeddings && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          ✓ {doc.dimensions}D
                        </Badge>
                      )}
                      {!doc.hasChunks && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          No chunks
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedDoc && !selectedDoc.hasChunks && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3 w-3" />
              <span>Process this document first to create chunks</span>
            </div>
          )}
          {selectedDoc && selectedDoc.hasChunks && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{selectedDoc.chunkCount} chunks ready</span>
              {selectedDoc.hasEmbeddings && (
                <>
                  <span>•</span>
                  <span className="text-green-600 dark:text-green-400">Already embedded</span>
                </>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="provider" className="text-sm font-medium">
            Embedding Provider
          </Label>
          <Select value={provider} onValueChange={setProvider} disabled>
            <SelectTrigger id="provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="huggingface">HuggingFace</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Using HuggingFace sentence transformers for fast, accurate embeddings
          </p>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model" className="text-sm font-medium">
            Model
          </Label>
          <Select value={model} onValueChange={setModel} disabled={isProcessing}>
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
            <div className="text-xs text-muted-foreground">Chunks</div>
            <p className="text-lg font-bold font-mono">{selectedDoc?.chunkCount || 0}</p>
          </div>
        </div>

        <Separator />

        {/* Processing Status */}
        <div className="space-y-3">
          {isProcessing ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{progressMessage}</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                This may take a few moments depending on the number of chunks...
              </p>
            </>
          ) : error ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error: {error}</span>
              </div>
              <Button
                onClick={() => setError(null)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Dismiss
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full"
              size="sm"
            >
              {selectedDoc?.hasEmbeddings ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-generate Embeddings
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Embeddings
                </>
              )}
            </Button>
          )}
        </div>

        {/* Stats */}
        {selectedDoc?.hasEmbeddings && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Model</span>
              <span className="font-medium">{selectedDoc.embeddingModel?.split('/').pop()}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Dimensions</span>
              <span className="font-medium">{selectedDoc.dimensions}D</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total Embeddings</span>
              <span className="font-medium text-green-600">{selectedDoc.chunkCount}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
