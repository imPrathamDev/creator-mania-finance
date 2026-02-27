"use client";

import { FormFields } from "@/components/custom/custom-form";
import { TransactionsTable } from "@/components/custom/tabsles/TransactionsTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useContacts } from "@/hooks/use-contacts";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import {
  BookUser,
  ChevronsLeftRightEllipsis,
  Mail,
  MapPin,
  NotebookPen,
  PawPrint,
  Pencil,
  Phone,
  Scale,
  UserRound,
} from "lucide-react";
import moment from "moment";
import { useParams } from "next/navigation";
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const ContactPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState<
    Database["public"]["Tables"]["contacts"]["Row"] | null
  >(null);
  const [update, setUpdate] = useState<null | {
    type: string;
    prevValue?: string;
    options: string[];
    value?: string;
    key: string;
  }>(null);

  const handleFetchContact = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    if (id && typeof id === "string") {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        console.log(error);
      } else {
        setContact(data);
      }
      setLoading(false);
    }
  }, [id]);

  const handleUpdate = useCallback(() => {
    if (!update || !contact) return;
    const supabase = createClient();
    setContact((prev) => ({ ...prev, [update.key]: update.value }) as any);
    supabase
      .from("contacts")
      .update({ [update.key]: update.value })
      .eq("id", contact.id);
    setUpdate(null);
  }, [update, contact]);

  const options = useMemo(() => {
    if (!contact) return [];

    return [
      {
        type: "text",
        key: "email",
        value: contact.email,
        icon: Mail,
      },
      {
        type: "text",
        key: "address",
        value: contact.address,
        icon: MapPin,
      },
      {
        type: "text",
        key: "category",
        value: contact.category,
        icon: PawPrint,
      },
      {
        type: "text",
        key: "website",
        value: contact.website,
        icon: ChevronsLeftRightEllipsis,
      },
      {
        type: "text",
        key: "phone",
        value: contact.phone,
        icon: Phone,
      },
      {
        type: "text",
        key: "company",
        value: contact.company,
        icon: Scale,
      },
      {
        type: "text",
        key: "notes",
        value: contact.notes,
        icon: NotebookPen,
      },
      {
        type: "select",
        key: "type",
        value: contact.type,
        icon: BookUser,
        options: ["client", "vendor", "both"],
      },
    ];
  }, [contact]);

  useEffect(() => {
    handleFetchContact();
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 grid gap-6">
        <div className="space-y-2.5">
          <Skeleton className="h-10 w-[50%] rounded-xl" />
          <Skeleton className="h-5 w-[700%] rounded-xl" />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-[80vh] rounded-xl" />
          <Skeleton className="h-[80vh] rounded-xl col-span-3" />
        </div>
      </div>
    );
  }

  if (contact === null) {
    return (
      <div className="p-10">
        <div className="w-full border border-accent rounded-2xl flex items-center justify-center">
          <span className="text-center">No Contact Found.</span>
        </div>
      </div>
    );
  }

  return (
    <Fragment>
      <Dialog
        open={update !== null}
        onOpenChange={(e) => {
          if (!e) {
            setUpdate(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {update?.key} profile
            </DialogTitle>
            <DialogDescription>
              Make changes to contact profile here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          {update !== null && (
            <FormFields
              input={
                {
                  type: (update as any).type,
                  ...((update as any).type === "text" && {
                    inputAttributeType: "text",
                  }),
                  key: "value",
                  name: update.key,
                  ...((update as any).type === "select" && {
                    options: update.options,
                  }),
                  placeholder: update.key,
                } as any
              }
              setValues={setUpdate as any}
              values={update}
              hideLabel
            />
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              disabled={update === null || update.prevValue === update.value}
              onClick={handleUpdate}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="p-10 grid gap-10">
        <div className="">
          <h2 className="text-3xl font-semibold">
            {contact.name}'s details page.
          </h2>
          <p>View {contact.name}'s transactions and update their details.</p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-xl bg-muted">
            <div className="p-4 space-y-2 flex flex-col items-center justify-center">
              <div className="size-32 rounded-full bg-background border border-accent flex items-center justify-center">
                <UserRound className="size-20" />
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 justify-center">
                  <h3 className="text-2xl font-medium">{contact.name}</h3>
                  <button
                    onClick={() => {
                      setUpdate({
                        key: "name",
                        options: [],
                        prevValue: contact.name,
                        value: contact.name,
                        type: "text",
                      });
                    }}
                  >
                    <Pencil className="size-4" />
                  </button>
                </div>
                <Badge variant="outline" className="mx-auto bg-background">
                  Created On{" "}
                  {moment(contact.created_at).format("Do MMMM, YYYY")}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div className="px-4">
                <span className="font-medium opacity-90 text-sm">
                  General Info
                </span>
              </div>
              <div className="divide-y divide-background">
                {options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 py-2 px-4"
                  >
                    <div className="flex items-center gap-2">
                      <option.icon className="size-5" />
                      <span className="font-medium capitalize">
                        {option.key}:
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <p>{option.value ?? "Not Available"}</p>
                      <button
                        onClick={() => {
                          setUpdate({
                            key: option.key,
                            ...(option.type === "select"
                              ? {
                                  options: (option as any).options,
                                }
                              : {
                                  options: [],
                                }),
                            prevValue: option.value ?? "",
                            value: option.value ?? "",
                            type: option.type,
                          });
                        }}
                      >
                        <Pencil className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-span-3">
            <TransactionsTable contactId={contact.id} />
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default ContactPage;
