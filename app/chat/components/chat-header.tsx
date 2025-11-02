"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, PlusIcon } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "./theme-toggle";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  selectedVisibilityType,
  onVisibilityChange,
}: {
  selectedVisibilityType: VisibilityType;
  onVisibilityChange?: (type: VisibilityType) => void;
}) {
  const { toggleSidebar, open } = useSidebar();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 py-1.5 md:px-2">
      <div className="flex items-center gap-2">
        <Button
          className="h-8 px-2 md:h-fit md:px-2"
          onClick={toggleSidebar}
          variant="outline"
          data-testid="sidebar-toggle-button"
        >
          {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          <span className="sr-only">{open ? "Close sidebar" : "Open sidebar"}</span>
        </Button>

        <Button
          className="h-8 px-2 md:h-fit md:px-2"
          variant="outline"
          onClick={() => {/* New chat functionality can be added here */}}
        >
          <PlusIcon />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <VisibilitySelector
          selectedVisibilityType={selectedVisibilityType}
          {...(onVisibilityChange && { onVisibilityChange })}
        />
        <ThemeToggle />
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.onVisibilityChange === nextProps.onVisibilityChange
  );
});