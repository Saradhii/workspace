"use client";

import DottedGlowBackground from "@/components/ui/dotted-glow-background"
import { TubesCursor } from "@/components/ui/tubes-cursor"
import { HeroText } from "@/components/hero-text"
import AIModelsCard from "@/components/ai-models-card"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter();

  return (
    <div className="bg-background relative h-screen w-full overflow-hidden">
      {/* 3D Tubes Cursor Effect - Bottom Layer (Follows Mouse, Click to Change Colors) */}
      <TubesCursor
        tubeColors={["#f967fb", "#53bc28", "#6958d5"]}
        lightColors={["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"]}
        lightIntensity={600}
        enableClickColorChange={true}
        disableOnMobile={false}
      />

      {/* Dotted Background Effect - Middle Layer */}
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