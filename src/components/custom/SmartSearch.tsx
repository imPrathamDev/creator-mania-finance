"use client";
import React from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "../ui/command";
import {
  ArrowUpRight,
  BellIcon,
  CalculatorIcon,
  CalendarIcon,
  ClipboardPasteIcon,
  CodeIcon,
  CopyIcon,
  CreditCardIcon,
  FileTextIcon,
  FolderIcon,
  FolderPlusIcon,
  HelpCircleIcon,
  HomeIcon,
  ImageIcon,
  InboxIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  ScissorsIcon,
  SettingsIcon,
  TrashIcon,
  TrendingDown,
  TrendingUp,
  UserIcon,
  UserRound,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { useGeneralStore } from "@/context/genral-context";
import { useSmartSearch } from "@/hooks/use-smart-search";
import { useRouter } from "next/navigation";

function SmartSearch() {
  const { openSmartSearch, setOpenSmartSearch } = useGeneralStore();
  const { clear, setQuery, query, results, loading, error } = useSmartSearch({
    limitPerKind: 6,
    kinds: ["contact", "nav", "tag", "transaction"],
  });
  const router = useRouter();
  return (
    <CommandDialog open={openSmartSearch} onOpenChange={setOpenSmartSearch}>
      <Command shouldFilter={false}>
        <CommandInput
          value={query}
          onValueChange={(value) => setQuery(value)}
          placeholder="search transactions, contact, tags, links..."
        />
        <CommandList className="no-scrollbar">
          {loading ? (
            <CommandEmpty>Please wait...</CommandEmpty>
          ) : (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          {results.nav.length > 0 && (
            <>
              <CommandGroup heading="Navigation">
                {results.nav.map((nav) => (
                  <CommandItem
                    key={nav.id}
                    onSelect={() => {
                      if (nav.url) {
                        router.push(nav.url);
                      }
                    }}
                  >
                    <nav.icon />
                    <span>{nav.title}</span>
                    <CommandShortcut>
                      <ArrowUpRight className="size-5" />
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {results.transactions.length > 0 && (
            <>
              <CommandGroup heading="Transactions">
                {results.transactions.map((transaction) => (
                  <CommandItem
                    onSelect={() => {
                      if (transaction.url) {
                        router.push(transaction.url);
                      }
                    }}
                    key={transaction.id}
                  >
                    {transaction.transaction_type === "expense" ? (
                      <TrendingDown />
                    ) : (
                      <TrendingUp />
                    )}
                    <span>{transaction.title}</span>
                    <CommandShortcut>
                      <ArrowUpRight className="size-5" />
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {results.contacts.length > 0 && (
            <>
              <CommandGroup heading="Contacts">
                {results.contacts.map((contact) => (
                  <CommandItem
                    key={contact.id}
                    onSelect={() => {
                      if (contact.url) {
                        router.push(contact.url);
                      }
                    }}
                  >
                    <UserRound />
                    <span>{contact.title}</span>
                    <CommandShortcut>
                      <ArrowUpRight className="size-5" />
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {results.tags.length > 0 && (
            <>
              <CommandGroup heading="Tags">
                {results.tags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => {
                      if (tag.url) {
                        router.push(tag.url);
                      }
                    }}
                  >
                    <PlusIcon />
                    <span>{tag.title}</span>
                    <CommandShortcut>
                      <ArrowUpRight className="size-5" />
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
              {/* <CommandSeparator /> */}
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

export default SmartSearch;
