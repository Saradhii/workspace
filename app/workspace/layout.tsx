"use client";

import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/aceternity-sidebar-v2";
import { DotBackground } from "@/components/ui/dot-background";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { GridBackground } from "@/components/ui/grid-background";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconLayoutDashboard,
  IconPhoto,
  IconVideo,
  IconMessage,
  IconDatabase,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Code, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

  type NavLink = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const NAV_LINKS: NavLink[] = [
  {
    label: "Workspace",
    href: "/workspace",
    icon: <IconLayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "Text Generation",
    href: "/workspace/text-creation",
    icon: <IconMessage className="h-5 w-5" />,
  },
  {
    label: "Image Creation",
    href: "/workspace/image-creation",
    icon: <IconPhoto className="h-5 w-5" />,
  },
  {
    label: "Video Creation",
    href: "/workspace/video-creation",
    icon: <IconVideo className="h-5 w-5" />,
  },
  {
    label: "Code Generation",
    href: "/workspace/code-creation",
    icon: <Code className="h-5 w-5" />,
  },
  {
    label: "RAG",
    href: "/workspace/rag",
    icon: <IconDatabase className="h-5 w-5" />,
  },
  {
    label: "Dashboard",
    href: "#",
    icon: <IconBrandTabler className="h-5 w-5" />,
  },
  {
    label: "Profile",
    href: "#",
    icon: <IconUserBolt className="h-5 w-5" />,
  },
  {
    label: "Settings",
    href: "#",
    icon: <IconSettings className="h-5 w-5" />,
  },
  {
    label: "Logout",
    href: "#",
    icon: <IconArrowLeft className="h-5 w-5" />,
  },
];

/**
 * Phone / small-tablet navigation: the icon rail is hover-only, so touch users
 * could never reveal its labels. This top bar opens a labelled drawer instead.
 */
function MobileNav({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false);
  const current = NAV_LINKS.find((link) => link.href === pathname)?.label ?? "Workspace";

  return (
    <header className="relative z-20 flex shrink-0 items-center gap-3 border-b border-white/[0.06] bg-black/40 px-4 py-3 backdrop-blur md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open workspace menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-neutral-200 transition hover:bg-white/[0.06]"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-white/10 bg-neutral-950 p-0 text-neutral-100">
          <SheetHeader className="border-b border-white/[0.06] p-4">
            <SheetTitle className="text-base text-neutral-50">Workspace</SheetTitle>
            <SheetDescription className="text-xs text-neutral-500">Switch between tools</SheetDescription>
          </SheetHeader>
          <nav aria-label="Workspace" className="flex flex-col gap-1 p-3">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition " +
                    (active
                      ? "bg-white text-neutral-900"
                      : "text-neutral-300 hover:bg-white/[0.06] hover:text-neutral-50")
                  }
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
      <span className="truncate text-sm font-medium text-neutral-100">{current}</span>
    </header>
  );
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();



  // Check if current route is RAG-related.
  // (Its ScrollArea forces Radix's display:table viewport child to block, so wide content can't push past the screen on mobile.)
  const isRAGRoute = pathname?.startsWith('/workspace/rag');

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-black/[0.96] antialiased md:flex-row">
      <DotBackground />
      {/* <GridBackground /> */}
      {/* <GlowingStarsBackground /> */}
      <MobileNav pathname={pathname} />
      <Sidebar className="relative z-10 hidden md:block">
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="mt-8 flex flex-col gap-2">
              {NAV_LINKS.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  active={pathname === link.href}
                />
              ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
        {isRAGRoute ? (
          <ScrollArea className="h-full w-full [&_[data-slot=scroll-area-viewport]>div]:!block">
            <div className="flex h-full w-full flex-1 flex-col gap-2 bg-white/30 p-4 md:p-8 dark:bg-neutral-900/30" suppressHydrationWarning>
              {children}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-full w-full flex-1 flex-col gap-2 bg-white/30 p-4 md:p-8 dark:bg-neutral-900/30" suppressHydrationWarning>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}