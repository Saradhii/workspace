"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  } from "@/components/ui/sidebar";
import {
  IconDashboard,
  IconFolder,
  IconSettings,
  IconLogout,
} from "@tabler/icons-react";
import { Logo } from "./logo";

const items = [
  {
    title: "Dashboard",
    url: "#",
    icon: IconDashboard,
  },
  {
    title: "Projects",
    url: "#",
    icon: IconFolder,
  },
  {
    title: "Settings",
    url: "#",
    icon: IconSettings,
  },
  {
    title: "Logout",
    url: "#",
    icon: IconLogout,
  },
];

export function SidebarNav() {

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <Logo />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Manu Arora">
              <a href="#">
                <img
                  src="https://assets.aceternity.com/manu.png"
                  className="h-7 w-7 rounded-full"
                  width={50}
                  height={50}
                  alt="Avatar"
                />
                <span>Manu Arora</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}