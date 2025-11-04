"use client";
import { animate } from "framer-motion";
import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { QwenLogo, MistralLogo, OpenAILogo, GemmaLogo, MetaIconOutline } from "./ai-logos";

export default function AIModelsCard() {
  return <Skeleton />;
}

const Skeleton = () => {
  const scale = [1, 1.1, 1];
  const transform = ["translateY(0px)", "translateY(-4px)", "translateY(0px)"];
  const sequence = [
    [
      ".circle-1",
      {
        scale,
        transform,
      },
      { duration: 0.8 },
    ],
    [
      ".circle-2",
      {
        scale,
        transform,
      },
      { duration: 0.8 },
    ],
    [
      ".circle-3",
      {
        scale,
        transform,
      },
      { duration: 0.8 },
    ],
    [
      ".circle-4",
      {
        scale,
        transform,
      },
      { duration: 0.8 },
    ],
    [
      ".circle-5",
      {
        scale,
        transform,
      },
      { duration: 0.8 },
    ],
  ];

  useEffect(() => {
    animate(sequence, {
      // @ts-expect-error - animate function accepts repeat option but types might not be updated
      repeat: Infinity,
      repeatDelay: 1,
    });
  }, []);

  return (
    <div className="p-8 overflow-hidden relative flex items-center justify-center">
      <div className="flex flex-row shrink-0 justify-center items-center gap-3">
        <Container className="h-[41.6px] w-[41.6px] circle-1">
          <QwenLogo className="h-[20.8px] w-[20.8px]" />
        </Container>
        <Container className="h-[62.4px] w-[62.4px] circle-2">
          <GemmaLogo className="h-[31.2px] w-[31.2px]" />
        </Container>
        <Container className="h-[83.2px] w-[83.2px] circle-3">
          <OpenAILogo className="h-[41.6px] w-[41.6px] dark:text-white" />
        </Container>
        <Container className="h-[62.4px] w-[62.4px] circle-4">
          <MetaIconOutline className="h-[31.2px] w-[31.2px]" />
        </Container>
        <Container className="h-[41.6px] w-[41.6px] circle-5">
          <MistralLogo className="h-[20.8px] w-[20.8px]" />
        </Container>
      </div>
    </div>
  );
};


export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "max-w-sm w-full mx-auto p-8 rounded-xl border border-[rgba(255,255,255,0.10)] dark:bg-[rgba(40,40,40,0.70)] bg-gray-100 shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset] group",
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h3
      className={cn(
        "text-lg font-semibold text-gray-800 dark:text-white py-2",
        className
      )}
    >
      {children}
    </h3>
  );
};

export const CardDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p
      className={cn(
        "text-sm font-normal text-neutral-600 dark:text-neutral-400 max-w-sm",
        className
      )}
    >
      {children}
    </p>
  );
};


const Container = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        `h-16 w-16 rounded-full flex items-center justify-center bg-[rgba(248,248,248,0.01)]
    shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset,0px_32px_24px_-16px_rgba(0,0,0,0.40)]
    `,
        className
      )}
    >
      {children}
    </div>
  );
};

