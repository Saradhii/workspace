"use client";

import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/aceternity-sidebar-v2";
import { DotBackground } from "@/components/ui/dot-background";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconLayoutDashboard,
  IconPhoto,
  IconVideo,
  IconMessage,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";

import { Code } from "lucide-react";

  export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const links = [
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

  return (
    <div className="relative flex w-full h-screen overflow-hidden bg-black/[0.96] antialiased">
      <DotBackground />
      {/* <GlowingStarsBackground /> */}
      <Sidebar className="relative z-10">
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
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
      <div className="flex flex-1 overflow-hidden relative z-10 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
        <div className="flex h-full w-full flex-1 flex-col gap-2 bg-white/30 p-4 md:p-8 dark:bg-neutral-900/30" suppressHydrationWarning>
          {children}
        </div>
      </div>
    </div>
  );
}