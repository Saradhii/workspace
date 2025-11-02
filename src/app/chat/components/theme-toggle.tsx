"use client";

import { useCallback, useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { flushSync } from "react-dom";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number;
}

export function ThemeToggle({ className, duration = 400, ...props }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isDark = theme === "dark";

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return;

    const newTheme = isDark ? "light" : "dark";

    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      // Fallback for browsers that don't support View Transitions
      setTheme(newTheme);
      return;
    }

    try {
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          setTheme(newTheme);
        });
      });

      await transition.ready;

      const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
      const x = left + width / 2;
      const y = top + height / 2;
      const maxRadius = Math.hypot(
        Math.max(left, window.innerWidth - left),
        Math.max(top, window.innerHeight - top)
      );

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    } catch (error) {
      // If anything goes wrong with the animation, just change the theme
      console.error("View transition failed:", error);
      setTheme(newTheme);
    }
  }, [isDark, setTheme, duration]);

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(
        "inline-flex p-1.5 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 px-2 md:h-fit md:w-fit md:px-2",
        className
      )}
      {...props}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}