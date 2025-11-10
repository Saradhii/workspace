"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { FileText, Brain, Sparkles } from "lucide-react";

export default function RAGStudioPage() {
  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">RAG Studio</h1>
          <p className="text-muted-foreground">
            All-in-one workspace for OCR, embeddings, and semantic search testing
          </p>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="ocr" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="ocr" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>OCR Test</span>
            </TabsTrigger>
            <TabsTrigger value="embeddings" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span>Embeddings</span>
            </TabsTrigger>
            <TabsTrigger value="hf-embeddings" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>HF Embeddings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ocr" className="mt-0">
            <Card className="p-0 overflow-hidden border-0">
              <iframe
                src="/test-ocr"
                className="w-full h-[calc(100vh-250px)] border-0"
                title="OCR Test"
              />
            </Card>
          </TabsContent>

          <TabsContent value="embeddings" className="mt-0">
            <Card className="p-0 overflow-hidden border-0">
              <iframe
                src="/test-embeddings"
                className="w-full h-[calc(100vh-250px)] border-0"
                title="Embeddings Test"
              />
            </Card>
          </TabsContent>

          <TabsContent value="hf-embeddings" className="mt-0">
            <Card className="p-0 overflow-hidden border-0">
              <iframe
                src="/test-hf-embeddings"
                className="w-full h-[calc(100vh-250px)] border-0"
                title="HuggingFace Embeddings Test"
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
