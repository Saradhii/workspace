"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Search, Sparkles, Send, Loader2 } from "lucide-react";

interface QueryInterfaceCardProps {
  onStatusChange?: (status: string) => void;
}

export function QueryInterfaceCard({ onStatusChange }: QueryInterfaceCardProps) {
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState("similarity");
  const [topK, setTopK] = useState([5]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;

    setIsSearching(true);
    onStatusChange?.("processing");

    setTimeout(() => {
      setIsSearching(false);
      onStatusChange?.("active");
    }, 1500);
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
            <CardDescription>Search your knowledge base</CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Search
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
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Search Mode */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Search Mode</Label>
          <ToggleGroup
            type="single"
            value={searchMode}
            onValueChange={(value) => value && setSearchMode(value)}
            className="grid grid-cols-3 gap-2"
          >
            <ToggleGroupItem
              value="similarity"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs"
            >
              Similarity
            </ToggleGroupItem>
            <ToggleGroupItem
              value="hybrid"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs"
            >
              Hybrid
            </ToggleGroupItem>
            <ToggleGroupItem
              value="semantic"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs"
            >
              Semantic
            </ToggleGroupItem>
          </ToggleGroup>
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
                placeholder="0.7"
                className="h-7 text-xs"
                step="0.1"
                min="0"
                max="1"
              />
            </div>
            <div className="rounded-lg border p-2 space-y-1">
              <div className="text-xs text-muted-foreground">Max Results</div>
              <Input
                type="number"
                placeholder="100"
                className="h-7 text-xs"
              />
            </div>
          </div>
        </div>

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
              Searching...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Search Knowledge Base
            </>
          )}
        </Button>

        {/* Quick Stats */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Last Query</span>
            <span className="font-medium">2 min ago</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Avg. Latency</span>
            <span className="font-medium text-green-600">143ms</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
