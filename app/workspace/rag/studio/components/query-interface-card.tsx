"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Search, Sparkles, Send, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface QueryInterfaceCardProps {
  onStatusChange?: (status: string) => void;
  onSearchComplete?: (results: any) => void;
}

export function QueryInterfaceCard({ onStatusChange, onSearchComplete }: QueryInterfaceCardProps) {
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState([5]);
  const [minScore, setMinScore] = useState("0.0");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [lastLatency, setLastLatency] = useState<number | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a query');
      return;
    }

    setIsSearching(true);
    setError(null);
    onStatusChange?.("processing");

    const startTime = Date.now();

    try {
      const response = await fetch('/api/rag/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          topK: topK[0],
          minScore: parseFloat(minScore) || 0.0,
          model: 'all-MiniLM-L6-v2',
          provider: 'ollama',
          llmModel: 'gpt-oss:20b',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate answer');
      }

      const latency = Date.now() - startTime;
      setLastQuery(query);
      setLastLatency(latency);

      // Pass results to ResultsCard
      onSearchComplete?.(result);

      toast.success(`Found ${result.retrievedChunks?.length || 0} relevant chunks`);

      onStatusChange?.("active");

    } catch (error) {
      console.error('Error searching:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to search';
      setError(errorMessage);
      toast.error(errorMessage);
      onStatusChange?.("idle");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-emerald-500" />
              Query Interface
            </CardTitle>
            <CardDescription>Search and get AI-powered answers</CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            RAG
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="query" className="text-sm font-medium">
            Query
          </Label>
          <div className="relative">
            <Input
              id="query"
              placeholder="What is Retrieval-Augmented Generation?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pr-10"
              disabled={isSearching}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            Press Enter or click Search to get AI-powered answers
          </p>
        </div>

        {/* Top-K Results */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Top-K Results</Label>
            <Badge variant="secondary" className="font-mono text-xs">
              {topK[0]}
            </Badge>
          </div>
          <Slider
            value={topK}
            onValueChange={setTopK}
            min={1}
            max={20}
            step={1}
            className="w-full"
            disabled={isSearching}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>20</span>
          </div>
        </div>

        <Separator />

        {/* Advanced Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Filters</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border p-2 space-y-1">
              <div className="text-xs text-muted-foreground">Min Score</div>
              <Input
                type="number"
                placeholder="0.0"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                className="h-7 text-xs"
                step="0.1"
                min="0"
                max="1"
                disabled={isSearching}
              />
            </div>
            <div className="rounded-lg border p-2 space-y-1">
              <div className="text-xs text-muted-foreground">Model</div>
              <div className="h-7 flex items-center text-xs font-medium">
                MiniLM-L6-v2
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3">
            <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Error</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          className="w-full"
          size="sm"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Answer...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Search & Generate Answer
            </>
          )}
        </Button>

        {/* Quick Stats */}
        {(lastQuery || lastLatency) && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            {lastQuery && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Last Query</span>
                <span className="font-medium truncate max-w-[150px]">{lastQuery}</span>
              </div>
            )}
            {lastLatency && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Latency</span>
                <span className="font-medium text-green-600">{lastLatency}ms</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
