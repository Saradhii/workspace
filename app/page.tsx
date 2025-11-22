"use client";

import DottedGlowBackground from "@/components/ui/dotted-glow-background"
import { HeroText } from "@/components/hero-text"
import AIModelsCard from "@/components/ai-models-card"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter();

  return (
    <div className="bg-background relative h-screen w-full overflow-hidden">
      {/* Dashed border frame with overlapping corners */}
      {/* Top border - extends full screen width */}
      <div
        className="absolute border-t-2 border-dashed border-white pointer-events-none z-20"
        style={{
          top: '90px',
          left: '0px',
          right: '0px',
          height: 0
        }}
      />

      {/* Bottom border - extends full screen width */}
      <div
        className="absolute border-t-2 border-dashed border-white pointer-events-none z-20"
        style={{
          bottom: '90px',
          left: '0px',
          right: '0px',
          height: 0
        }}
      />

      {/* Left border - overlaps horizontal borders and extends full height */}
      <div
        className="absolute border-l-2 border-dashed border-white pointer-events-none z-20"
        style={{
          left: '250px',
          top: '0px',
          bottom: '0px',
          width: 0
        }}
      />

      {/* Right border - overlaps horizontal borders and extends full height */}
      <div
        className="absolute border-r-2 border-dashed border-white pointer-events-none z-20"
        style={{
          right: '250px',
          top: '0px',
          bottom: '0px',
          width: 0
        }}
      />

      <DottedGlowBackground
        className="pointer-events-none mask-radial-to-90% mask-radial-at-center opacity-20 dark:opacity-100"
        opacity={0.3}
        gap={10}
        radius={1.6}
        colorLightVar="--color-neutral-500"
        glowColorLightVar="--color-neutral-600"
        colorDarkVar="--color-neutral-500"
        glowColorDarkVar="--color-sky-800"
        backgroundOpacity={0}
        speedMin={0.3}
        speedMax={1.6}
        speedScale={1}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-8">
        {/* Hero Text Section */}
        <HeroText />

        {/* AI Models Animation Section */}
        <AIModelsCard />

        {/* Get Started Button */}
        <ShimmerButton
          className="shadow-2xl"
          onClick={() => router.push("/workspace")}
        >
          <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
            Try Now
          </span>
        </ShimmerButton>
      </div>
    </div>
  );
}