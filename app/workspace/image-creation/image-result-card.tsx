"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ImageResultCardProps {
  imageBase64: string;
  format: string;
  width: number;
  height: number;
  modelName: string;
  modelDisplayName: string;
  generationTime?: number;
  onDownload: () => void;
}

export function ImageResultCard({
  imageBase64,
  format,
  width,
  height,
  modelName,
  modelDisplayName,
  generationTime,
  onDownload,
}: ImageResultCardProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Model Label */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">
          {modelDisplayName}
        </h3>
        <p className="text-xs text-muted-foreground">
          Model: {modelName}
        </p>
      </div>

      {/* Image Card */}
      <div className="relative group">
        <div className="relative w-[600px] h-[400px] rounded-lg shadow-lg overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900" />

          {/* Image */}
          <div className="relative z-10 w-full h-full">
            <img
              src={`data:image/${format};base64,${imageBase64}`}
              alt={`Generated with ${modelDisplayName}`}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Download button overlay */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <Button
              size="sm"
              onClick={onDownload}
              className="gap-2 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-800"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>
          Size: {width}x{height} • Format: {format?.toUpperCase()}
          {generationTime && ` • ${(generationTime / 1000).toFixed(1)}s`}
        </p>
      </div>
    </div>
  );
}