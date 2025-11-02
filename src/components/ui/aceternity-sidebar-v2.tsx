"use client";

import React, { createContext, useContext, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

type SidebarContextType = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

interface SidebarProviderProps {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
  open: controlledOpen,
  setOpen: controlledSetOpen,
  animate = true,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledSetOpen !== undefined ? controlledSetOpen : setInternalOpen;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

interface SidebarProps {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  children,
  open,
  setOpen,
  animate = true,
  className,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = setOpen !== undefined ? setOpen : setInternalOpen;

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <SidebarProvider open={isOpen} setOpen={setIsOpen} animate={animate}>
      <div
        className={cn(
          "relative h-screen overflow-hidden",
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          className="relative h-full bg-gray-100 dark:bg-neutral-800"
          initial={false}
          animate={{
            width: isOpen ? 240 : 72,
          }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1], // Custom cubic-bezier for smoother animation
          }}
          style={{
            willChange: "width",
          }}
        >
          <div className="h-full overflow-hidden">
            {children}
          </div>
        </motion.div>
      </div>
    </SidebarProvider>
  );
};

interface SidebarBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const SidebarBody: React.FC<SidebarBodyProps> = ({ children, className }) => {

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-1 flex-col justify-between overflow-hidden px-4 py-6",
        className
      )}
    >
      {children}
    </div>
  );
};

interface SidebarLinkProps {
  link: {
    label: string;
    href: string;
    icon: React.ReactNode;
  };
  className?: string;
  active?: boolean;
}

export const SidebarLink: React.FC<SidebarLinkProps> = ({ link, className, active = false }) => {
  const { open } = useSidebar();

  return (
    <a
      href={link.href}
      className={cn(
        "group/link relative flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden",
        active
          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
          : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700",
        className
      )}
    >
      <div className={cn(
        "flex-shrink-0 transition-all duration-200",
        "group-hover/link:scale-110",
        active
          ? "text-white dark:text-neutral-900"
          : "text-neutral-700 dark:text-neutral-200"
      )}>
        {link.icon}
      </div>
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{
              duration: 0.2,
              delay: 0.1,
            }}
            className="ml-3 whitespace-nowrap overflow-hidden"
          >
            {link.label}
          </motion.span>
        )}
      </AnimatePresence>
    </a>
  );
};