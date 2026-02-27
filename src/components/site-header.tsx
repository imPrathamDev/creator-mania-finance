"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { Search, SearchIcon } from "lucide-react";
import { Kbd } from "./ui/kbd";
import { useGeneralStore } from "@/context/genral-context";

export function SiteHeader() {
  const { setOpenSmartSearch } = useGeneralStore();
  const pathname = usePathname();
  const links = useMemo(() => {
    return {
      "/": {
        title: "Dashboard",
      },
      "/add-transaction": {
        title: "Enter Transaction",
      },
      "/contacts": {
        title: "Contacts",
      },
      "/transactions": {
        title: "All Transactions",
      },
      "/ai": {
        title: "AI Financial Assistant",
        description:
          "Ask anything about your transactions, contacts, tags, or spending patterns.",
      },
    };
  }, []);

  const title = useMemo(() => {
    if (links[pathname as keyof typeof links]) {
      return links[pathname as keyof typeof links].title;
    }

    return "Untitled";
  }, [links, pathname]);

  const description = useMemo(() => {
    if (links[pathname as keyof typeof links]) {
      return "description" in links[pathname as keyof typeof links]
        ? (links as any)[pathname as keyof typeof links].description
        : undefined;
    }

    return undefined;
  }, [links, pathname]);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="">
          <h1 className="text-base font-medium">{title ?? "Untitled"}</h1>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button> */}
          <InputGroup className="max-w-sm bg-muted border-transparent rounded-xl">
            <InputGroupInput
              placeholder="Search..."
              onClick={() => setOpenSmartSearch(true)}
            />
            <InputGroupAddon>
              <SearchIcon className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <Kbd>⌘K</Kbd>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
    </header>
  );
}
