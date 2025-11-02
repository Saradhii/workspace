"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { IconAdjustmentsHorizontal, IconBell, IconSearch } from "@tabler/icons-react";

export function DummyDashboard() {
  return (
    <div className="flex flex-col flex-1 relative z-10">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 bg-background/80 backdrop-blur-sm px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <IconSearch className="size-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <IconBell className="size-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <IconAdjustmentsHorizontal className="size-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-2">Total Users</h3>
            <p className="text-3xl font-bold">1,234</p>
          </div>
          <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-2">Active Projects</h3>
            <p className="text-3xl font-bold">56</p>
          </div>
          <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-2">Completion Rate</h3>
            <p className="text-3xl font-bold">89%</p>
          </div>
          <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-2">Team Members</h3>
            <p className="text-3xl font-bold">12</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 h-96">
            <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm">New project created</p>
                <span className="text-xs text-muted-foreground ml-auto">2m ago</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm">Task completed</p>
                <span className="text-xs text-muted-foreground ml-auto">1h ago</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <p className="text-sm">Team meeting scheduled</p>
                <span className="text-xs text-muted-foreground ml-auto">3h ago</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 h-96">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="grid gap-4">
              <Button className="justify-start" variant="outline">
                Create New Project
              </Button>
              <Button className="justify-start" variant="outline">
                Invite Team Member
              </Button>
              <Button className="justify-start" variant="outline">
                Generate Report
              </Button>
              <Button className="justify-start" variant="outline">
                View Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}