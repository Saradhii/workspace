"use client";

import React from "react";
import { Sparkles } from "@/components/ui/sparkles";

export function HeroText() {
  return (
    <div className="relative z-10 mx-auto w-full max-w-4xl px-4">
      <div className="text-center">
        <h1 className="bg-opacity-50 bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-4xl font-bold text-transparent md:text-7xl">
          Your AI. Your Data.
        </h1>
        <div className="relative inline-block mt-4">
          <h1 className="bg-opacity-50 bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-4xl font-bold text-transparent md:text-7xl relative">
            One Workspace.
          </h1>
          <Sparkles count={20} />
        </div>
      </div>
    </div>
  );
}