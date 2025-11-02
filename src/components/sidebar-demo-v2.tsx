"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/aceternity-sidebar-v2";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconLayoutDashboard,
  IconPhoto,
  IconVideo,
} from "@tabler/icons-react";

export function SidebarDemoV2() {
  const pathname = usePathname();

  const links = [
    {
      label: "Workspace",
      href: "/workspace",
      icon: <IconLayoutDashboard className="h-5 w-5" />,
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
    <div className="flex w-full h-screen overflow-hidden bg-gray-100 dark:bg-neutral-800">
      <Sidebar>
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
      <Dashboard />
    </div>
  );
}


// Dummy dashboard component with content
const Dashboard = () => {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-3xl border border-neutral-200 bg-white p-4 md:p-8 dark:border-neutral-700 dark:bg-neutral-900">
        {/* Placeholder cards commented out */}
        {/* <div className="flex gap-2">
          {[...new Array(4)].map((i, idx) => (
            <div
              key={"first-array-demo-1" + idx}
              className="h-20 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800"
            ></div>
          ))}
        </div>
        <div className="flex flex-1 gap-2">
          {[...new Array(2)].map((i, idx) => (
            <div
              key={"second-array-demo-1" + idx}
              className="h-full w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800"
            ></div>
          ))}
        </div> */}

        {/* Empty content area */}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Select an option from the sidebar to get started</p>
        </div>
      </div>
    </div>
  );
};