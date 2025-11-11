"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Database, CheckCircle2, XCircle, RefreshCw, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VectorStoreCardProps {
  onStatusChange?: (status: string) => void;
}

export function VectorStoreCard({ onStatusChange }: VectorStoreCardProps) {
  const [database, setDatabase] = useState("pinecone");
  const [isConnected, setIsConnected] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    onStatusChange?.("processing");

    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      onStatusChange?.("active");
    }, 1500);
  };

  const databases = [
    { value: "pinecone", label: "Pinecone" },
    { value: "weaviate", label: "Weaviate" },
    { value: "qdrant", label: "Qdrant" },
    { value: "chroma", label: "Chroma" },
    { value: "milvus", label: "Milvus" },
    { value: "pgvector", label: "PGVector" },
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Vector Store
            </CardTitle>
            <CardDescription>Manage vector database</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-1 text-green-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <CheckCircle2 className="h-4 w-4" />
              </div>
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Database Selection */}
        <div className="space-y-2">
          <Label htmlFor="database" className="text-sm font-medium">
            Vector Database
          </Label>
          <Select value={database} onValueChange={setDatabase}>
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
        </div>

        {/* Connection Status */}
        <div className="space-y-3">
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection Status</span>
              <Badge
                variant={isConnected ? "default" : "destructive"}
                className={cn(
                  "text-xs",
                  isConnected && "bg-green-500 hover:bg-green-600"
                )}
              >
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            {isConnected && (
              <>
                <Separator />
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Collection:</span>
                    <span className="font-medium text-foreground">rag-documents</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Endpoint:</span>
                    <span className="font-medium text-foreground">us-east-1</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {!isConnected && (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
              size="sm"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          )}
        </div>

        <Separator />

        {/* Index Statistics */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Index Statistics</Label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              <div className="text-xs text-muted-foreground">Vectors</div>
              <p className="text-xl font-bold font-mono">1,247</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              <div className="text-xs text-muted-foreground">Dimensions</div>
              <p className="text-xl font-bold font-mono">1536</p>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Storage Used</span>
              <span className="font-medium">12.4 MB</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: "34%" }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>34% of quota</span>
              <span>36.8 MB available</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            Sync
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs">
            <BarChart3 className="h-3 w-3 mr-1" />
            Stats
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
