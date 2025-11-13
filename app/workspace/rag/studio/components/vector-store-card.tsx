"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Database, CheckCircle2, RefreshCw, BarChart3, FileText, AlertCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Document {
  id: string;
  fileName: string;
  hasEmbeddings?: boolean;
  embeddingModel?: string;
  chunkCount?: number;
}

interface VectorStoreCardProps {
  onStatusChange?: (status: string) => void;
}

export function VectorStoreCard({ onStatusChange }: VectorStoreCardProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [database, setDatabase] = useState("in-memory");
  const [isIndexing, setIsIndexing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const databases = [
    { value: "in-memory", label: "In-Memory (Privacy)" },
  ];

  // Fetch documents and stats on mount and periodically
  useEffect(() => {
    fetchDocuments();
    fetchStats();

    const interval = setInterval(() => {
      fetchDocuments();
      fetchStats();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/rag/documents/upload');
      const result = await response.json();

      if (result.success && result.documents) {
        setDocuments(result.documents);

        // Auto-select first document with embeddings if none selected
        if (!selectedDocId && result.documents.length > 0) {
          const docWithEmbeddings = result.documents.find((d: Document) => d.hasEmbeddings);
          if (docWithEmbeddings) {
            setSelectedDocId(docWithEmbeddings.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/rag/vector-store/stats');
      const result = await response.json();

      if (result.success) {
        setStats(result);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleIndex = async () => {
    if (!selectedDocId) {
      toast.error('Please select a document');
      return;
    }

    const selectedDoc = documents.find(d => d.id === selectedDocId);
    if (!selectedDoc) {
      toast.error('Document not found');
      return;
    }

    if (!selectedDoc.hasEmbeddings) {
      toast.error('Please generate embeddings for this document first');
      return;
    }

    setIsIndexing(true);
    setError(null);
    onStatusChange?.("processing");

    try {
      const response = await fetch('/api/rag/vector-store/index', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: selectedDocId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to index document');
      }

      // Refresh stats
      await fetchStats();

      toast.success(
        `✅ Indexed ${result.document.vectorsIndexed} vectors for ${selectedDoc.fileName} (${result.document.dimensions}D)`
      );

      onStatusChange?.("active");

    } catch (error) {
      console.error('Error indexing document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to index document';
      setError(errorMessage);
      toast.error(errorMessage);
      onStatusChange?.("idle");
    } finally {
      setIsIndexing(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    await fetchStats();
    await fetchDocuments();
    setLoading(false);
    toast.success('Stats refreshed');
  };

  const selectedDoc = documents.find(d => d.id === selectedDocId);
  const canIndex = selectedDoc && selectedDoc.hasEmbeddings && !isIndexing;
  const isConnected = stats?.vectorStore?.status === 'connected';

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Vector Store
            </CardTitle>
            <CardDescription>Index embeddings for semantic search</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={loading}
              className="h-7 px-2"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {isConnected && (
              <div className="flex items-center gap-1 text-green-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <CheckCircle2 className="h-4 w-4" />
              </div>
            )}
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
            {stats && (
              <Badge variant="secondary" className="text-xs">
                {stats.stats?.indexedDocuments || 0}/{stats.stats?.totalDocumentsWithEmbeddings || 0} indexed
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
                  <SelectItem key={doc.id} value={doc.id} disabled={!doc.hasEmbeddings}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      {doc.fileName}
                      {!doc.hasEmbeddings && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          No embeddings
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedDoc && !selectedDoc.hasEmbeddings && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3 w-3" />
              <span>Generate embeddings for this document first</span>
            </div>
          )}
          {selectedDoc && selectedDoc.hasEmbeddings && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{selectedDoc.chunkCount} chunks with embeddings ready</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Database Selection */}
        <div className="space-y-2">
          <Label htmlFor="database" className="text-sm font-medium">
            Vector Database
          </Label>
          <Select value={database} onValueChange={setDatabase} disabled>
            <SelectTrigger id="database">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {databases.map((db) => (
                <SelectItem key={db.value} value={db.value}>
                  {db.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Using in-memory vector store for privacy and simplicity
          </p>
        </div>

        {/* Connection Status */}
        <div className="space-y-3">
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection Status</span>
              <Badge
                variant="default"
                className="text-xs bg-green-500 hover:bg-green-600"
              >
                Connected
              </Badge>
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Collection:</span>
                <span className="font-medium text-foreground">rag-documents</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-medium text-foreground">In-Memory</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Index Button */}
        <div className="space-y-3">
          {error ? (
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
              onClick={handleIndex}
              disabled={!canIndex}
              className="w-full"
              size="sm"
            >
              {isIndexing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Indexing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Index Document
                </>
              )}
            </Button>
          )}
        </div>

        {/* Index Statistics */}
        {stats && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Index Statistics</Label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  <div className="text-xs text-muted-foreground">Vectors</div>
                  <p className="text-xl font-bold font-mono">{stats.stats?.totalVectors?.toLocaleString() || 0}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  <div className="text-xs text-muted-foreground">Dimensions</div>
                  <p className="text-xl font-bold font-mono">{stats.stats?.dimensions || 0}</p>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Storage Used</span>
                  <span className="font-medium">{stats.stats?.memoryUsageMB || 0} MB</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${stats.quota?.percentage || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{stats.quota?.percentage || 0}% of quota</span>
                  <span>{stats.stats?.remainingMemoryMB || 0} MB available</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={handleSync}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={fetchStats}
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Stats
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
