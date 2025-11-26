"use client";

import React from 'react';
import { IconBrain, IconCode, IconSparkles, IconTerminal, IconFileText, IconDeviceDesktop } from '@tabler/icons-react';

export function Gemini({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L2 7V12C2 16.5 4.23 20.68 7.62 23.15L12 21L16.38 23.15C19.77 20.68 22 16.5 22 12V7L12 2Z"
        fill="currentColor"
      />
      <path
        d="M9 11L7 13L9 15M15 11L17 13L15 15M13 9L11 17"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Replit({ className }: { className?: string }) {
  return (
    <IconCode className={className} />
  );
}

export function MagicUI({ className }: { className?: string }) {
  return (
    <IconSparkles className={className} />
  );
}

export function VSCodium({ className }: { className?: string }) {
  return (
    <IconTerminal className={className} />
  );
}

export function MediaWiki({ className }: { className?: string }) {
  return (
    <IconFileText className={className} />
  );
}

export function GooglePaLM({ className }: { className?: string }) {
  return (
    <IconDeviceDesktop className={className} />
  );
}