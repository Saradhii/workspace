"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings } from "lucide-react";
import type { VideoParams } from "@/types/components";

interface VideoSettingsPopoverProps {
  videoParams: VideoParams;
  setVideoParams: (params: VideoParams) => void;
}

export function VideoSettingsPopover({
  videoParams,
  setVideoParams,
}: VideoSettingsPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="aspect-square h-8 rounded-lg p-1 transition-colors hover:bg-accent"
          title="Advanced Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-4" align="end">
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Video Settings</h3>

          {/* Frames */}
          <div className="space-y-2">
            <Label className="text-xs">Frames: {videoParams.frames}</Label>
            <Slider
              value={[videoParams.frames]}
              onValueChange={([value]) => setVideoParams({ ...videoParams, frames: value })}
              min={21}
              max={140}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              More frames = longer video
            </p>
          </div>

          {/* FPS */}
          <div className="space-y-2">
            <Label className="text-xs">FPS: {videoParams.fps}</Label>
            <Slider
              value={[videoParams.fps]}
              onValueChange={([value]) => setVideoParams({ ...videoParams, fps: value })}
              min={16}
              max={24}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher FPS = smoother motion
            </p>
          </div>

          {/* Resolution */}
          <div className="space-y-2">
            <Label className="text-xs">Resolution</Label>
            <Select
              value={videoParams.resolution}
              onValueChange={(value: "480p" | "720p") =>
                setVideoParams({ ...videoParams, resolution: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="480p">480p (Faster)</SelectItem>
                <SelectItem value="720p">720p (Higher Quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Generation Speed */}
          <div className="space-y-2">
            <Label className="text-xs">Generation Speed</Label>
            <Select
              value={videoParams.fast ? "fast" : "quality"}
              onValueChange={(value) =>
                setVideoParams({ ...videoParams, fast: value === "fast" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fast">Fast Mode</SelectItem>
                <SelectItem value="quality">Quality Mode</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Guidance Scale */}
          <div className="space-y-2">
            <Label className="text-xs">Guidance Scale: {videoParams.guidanceScale.toFixed(1)}</Label>
            <Slider
              value={[videoParams.guidanceScale]}
              onValueChange={([value]) => setVideoParams({ ...videoParams, guidanceScale: value })}
              min={0.0}
              max={3.0}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Controls how closely to follow the prompt
            </p>
          </div>

          {/* Summary */}
          <div className="text-xs text-muted-foreground p-3 bg-background rounded-lg border">
            <p className="font-medium mb-1">Video Summary:</p>
            <ul className="space-y-1">
              <li>• Duration: {(videoParams.frames / videoParams.fps).toFixed(1)}s</li>
              <li>• Size: {videoParams.resolution === "720p" ? "1280x720" : "854x480"}</li>
              <li>• Mode: {videoParams.fast ? "Fast Generation" : "High Quality"}</li>
              <li>• Est. time: 1-5 minutes</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}