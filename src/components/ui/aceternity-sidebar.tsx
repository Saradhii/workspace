"use client";

import React, { createContext, useContext } from "react";
import { motion } from "motion/react";
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
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = setOpen !== undefined ? setOpen : setInternalOpen;

  return (
    <SidebarProvider open={isOpen} setOpen={setIsOpen} animate={animate}>
      <motion.div
        className={cn(
          "relative flex w-full max-w-xs flex-col items-center bg-gray-100/80 backdrop-blur-sm dark:bg-neutral-800/80",
          className
        )}
        animate={{
          width: isOpen ? 280 : 80,
        }}
        transition={{
          duration: animate ? 0.3 : 0,
          ease: "easeInOut",
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {children}
      </motion.div>
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
        "relative flex h-full w-full flex-1 flex-col items-center justify-between overflow-hidden px-4 py-4",
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
}

export const SidebarLink: React.FC<SidebarLinkProps> = ({ link, className }) => {
  const { open } = useSidebar();

  return (
    <a
      href={link.href}
      className={cn(
        "flex w-full items-center justify-start gap-2 rounded-md p-3 text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700",
        open ? "px-4" : "px-3 justify-center",
        className
      )}
    >
      <div className="flex-shrink-0">{link.icon}</div>
      <motion.div
        animate={{
          opacity: open ? 1 : 0,
          display: open ? "block" : "none",
        }}
        transition={{
          duration: 0.2,
          delay: open ? 0.1 : 0,
        }}
        className="overflow-hidden"
      >
        <span className="text-sm font-medium">{link.label}</span>
      </motion.div>
    </a>
  );
};