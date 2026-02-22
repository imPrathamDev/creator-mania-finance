"use client";

import * as React from "react";
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Building2, Sparkles, UsersRound } from "lucide-react";
import Link from "next/link";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const data = React.useMemo(() => {
    return {
      navMain: [
        {
          title: "Dashboard",
          url: "/",
          icon: IconDashboard,
        },
        {
          title: "Clients",
          url: "/clients",
          icon: UsersRound,
        },
        {
          title: "Vendors",
          url: "/vendors",
          icon: Building2,
        },
        // {
        //   title: "Projects",
        //   url: "#",
        //   icon: IconFolder,
        // },
      ],
      navSecondary: [
        {
          title: "Settings",
          url: "/settings",
          icon: IconSettings,
        },
        {
          title: "AI Chat",
          url: "/ai",
          icon: Sparkles,
        },
        {
          title: "Smart Search",
          url: "/search",
          icon: IconSearch,
        },
      ],
      documents: [
        {
          name: "Data Library",
          url: "#",
          icon: IconDatabase,
        },
        {
          name: "Reports",
          url: "#",
          icon: IconReport,
        },
        {
          name: "Word Assistant",
          url: "#",
          icon: IconFileWord,
        },
      ],
    };
  }, []);
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/">
                <IconInnerShadowTop className="size-5!" />
                <div className="flex flex-col -gap-1">
                  <span className="text-base font-semibold">CreatorMania</span>
                  <span className="text-xs tracking-widest">Finance</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: "shadcn",
            email: "m@example.com",
            avatar: "/avatars/shadcn.jpg",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
