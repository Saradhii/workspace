"use client";

import React, { forwardRef, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, ExternalLink, FileText, Upload, Database, Search, MessageSquare, Lightbulb, Zap, ArrowRight, Cpu } from "lucide-react";
import { LlamaIndex, Nova, AdobeFirefly, LongCat, Nvidia, Minimax } from '@lobehub/icons';
import { Badge } from "@/components/ui/badge";
import { AuroraText } from "@/components/ui/aurora-text";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import Link from "next/link";

const CircularBeam = () => (
  <svg className="absolute inset-0 -z-10" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
        <stop offset="20%" stopColor="#3b82f6" stopOpacity="0.8" />
        <stop offset="30%" stopColor="#8b5cf6" stopOpacity="1" />
        <stop offset="40%" stopColor="#ec4899" stopOpacity="1" />
        <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
        <stop offset="60%" stopColor="#10b981" stopOpacity="1" />
        <stop offset="70%" stopColor="#ec4899" stopOpacity="0.8" />
        <stop offset="80%" stopColor="#8b5cf6" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
      </linearGradient>
    </defs>
    <circle
      cx="50"
      cy="50"
      r="48"
      fill="none"
      stroke="url(#beam-gradient)"
      strokeWidth="2"
      strokeDasharray="15 85"
      strokeDashoffset="0"
      transform="rotate(-90 50 50)"
    >
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        from="-90 50 50"
        to="270 50 50"
        dur="3s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode; gradient?: string }
>(({ className, children, gradient }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative z-10 flex size-12 items-center justify-center rounded-full bg-black shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      <div className="absolute inset-0 rounded-full border-2 border-white opacity-30"></div>
      <CircularBeam />
      {children}
    </div>
  );
});

Circle.displayName = "Circle";


export function AnimatedBeamDemo({
  className,
}: {
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLDivElement>(null);
  const dbRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const centerRef1 = useRef<HTMLDivElement>(null);
  const centerRef2 = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const insightRef = useRef<HTMLDivElement>(null);
  const minimaxRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn(
        "relative flex h-[300px] w-full items-center justify-center overflow-hidden p-10",
        className
      )}
      ref={containerRef}
    >
      <div className="relative flex size-full max-w-3xl items-center justify-between gap-8">
        {/* Left side - Data Input */}
        <div className="flex flex-col justify-center gap-5">
          <Circle ref={imageRef}>
            <img src="/image-svgrepo-com.svg" alt="Image" className="w-7 h-7" />
          </Circle>
          <Circle ref={uploadRef}>
            <img src="/ms-word-svgrepo-com.svg" alt="Word" className="w-7 h-7" />
          </Circle>
          <Circle ref={fileRef}>
            <img src="/acrobat-reader-svgrepo-com.svg" alt="PDF" className="w-7 h-7" />
          </Circle>
          <Circle ref={dbRef}>
            <img src="/ms-excel-svgrepo-com.svg" alt="Excel" className="w-7 h-7" />
          </Circle>
        </div>

        {/* Center - Two Processing Stages */}
        <div className="flex items-center justify-center gap-30">
          <Circle ref={centerRef1}>
            <LlamaIndex.Color size={28} />
          </Circle>
          <Circle ref={centerRef2}>
            <Nova.Color size={28} />
          </Circle>
        </div>

        {/* Right side - Output */}
        <div className="flex flex-col justify-center gap-6">
          <Circle ref={searchRef}>
            <Nvidia.Color size={28} />
          </Circle>
          <Circle ref={messageRef}>
            <AdobeFirefly.Color size={28} />
          </Circle>
          <Circle ref={insightRef}>
            <LongCat.Color size={28} />
          </Circle>
          <Circle ref={minimaxRef}>
            <Minimax.Color size={28} />
          </Circle>
        </div>
      </div>

      {/* Animated beams for linear pipeline flow */}
      {/* Left side - Input beams flowing inward */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={imageRef}
        toRef={centerRef1}
        curvature={0.3}
        duration={5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={uploadRef}
        toRef={centerRef1}
        curvature={0.15}
        delay={0.2}
        duration={5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={fileRef}
        toRef={centerRef1}
        curvature={0}
        delay={0.4}
        duration={5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={dbRef}
        toRef={centerRef1}
        curvature={-0.15}
        delay={0.6}
        duration={5}
      />

      {/* Center connection - Process 1 to Process 2 */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef1}
        toRef={centerRef2}
        curvature={0}
        delay={0.9}
        duration={5}
      />

      {/* Right side - Output beams flowing inward from Process 2 */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef2}
        toRef={searchRef}
        curvature={-0.25}
        delay={1.2}
        duration={5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef2}
        toRef={messageRef}
        curvature={-0.12}
        delay={1.5}
        duration={5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef2}
        toRef={insightRef}
        curvature={0}
        delay={1.8}
        duration={5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef2}
        toRef={minimaxRef}
        curvature={0.12}
        delay={2.1}
        duration={5}
      />
    </div>
  );
}

export default function RAGPage() {
  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 px-2 pt-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Vector Search &<br />
            <AuroraText
              colors={["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981"]}
              speed={1.5}
            >
              Augmented Generation
            </AuroraText>
            <br />
            on Your Data
          </h1>
        </div>

        {/* Animated Beam Demo */}
        <div className="mb-4 -mt-8">
          <AnimatedBeamDemo />
        </div>

        {/* Try RAG Studio Button */}
        <div className="flex justify-center mb-6">
          <Link href="/workspace/rag/studio">
            <HoverBorderGradient
              containerClassName="rounded-full"
              as="button"
              className="dark:bg-black bg-white cursor-pointer text-black dark:text-white flex items-center space-x-2 px-6 py-2 text-base font-semibold"
            >
              <Cpu className="h-4 w-4" />
              <span>Try RAG Studio</span>
              <ArrowRight className="h-4 w-4" />
            </HoverBorderGradient>
          </Link>
        </div>

        {/* Process Labels */}
        <div className="flex justify-center gap-8 mb-6 text-sm">
          <div className="text-center">
            <div className="font-semibold">
              <AuroraText
                colors={["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981"]}
                speed={1.5}
              >
                Input
              </AuroraText>
            </div>
            <div className="text-muted-foreground">Upload & Parse</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">
              <AuroraText
                colors={["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981"]}
                speed={1.5}
              >
                Process
              </AuroraText>
            </div>
            <div className="text-muted-foreground">Embed & Index</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">
              <AuroraText
                colors={["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981"]}
                speed={1.5}
              >
                Output
              </AuroraText>
            </div>
            <div className="text-muted-foreground">Search & Generate</div>
          </div>
        </div>

        {/* Description */}
        <div className="text-center mb-6 px-2">
          <p className="text-lg text-muted-foreground mb-4">
            Transform your documents into intelligent, searchable knowledge with AI-powered semantic understanding
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Vector Embeddings
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Brain className="w-3 h-3 mr-1" />
              Semantic Search
            </Badge>
          </div>
        </div>

        {/* Content will be added here as separate subpages */}

      </div>
    </div>
  );
}