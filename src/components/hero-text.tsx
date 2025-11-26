"use client";

import React from "react";
import { Cover } from "@/components/ui/cover";

export function HeroText() {
  return (
    <div className="relative z-10 mx-auto w-full max-w-4xl px-4">
      <div className="text-center">
        <h1 className="bg-opacity-50 mb-3 bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-4xl font-bold text-transparent md:text-6xl">
        Your data. Your Open Model.
        </h1>
        <h1 className="bg-opacity-50 bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-4xl font-bold text-transparent md:text-7xl mt-4">
          <Cover>One Workspace</Cover>
        </h1>
      </div>
    </div>
  );
}