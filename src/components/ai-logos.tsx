import React from "react";
import {
  Qwen,
  Gemma,
  DeepSeek,
  Meta,
  Mistral,
  Grok,
  OpenAI,
  Google,
  Zhipu,
  Minimax,
  Kimi
} from "@lobehub/icons";

export const QwenLogo = ({ className }: { className?: string }) => {
  return <Qwen.Color className={className} />;
};

export const GemmaLogo = ({ className }: { className?: string }) => {
  return <Gemma.Color className={className} />;
};

export const DeepSeekLogo = ({ className }: { className?: string }) => {
  return <DeepSeek.Color className={className} />;
};

export const MetaIconOutline = ({ className }: { className?: string }) => {
  return <Meta.Color className={className} />;
};

export const MistralLogo = ({ className }: { className?: string }) => {
  return <Mistral.Color className={className} />;
};

export const GrokLogo = ({ className }: { className?: string }) => {
  return <Grok className={className} />;
};

export const OpenAILogo = ({ className }: { className?: string }) => {
  return <OpenAI className={className} />;
};

export const GoogleLogo = ({ className }: { className?: string }) => {
  return <Google className={className} />;
};

// Use Qwen for Tongyi/Alibaba as they're both Chinese AI companies
export const TongyiLogo = ({ className }: { className?: string }) => {
  return <Qwen.Color className={className} />;
};

// Generic AI logo for Chutes AI or other providers
export const GenericAILogo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );
};

export const ZhipuLogo = ({ className }: { className?: string }) => {
  return <Zhipu.Color className={className} />;
};

export const MinimaxLogo = ({ className }: { className?: string }) => {
  return <Minimax.Color className={className} />;
};

export const KimiLogo = ({ className }: { className?: string }) => {
  return <Kimi.Avatar className={className} size={16} />;
};

// Icon for Chroma - Custom created
export const ChromaLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6" fill="white"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
    </svg>
  );
};

// Icon for Neta-Lumina - Custom created
export const NetaLuminaLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2l-5 3.5v5L12 15l5-4.5v-5L12 2z" opacity="0.8"/>
      <path d="M7 10.5v5L12 20l5-4.5v-5L12 15l-5-4.5z" opacity="0.6"/>
      <path d="M12 15l5 4.5v-5L12 15z" opacity="0.9"/>
    </svg>
  );
};

// Icon for WAN Video - Custom created
export const WanLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <rect x="2" y="4" width="20" height="14" rx="2"/>
      <polygon points="10,8 16,12 10,16" fill="white"/>
      <circle cx="19" cy="17" r="2"/>
    </svg>
  );
};

// Icon for Arcee AI - Custom created
export const ArceeLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" opacity="0.9"/>
      <path d="M2 17l10 5 10-5M7 8.5h10M7 12h10" stroke="white" strokeWidth="1.5" fill="none"/>
    </svg>
  );
};

// Icon for Inception Labs - Custom created
export const InceptionLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="12" cy="12" r="10" opacity="0.8"/>
      <circle cx="12" cy="12" r="7" opacity="0.9"/>
      <circle cx="12" cy="12" r="4"/>
      <path d="M10 10h4v4h-4z" fill="white"/>
    </svg>
  );
};

// Icon for Agentica - Custom created
export const AgenticaLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      <path d="M8 12l2 2 6-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="20" cy="6" r="3" opacity="0.7"/>
    </svg>
  );
};