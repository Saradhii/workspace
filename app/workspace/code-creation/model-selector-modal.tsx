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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CpuIcon, ChevronDownIcon } from "../image-creation/icons";
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
          <RadioGroup value={tempSelectedModel} onValueChange={setTempSelectedModel}>
            {models.map((model) => (
              <div key={model.id} className="space-y-2">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value={model.id} id={model.id} />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={model.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {model.display_name}
                      {model.specialty === "code_generation" && (
                        <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Best for Code
                        </span>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {model.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Provider: {model.provider}</span>
                      <span>Context: {model.context_length.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>

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