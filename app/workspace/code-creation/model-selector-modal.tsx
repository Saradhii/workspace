"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Checkbox,
  type CheckboxProps,
} from "@/components/animate-ui/components/headless/checkbox";
import { CpuIcon, ChevronDownIcon } from "../image-creation/icons";
import { QwenLogo, DeepSeekLogo, ZhipuLogo } from "@/components/ai-logos";
import type { CodeModel } from '@/types/models';

// Re-export for convenience
export type { CodeModel } from '@/types/models';

interface ModelSelectorModalProps {
  selectedModel: string;
  onSelectionChange: (model: string) => void;
  trigger?: React.ReactNode;
  models: CodeModel[];
  title?: string;
}

export function CodeModelSelectorModal({
  selectedModel,
  onSelectionChange,
  trigger,
  models,
  title = "Select Code Generation Model",
}: ModelSelectorModalProps) {
  const [open, setOpen] = useState(false);
  const [tempSelectedModel, setTempSelectedModel] = useState(selectedModel);

  useEffect(() => {
    setTempSelectedModel(selectedModel);
  }, [selectedModel]);

  const handleApply = () => {
    onSelectionChange(tempSelectedModel);
    setOpen(false);
  };

  const getSelectedModelInfo = () => {
    const model = models.find(m => m.id === selectedModel);
    return model ? model.display_name : "Select model";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            className="flex h-8 items-center gap-2 rounded-lg border-0 bg-background px-2 text-foreground shadow-none transition-colors hover:bg-accent focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            type="button"
          >
            <CpuIcon size={16} />
            <span className="hidden font-medium text-xs sm:block">
              {getSelectedModelInfo()}
            </span>
            <ChevronDownIcon size={16} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CpuIcon size={20} />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Model Selection */}
          <div className="space-y-3">
            {models.map((model) => (
              <Label key={model.id} className="flex items-center gap-x-3 cursor-pointer">
                <Checkbox
                  variant="accent"
                  size="sm"
                  checked={tempSelectedModel === model.id}
                  onChange={() => setTempSelectedModel(model.id)}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {model.icon && <model.icon className="w-4 h-4" />}
                    <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {model.display_name || model.displayName}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {model.description}
                  </p>
                </div>
              </Label>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleApply}
              disabled={!tempSelectedModel}
              size="sm"
            >
              Apply Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}