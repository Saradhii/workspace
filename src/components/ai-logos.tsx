import React from "react";
import {
  Qwen,
  Gemma,
  OpenAI,
  Meta,
  Mistral,
  Grok
} from "@lobehub/icons";

export const QwenLogo = ({ className }: { className?: string }) => {
  return <Qwen.Color className={className} />;
};

export const GemmaLogo = ({ className }: { className?: string }) => {
  return <Gemma.Color className={className} />;
};

export const OpenAILogo = ({ className }: { className?: string }) => {
  return <OpenAI className={className} />;
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