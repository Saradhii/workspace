"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUpload } from "@/components/ui/file-upload";
import { FileUp, FileText, File, X } from "lucide-react";

interface Document {
  id: string;
  name: string;
  size: string;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
}

interface DocumentIngestionCardProps {
  onStatusChange?: (status: string) => void;
}

export function DocumentIngestionCard({ onStatusChange }: DocumentIngestionCardProps) {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      name: "research-paper.pdf",
      size: "2.4 MB",
      status: "completed",
      progress: 100,
    },
    {
      id: "2",
      name: "documentation.md",
      size: "156 KB",
      status: "completed",
      progress: 100,
    },
  ]);

  const handleFileUpload = (files: File[]) => {
    // Convert File[] to Document[] format
    const newDocuments: Document[] = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: formatFileSize(file.size),
      status: "uploading" as const,
      progress: 0,
    }));

    // Add to documents list
    setDocuments(prev => [...prev, ...newDocuments]);

    // Trigger status change
    onStatusChange?.("processing");

    // Simulate upload completion
    setTimeout(() => {
      setDocuments(prev =>
        prev.map(doc =>
          newDocuments.find(nd => nd.id === doc.id)
            ? { ...doc, status: "completed" as const, progress: 100 }
            : doc
        )
      );
      onStatusChange?.("active");
    }, 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const removeDocument = (id: string) => {
    setDocuments(docs => docs.filter(doc => doc.id !== id));
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
          <Badge variant="secondary">{documents.length} files</Badge>
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
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Clear All
            </Button>
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
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={doc.status === "completed" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {doc.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeDocument(doc.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
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
