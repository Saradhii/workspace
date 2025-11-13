"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Scissors, Eye, Settings2, Play, FileText, Loader2, BarChart3, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Document {
  id: string;
  fileName: string;
  textLength: number;
  hasChunks: boolean;
  chunkCount?: number;
}

interface Chunk {
  id: string;
  index: number;
  text: string;
  length: number;
}

interface TextProcessingCardProps {
  onStatusChange?: (status: string) => void;
}

export function TextProcessingCard({ onStatusChange }: TextProcessingCardProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [chunkSize, setChunkSize] = useState([500]);
  const [chunkOverlap, setChunkOverlap] = useState([50]);
  const [strategy, setStrategy] = useState("sentence");
  const [showPreview, setShowPreview] = useState(false);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chunkStats, setChunkStats] = useState<{
    totalChunks: number;
    averageSize: number;
  } | null>(null);

  // Fetch available documents on mount and periodically
  useEffect(() => {
    fetchDocuments();

    // Poll for new documents every 2 seconds
    const interval = setInterval(fetchDocuments, 2000);

    return () => clearInterval(interval);
  }, []);

  // Load chunks when document is selected or changes
  useEffect(() => {
    if (selectedDocId) {
      loadDocumentChunks(selectedDocId);
    }
  }, [selectedDocId]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/rag/documents/upload');
      const result = await response.json();

      if (result.success && result.documents) {
        setDocuments(result.documents);

        // Auto-select first document if only one exists and nothing is selected
        if (!selectedDocId && result.documents.length === 1) {
          setSelectedDocId(result.documents[0].id);
        }

        // If a document is selected and now has chunks, load them
        if (selectedDocId) {
          const selectedDoc = result.documents.find((d: Document) => d.id === selectedDocId);
          if (selectedDoc?.hasChunks) {
            loadDocumentChunks(selectedDocId);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const loadDocumentChunks = async (docId: string) => {
    try {
      const response = await fetch(`/api/rag/documents/${docId}/process`);
      const result = await response.json();

      if (result.success && result.document.hasChunks) {
        setChunks(result.document.chunks || []);
        setChunkStats({
          totalChunks: result.document.chunkCount,
          averageSize: Math.round(result.document.chunks?.reduce((sum: number, c: Chunk) => sum + c.length, 0) / result.document.chunks?.length || 0),
        });
        setShowPreview(true);
      } else {
        // Document has no chunks yet
        setChunks([]);
        setChunkStats(null);
        setShowPreview(false);
      }
    } catch (error) {
      console.error('Error loading chunks:', error);
      setChunks([]);
      setChunkStats(null);
    }
  };

  const processDocument = async () => {
    if (!selectedDocId) {
      toast.error('Please select a document to process');
      return;
    }

    setProcessing(true);
    onStatusChange?.("processing");

    try {
      const response = await fetch(`/api/rag/documents/${selectedDocId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chunkSize: chunkSize[0],
          chunkOverlap: chunkOverlap[0],
          strategy,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Processing failed');
      }

      // Reload chunks to get the complete data
      await loadDocumentChunks(selectedDocId);

      // Update document list
      await fetchDocuments();

      toast.success(`✅ Processed ${result.document.fileName}: ${result.document.chunkCount} chunks created`);
      onStatusChange?.("active");

    } catch (error) {
      console.error('Processing error:', error);
      toast.error(`❌ Failed to process: ${error instanceof Error ? error.message : 'Unknown error'}`);
      onStatusChange?.("idle");
    } finally {
      setProcessing(false);
    }
  };

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-orange-500" />
              Text Processing
            </CardTitle>
            <CardDescription>Configure chunking strategy</CardDescription>
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
              <Settings2 className="h-3 w-3" />
              Config
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
                {documents.filter(d => d.hasChunks).length}/{documents.length} chunked
              </Badge>
            )}
          </div>
          <Select value={selectedDocId} onValueChange={setSelectedDocId}>
            <SelectTrigger id="document">
              <SelectValue placeholder="Choose a document to process" />
            </SelectTrigger>
            <SelectContent>
              {documents.length === 0 ? (
                <SelectItem value="none" disabled>
                  No documents uploaded yet
                </SelectItem>
              ) : (
                documents.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      {doc.fileName}
                      {doc.hasChunks && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          ✓ {doc.chunkCount} chunks
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedDoc && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{(selectedDoc.textLength / 1000).toFixed(1)}k characters</span>
              {selectedDoc.hasChunks && (
                <>
                  <span>•</span>
                  <span className="text-green-600 dark:text-green-400">Already chunked</span>
                </>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Chunking Strategy */}
        <div className="space-y-2">
          <Label htmlFor="strategy" className="text-sm font-medium">
            Chunking Strategy
          </Label>
          <Select value={strategy} onValueChange={setStrategy}>
            <SelectTrigger id="strategy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed Size</SelectItem>
              <SelectItem value="sentence">Sentence-based</SelectItem>
              <SelectItem value="paragraph">Paragraph-based</SelectItem>
              <SelectItem value="semantic">Semantic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chunk Size */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Chunk Size</Label>
            <Badge variant="secondary" className="font-mono text-xs">
              {chunkSize[0]} chars
            </Badge>
          </div>
          <Slider
            value={chunkSize}
            onValueChange={setChunkSize}
            min={200}
            max={2000}
            step={50}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>200</span>
            <span>2000</span>
          </div>
        </div>

        {/* Chunk Overlap */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Chunk Overlap</Label>
            <Badge variant="secondary" className="font-mono text-xs">
              {chunkOverlap[0]} chars
            </Badge>
          </div>
          <Slider
            value={chunkOverlap}
            onValueChange={setChunkOverlap}
            min={0}
            max={500}
            step={25}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>500</span>
          </div>
        </div>

        {/* Process Button */}
        <Button
          onClick={processDocument}
          disabled={!selectedDocId || processing}
          className="w-full"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : selectedDoc?.hasChunks ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Re-process with New Settings
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Process Document
            </>
          )}
        </Button>

        {/* Statistics */}
        {chunkStats && (
          <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-md">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Chunks</p>
                <p className="text-sm font-semibold">{chunkStats.totalChunks}</p>
              </div>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div>
              <p className="text-xs text-muted-foreground">Avg Size</p>
              <p className="text-sm font-semibold">{chunkStats.averageSize} chars</p>
            </div>
          </div>
        )}

        <Separator />

        {/* Preview Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Chunk Preview</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="h-7"
            >
              <Eye className="h-3 w-3 mr-1" />
              {showPreview ? "Hide" : "Show"}
            </Button>
          </div>

          {showPreview && chunks.length > 0 && (
            <ScrollArea className="h-[180px] rounded-md border p-3 bg-muted/30">
              <div className="space-y-3">
                {chunks.map((chunk, idx) => (
                  <div key={chunk.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Chunk {chunk.index + 1}</span>
                      <Badge variant="outline" className="text-xs">
                        {chunk.length} chars
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {chunk.text}
                    </p>
                    {idx < chunks.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))}
                {chunkStats && chunkStats.totalChunks > chunks.length && (
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    Showing first {chunks.length} of {chunkStats.totalChunks} chunks
                  </p>
                )}
              </div>
            </ScrollArea>
          )}

          {showPreview && chunks.length === 0 && (
            <div className="flex items-center justify-center h-[140px] border rounded-md bg-muted/20">
              <div className="text-center text-muted-foreground">
                <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No chunks yet. Process a document first.</p>
              </div>
            </div>
          )}

          {!showPreview && (
            <div className="flex items-center justify-center h-[140px] border rounded-md bg-muted/20">
              <div className="text-center text-muted-foreground">
                <Eye className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Click Show to preview chunks</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
