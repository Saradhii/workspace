"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Copy, ThumbsUp, ThumbsDown, Clock, Zap } from "lucide-react";

interface ResultsCardProps {
  onStatusChange?: (status: string) => void;
}

export function ResultsCard({ onStatusChange }: ResultsCardProps) {
  const [selectedChunk, setSelectedChunk] = useState<number | null>(null);

  const mockResults = [
    {
      id: 1,
      text: "Retrieval-Augmented Generation (RAG) is an AI framework that combines the power of large language models with external knowledge bases. It enables more accurate and contextual responses by retrieving relevant information before generating answers.",
      score: 0.94,
      source: "research-paper.pdf",
      page: 3,
    },
    {
      id: 2,
      text: "The RAG pipeline consists of three main stages: document retrieval, context augmentation, and response generation. This approach significantly reduces hallucinations in LLM outputs.",
      score: 0.89,
      source: "documentation.md",
      page: 1,
    },
    {
      id: 3,
      text: "Vector databases play a crucial role in RAG systems by enabling efficient similarity search. They store embeddings and allow for fast retrieval of semantically similar content.",
      score: 0.86,
      source: "research-paper.pdf",
      page: 7,
    },
  ];

  const mockResponse = {
    text: "Retrieval-Augmented Generation (RAG) is an advanced AI framework that enhances large language models by integrating external knowledge bases. The system works through a three-stage pipeline: first retrieving relevant documents, then augmenting the context, and finally generating accurate responses. This approach significantly reduces hallucinations and improves answer quality by grounding responses in verified information.",
    tokens: 87,
    latency: 1240,
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-pink-500" />
              Results & Analytics
            </CardTitle>
            <CardDescription>Retrieved context and generated response</CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Retrieved Chunks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Retrieved Chunks</span>
            <Badge variant="secondary">{mockResults.length} results</Badge>
          </div>

          <ScrollArea className="h-[140px] rounded-md border">
            <div className="p-2 space-y-2">
              {mockResults.map((result) => (
                <div
                  key={result.id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedChunk(selectedChunk === result.id ? null : result.id)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono">
                        {result.score.toFixed(2)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {result.source} • p{result.page}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed line-clamp-2">
                    {result.text}
                  </p>
                  {selectedChunk === result.id && (
                    <>
                      <Separator className="my-2" />
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {result.text}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Generated Response */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Generated Response</span>
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-sm leading-relaxed">
              {mockResponse.text}
            </p>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {mockResponse.latency}ms
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {mockResponse.tokens} tokens
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <ThumbsDown className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <div className="text-xs text-muted-foreground">Relevance</div>
            <p className="text-lg font-bold text-green-600">94%</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <div className="text-xs text-muted-foreground">Quality</div>
            <p className="text-lg font-bold text-blue-600">4.2/5</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <div className="text-xs text-muted-foreground">Speed</div>
            <p className="text-lg font-bold text-purple-600">1.2s</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
