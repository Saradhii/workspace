"use client";

import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/radix/tabs";
import { Card } from "@/components/ui/card";
import { FileText, Brain, Sparkles, Workflow } from "lucide-react";
import { RAGStudioMain } from "./components/rag-studio-main";

export default function RAGStudioPage() {
  return (
    <div className="flex-1 pt-1 px-4 pb-4 md:pt-2 md:px-8 md:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">RAG Studio</h1>
          <p className="text-muted-foreground">
            All-in-one workspace for OCR, embeddings, and semantic search testing
          </p>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="studio" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="studio" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              <span>RAG Studio</span>
            </TabsTrigger>
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

          <TabsContents>
            <TabsContent value="studio" className="mt-0">
              <RAGStudioMain />
            </TabsContent>

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
          </TabsContents>
        </Tabs>
      </div>
    </div>
  );
}
