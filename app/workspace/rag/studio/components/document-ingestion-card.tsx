"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUpload } from "@/components/ui/file-upload";
import { FileUp, FileText, File, X, Shield, Clock, FileType, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Document {
  id: string;
  name: string;
  size: string;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
  extractionMethod?: string;
  extractionModel?: string;
  processingTimeMs?: number;
  fileType?: string;
  textLength?: number;
  error?: string;
}

interface DocumentIngestionCardProps {
  onStatusChange?: (status: string) => void;
  onProcessingStatusChange?: (status: string) => void;
}

export function DocumentIngestionCard({ onStatusChange, onProcessingStatusChange }: DocumentIngestionCardProps) {
  const [documents, setDocuments] = useState<Document[]>([]);

  const handleFileUpload = async (files: File[]) => {
    // Start ingestion stage
    onStatusChange?.("processing");

    for (const file of files) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;

      // Add document to list with uploading status
      const newDoc: Document = {
        id: tempId,
        name: file.name,
        size: formatFileSize(file.size),
        status: "uploading",
        progress: 0,
      };

      setDocuments(prev => [...prev, newDoc]);

      try {
        // Upload file to API
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/rag/documents/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Update document with extraction info
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === tempId
              ? {
                  ...doc,
                  id: result.document.id,
                  status: "completed" as const,
                  progress: 100,
                  extractionMethod: result.document.extractionMethod,
                  extractionModel: result.document.extractionModel,
                  processingTimeMs: result.document.processingTimeMs,
                  fileType: result.document.fileType,
                  textLength: result.document.textLength,
                }
              : doc
          )
        );

        toast.success(`✅ ${file.name} extracted via ${getExtractionMethodDisplay(result.document.extractionMethod)}`);

        // Ingestion complete, move to processing stage
        onStatusChange?.("active");
        onProcessingStatusChange?.("processing");

        // Auto-trigger chunking with default settings
        await autoProcessDocument(result.document.id);

        // Processing complete
        onProcessingStatusChange?.("active");

      } catch (error) {
        console.error('Upload error:', error);

        // Update document with error status
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === tempId
              ? {
                  ...doc,
                  status: "error" as const,
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : doc
          )
        );

        toast.error(`❌ Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);

        // Reset statuses on error
        onStatusChange?.("idle");
        onProcessingStatusChange?.("idle");
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const removeDocument = async (id: string) => {
    try {
      // Call API to delete from memory
      await fetch(`/api/rag/documents/${id}`, {
        method: 'DELETE',
      });

      // Remove from local state
      setDocuments(docs => docs.filter(doc => doc.id !== id));
      toast.success('Document removed from memory');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to remove document');
    }
  };

  const clearAllDocuments = async () => {
    try {
      await fetch('/api/rag/documents/clear', {
        method: 'POST',
      });

      setDocuments([]);
      toast.success('All documents cleared from memory');
    } catch (error) {
      console.error('Clear all error:', error);
      toast.error('Failed to clear documents');
    }
  };

  const getExtractionMethodDisplay = (method?: string): string => {
    switch (method) {
      case 'direct':
        return 'Direct Text';
      case 'ocr-deepseek':
        return 'DeepSeek-OCR';
      case 'ocr-ollama':
        return 'Ollama Vision';
      case 'pdf-text':
        return 'PDF Text Extraction';
      case 'hybrid':
        return 'Hybrid (Text + OCR)';
      default:
        return 'Unknown';
    }
  };

  const getExtractionIcon = (method?: string) => {
    switch (method) {
      case 'direct':
        return <FileText className="h-3 w-3" />;
      case 'ocr-deepseek':
      case 'ocr-ollama':
        return <Sparkles className="h-3 w-3" />;
      case 'pdf-text':
        return <FileType className="h-3 w-3" />;
      case 'hybrid':
        return <Sparkles className="h-3 w-3" />;
      default:
        return <File className="h-3 w-3" />;
    }
  };

  const autoProcessDocument = async (documentId: string) => {
    try {
      // Auto-chunk with default settings
      const response = await fetch(`/api/rag/documents/${documentId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chunkSize: 500,
          chunkOverlap: 50,
          strategy: 'sentence',
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`[Auto-Process] Chunked document: ${result.document.chunkCount} chunks`);
        toast.success(`🔪 Document chunked: ${result.document.chunkCount} chunks created (${result.document.strategy} strategy)`);
      }
    } catch (error) {
      console.error('[Auto-Process] Error:', error);
      // Don't show error to user for auto-processing - they can manually re-process if needed
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-primary" />
              Document Ingestion
            </CardTitle>
            <CardDescription>Upload and manage your documents</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              In-Memory Only
            </Badge>
            <Badge variant="secondary">{documents.length} files</Badge>
          </div>
        </div>
        {/* Privacy Notice */}
        <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-md">
          <p className="text-xs text-green-800 dark:text-green-400 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <strong>Privacy First:</strong> All documents processed in-memory only. No data saved to disk or database.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="w-full border border-dashed bg-background border-neutral-200 dark:border-neutral-800 rounded-lg">
          <FileUpload onChange={handleFileUpload} />
        </div>

        {/* Document List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Uploaded Documents</span>
            {documents.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={clearAllDocuments}
              >
                Clear All
              </Button>
            )}
          </div>
          <ScrollArea className="h-[180px] rounded-md border p-2">
            <div className="space-y-2">
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No documents uploaded yet</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col gap-2 p-3 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <File className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.size}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeDocument(doc.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Extraction Method Info */}
                    {doc.status === "completed" && doc.extractionMethod && (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getExtractionIcon(doc.extractionMethod)}
                          {getExtractionMethodDisplay(doc.extractionMethod)}
                        </Badge>
                        {doc.extractionModel && (
                          <Badge variant="secondary" className="text-xs">
                            {doc.extractionModel}
                          </Badge>
                        )}
                        {doc.processingTimeMs && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {(doc.processingTimeMs / 1000).toFixed(2)}s
                          </span>
                        )}
                        {doc.textLength && (
                          <span className="text-muted-foreground">
                            {(doc.textLength / 1000).toFixed(1)}k chars
                          </span>
                        )}
                      </div>
                    )}

                    {/* Status Badges */}
                    {doc.status === "uploading" && (
                      <Badge variant="secondary" className="text-xs animate-pulse">
                        Processing...
                      </Badge>
                    )}
                    {doc.status === "error" && (
                      <div className="space-y-1">
                        <Badge variant="destructive" className="text-xs">
                          Error
                        </Badge>
                        {doc.error && (
                          <p className="text-xs text-destructive">{doc.error}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
