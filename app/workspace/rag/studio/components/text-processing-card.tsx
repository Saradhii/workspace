"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Scissors, Eye, Settings2 } from "lucide-react";

interface TextProcessingCardProps {
  onStatusChange?: (status: string) => void;
}

export function TextProcessingCard({ onStatusChange }: TextProcessingCardProps) {
  const [chunkSize, setChunkSize] = useState([512]);
  const [chunkOverlap, setChunkOverlap] = useState([50]);
  const [strategy, setStrategy] = useState("recursive");
  const [showPreview, setShowPreview] = useState(false);

  const mockChunks = [
    {
      id: 1,
      text: "Retrieval-Augmented Generation (RAG) is an AI framework that combines the power of large language models with external knowledge bases...",
      tokens: 487,
    },
    {
      id: 2,
      text: "The process involves three main steps: retrieval of relevant documents, augmentation of the prompt with retrieved context...",
      tokens: 502,
    },
    {
      id: 3,
      text: "Vector databases play a crucial role in RAG systems by enabling efficient similarity search across embedded document chunks...",
      tokens: 495,
    },
  ];

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
          <Badge variant="outline" className="flex items-center gap-1">
            <Settings2 className="h-3 w-3" />
            Config
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
              <SelectItem value="recursive">Recursive Character</SelectItem>
              <SelectItem value="token">Token-based</SelectItem>
              <SelectItem value="semantic">Semantic</SelectItem>
              <SelectItem value="sentence">Sentence-based</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chunk Size */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Chunk Size</Label>
            <Badge variant="secondary" className="font-mono text-xs">
              {chunkSize[0]} tokens
            </Badge>
          </div>
          <Slider
            value={chunkSize}
            onValueChange={setChunkSize}
            min={128}
            max={2048}
            step={64}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>128</span>
            <span>2048</span>
          </div>
        </div>

        {/* Chunk Overlap */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Chunk Overlap</Label>
            <Badge variant="secondary" className="font-mono text-xs">
              {chunkOverlap[0]} tokens
            </Badge>
          </div>
          <Slider
            value={chunkOverlap}
            onValueChange={setChunkOverlap}
            min={0}
            max={200}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>200</span>
          </div>
        </div>

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

          {showPreview && (
            <ScrollArea className="h-[140px] rounded-md border p-3 bg-muted/30">
              <div className="space-y-3">
                {mockChunks.map((chunk) => (
                  <div key={chunk.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Chunk {chunk.id}</span>
                      <Badge variant="outline" className="text-xs">
                        {chunk.tokens} tokens
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {chunk.text}
                    </p>
                    {chunk.id < mockChunks.length && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
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
