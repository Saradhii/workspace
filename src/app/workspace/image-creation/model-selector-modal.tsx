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
import { Checkbox } from "@/components/ui/checkbox";
import { CpuIcon, ChevronDownIcon } from "./icons";

export interface ImageModel {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
}

export const imageModels: ImageModel[] = [
  {
    id: "chroma",
    name: "chroma",
    displayName: "Chroma",
    description: "Fast and efficient image generation",
    color: "text-pink-500",
  },
  {
    id: "neta-lumina",
    name: "neta-lumina",
    displayName: "Neta-Lumina",
    description: "High-quality detailed image generation",
    color: "text-emerald-500",
  },
];

interface ModelSelectorModalProps {
  selectedModels: string[];
  onSelectionChange: (models: string[]) => void;
  trigger?: React.ReactNode;
  models: ImageModel[];
  title?: string;
}

export function ModelSelectorModal({
  selectedModels,
  onSelectionChange,
  trigger,
  models,
  title = "Select Image Generation Models",
}: ModelSelectorModalProps) {
  const [open, setOpen] = useState(false);
  const [tempSelectedModels, setTempSelectedModels] = useState<string[]>(selectedModels);

  useEffect(() => {
    setTempSelectedModels(selectedModels);
  }, [selectedModels]);

  const handleModelToggle = (modelId: string, checked: boolean) => {
    if (checked) {
      setTempSelectedModels([...tempSelectedModels, modelId]);
    } else {
      setTempSelectedModels(tempSelectedModels.filter(id => id !== modelId));
    }
  };

  const handleSelectAll = () => {
    setTempSelectedModels(models.map(model => model.id));
  };

  const handleClearAll = () => {
    setTempSelectedModels([]);
  };

  const handleApply = () => {
    onSelectionChange(tempSelectedModels);
    setOpen(false);
  };

  const getSelectedModelNames = () => {
    return selectedModels.map(id =>
      models.find(model => model.id === id)?.displayName
    ).filter(Boolean).join(", ");
  };

  const selectedCount = selectedModels.length;

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
              {selectedCount === 0
                ? "Select models"
                : selectedCount === 1
                ? getSelectedModelNames()
                : `${selectedCount} models selected`
              }
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
              <div key={model.id} className="flex items-start space-x-3">
                <Checkbox
                  id={model.id}
                  checked={tempSelectedModels.includes(model.id)}
                  onCheckedChange={(checked) =>
                    handleModelToggle(model.id, checked as boolean)
                  }
                />
                <div className="flex-1 space-y-1">
                  <label
                    htmlFor={model.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                  >
                    <span className={model.color}>{model.displayName}</span>
                    <span className="text-xs text-muted-foreground">({model.name})</span>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {model.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={tempSelectedModels.length === models.length}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={tempSelectedModels.length === 0}
              >
                Clear All
              </Button>
            </div>
            <Button
              onClick={handleApply}
              disabled={tempSelectedModels.length === 0}
              size="sm"
            >
              Apply ({tempSelectedModels.length} selected)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}