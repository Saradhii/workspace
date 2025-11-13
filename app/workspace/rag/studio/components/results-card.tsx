"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Copy, ThumbsUp, ThumbsDown, Clock, Zap, FileText } from "lucide-react";
import { toast } from "sonner";

interface ResultsCardProps {
  onStatusChange?: (status: string) => void;
  searchResults?: any;
}

export function ResultsCard({ onStatusChange, searchResults }: ResultsCardProps) {
  const [selectedChunk, setSelectedChunk] = useState<number | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  const handleCopyAnswer = () => {
    if (searchResults?.answer) {
      navigator.clipboard.writeText(searchResults.answer);
      setCopiedAnswer(true);
      toast.success('Answer copied to clipboard');
      setTimeout(() => setCopiedAnswer(false), 2000);
    }
  };

  const hasResults = searchResults && searchResults.retrievedChunks && searchResults.retrievedChunks.length > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-pink-500" />
              Results & Analytics
            </CardTitle>
            <CardDescription>Retrieved context and AI-generated answer</CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {hasResults ? 'Live' : 'Idle'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasResults ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No results yet. Start by searching in the Query Interface.
            </p>
          </div>
        ) : (
          <>
            {/* Retrieved Chunks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Retrieved Chunks</span>
                <Badge variant="secondary">{searchResults.retrievedChunks.length} results</Badge>
              </div>

              <ScrollArea className="h-[140px] rounded-md border">
                <div className="p-2 space-y-2">
                  {searchResults.retrievedChunks.map((result: any, index: number) => (
                    <div
                      key={result.id}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedChunk(selectedChunk === index ? null : index)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge variant="outline" className="text-xs font-mono flex-shrink-0">
                            {result.score.toFixed(3)}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate">
                            <FileText className="h-3 w-3 inline mr-1" />
                            {result.fileName || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed line-clamp-2">
                        {result.text}
                      </p>
                      {selectedChunk === index && (
                        <>
                          <Separator className="my-2" />
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {result.text}
                          </p>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Chunk #{result.chunkIndex} • Similarity: {(result.score * 100).toFixed(1)}%
                          </div>
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
              <span className="text-sm font-medium">AI-Generated Answer</span>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {searchResults.answer}
                </p>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {searchResults.performance?.totalTimeMs && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {searchResults.performance.totalTimeMs}ms
                      </div>
                    )}
                    {searchResults.metadata?.tokensUsed && (
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {searchResults.metadata.tokensUsed} tokens
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={handleCopyAnswer}
                      title="Copy answer"
                    >
                      <Copy className={`h-3 w-3 ${copiedAnswer ? 'text-green-500' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            {searchResults.performance && (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <div className="text-xs text-muted-foreground">Relevance</div>
                  <p className="text-lg font-bold text-green-600">
                    {searchResults.retrievedChunks[0]?.score
                      ? (searchResults.retrievedChunks[0].score * 100).toFixed(0)
                      : '0'}%
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <div className="text-xs text-muted-foreground">Chunks</div>
                  <p className="text-lg font-bold text-blue-600">
                    {searchResults.retrievedChunks.length}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <div className="text-xs text-muted-foreground">Speed</div>
                  <p className="text-lg font-bold text-purple-600">
                    {((searchResults.performance.totalTimeMs || 0) / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>
            )}

            {/* Query Info */}
            {searchResults.query && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Query</span>
                  <span className="font-medium">{searchResults.query}</span>
                </div>
                {searchResults.metadata?.llmModel && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-medium">{searchResults.metadata.llmModel}</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
