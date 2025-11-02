"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Play, Pause, Volume2, VolumeX } from "lucide-react";

interface VideoResultCardProps {
  videoId?: string;
  userId?: string;
  videoUrl?: string;
  videoBase64?: string;
  duration?: number;
  frames?: number;
  fps?: number;
  fileSize?: number;
  format?: string;
  width?: number;
  height?: number;
  generationTime?: number;
  prompt: string;
}

export function VideoResultCard({
  videoUrl,
  videoBase64,
  duration,
  frames,
  fps,
  fileSize,
  format,
  width,
  height,
  generationTime,
  prompt,
}: VideoResultCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Determine video source with proper MIME type detection
  const videoSrc = videoUrl || (videoBase64 ? `data:video/mp4;base64,${videoBase64}` : null);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setVideoDuration(videoRef.current.duration);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const downloadVideo = () => {
    const link = document.createElement("a");

    if (videoBase64) {
      // Download from base64
      link.href = `data:video/${format};base64,${videoBase64}`;
    } else if (videoUrl) {
      // Download from URL
      link.href = videoUrl;
    }

    link.download = `video-${Date.now()}.${format}`;
    link.click();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">
          Generated Video
        </h3>
        <p className="text-xs text-muted-foreground truncate max-w-md">
          {prompt}
        </p>
      </div>

      {/* Video Card */}
      <div className="relative group">
        <div className="relative w-[600px] h-[400px] rounded-lg shadow-lg overflow-hidden bg-black">
          {/* Border decorations - matching style */}
          <div className="absolute top-2 left-2 w-4 h-4 border border-gray-400 dark:border-gray-300 z-10" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border border-gray-400 dark:border-gray-300 z-10" />
          <div className="absolute top-2 right-2 w-4 h-4 border border-gray-400 dark:border-gray-300 z-10" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border border-gray-400 dark:border-gray-300 z-10" />

          {/* Video Player */}
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={(e) => {
                console.error('Video error:', e);
                const target = e.target as HTMLVideoElement;
                console.error(`Video error: ${target.error?.message || 'Unknown error'}`);
              }}
              loop
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <p className="text-center">No video source available</p>
            </div>
          )}

          {/* Video Controls Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Play/Pause Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="lg"
                onClick={togglePlay}
                className="gap-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {/* Progress Bar */}
              <div className="mb-2">
                <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all"
                    style={{ width: `${(currentTime / (duration || videoDuration || 1)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration || videoDuration || 0)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>

                {/* Download Button */}
                <Button
                  size="sm"
                  onClick={downloadVideo}
                  className="gap-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Stats */}
      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>
          Size: {width}x{height} • Duration: {(duration || videoDuration || 0).toFixed(1)}s • Format: {format?.toUpperCase()}
        </p>
        <p>
          Frames: {frames} • FPS: {fps} • File: {((fileSize || 0) / 1024 / 1024).toFixed(1)} MB
          {generationTime && ` • Generated in ${(generationTime / 1000).toFixed(1)}s`}
        </p>
      </div>
    </div>
  );
}