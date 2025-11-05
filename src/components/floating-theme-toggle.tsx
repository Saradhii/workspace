"use client";

import { ThemeToggle } from "@/app/chat/components/theme-toggle";

export function FloatingThemeToggle() {
  /*
  TODO: Needs optimization for light theme styles before enabling
  - Improve visibility in light mode
  - Adjust colors for better contrast
  - Test across different backgrounds
  */

  return (
    // <div className="fixed top-4 right-4 z-50">
    //   <div className="relative group">
    //     {/* Backdrop blur background */}
    //     <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-background/80 backdrop-blur-sm" />

    //     {/* Theme Toggle Button */}
    //     <ThemeToggle
    //       className="relative bg-background/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
    //     />

    //     {/* Tooltip */}
    //     <div className="absolute -left-20 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
    //       <div className="bg-popover text-popover-foreground px-2 py-1 rounded-md shadow-md text-xs whitespace-nowrap border">
    //         Toggle theme
    //       </div>
    //       <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[4px] border-l-popover" />
    //     </div>
    //   </div>
    // </div>
    <></>
  );
}