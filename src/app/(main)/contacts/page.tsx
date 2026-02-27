"use client";

import { FormFields } from "@/components/custom/custom-form";
import { ContactsTable } from "@/components/custom/tabsles/ContactsTable";
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
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import { goeyToast } from "goey-toast";
import { useRouter } from "next/navigation";
import React, { useCallback, useState } from "react";

const ContactPage = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<
    Database["public"]["Tables"]["contacts"]["Insert"]
  >({
    name: "",
  });

  const fields = {
    name: {
      type: "text",
    },
    address: {
      type: "text",
    },
    category: {
      type: "text",
    },
    company: {
      type: "text",
    },
    email: {
      type: "text",
    },
    notes: {
      type: "text",
    },
    phone: {
      type: "text",
    },
    type: {
      type: "text",
      options: ["client", "vendor", "both"],
    },
    website: {
      type: "text",
      placeholder: "https://wwww.creatormania.in",
    },
  };
  const router = useRouter();
  const handleCreateContact = useCallback(async () => {
    setCreating(true);
    const supabase = createClient();
    const { error } = await supabase.from("contacts").insert({
      ...form,
    });

    if (error) {
      setCreating(false);
      goeyToast.error(error.message);
      return;
    }

    goeyToast.success("Contact created successfully.");
    setForm({ name: "" });
    setCreating(false);
    setCreateOpen(false);
  }, [form, router]);

  return (
    <div className="p-6">
      <ContactsTable
        onCreateContact={() => setCreateOpen(true)}
        //   onEditContact={(contact) => { setEditTarget(contact); setEditOpen(true) }}
      />

      <Dialog
        open={createOpen}
        onOpenChange={(e) => {
          if (!e) {
            if (!creating) {
              setCreateOpen(false);
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add contact</DialogTitle>
            <DialogDescription>
              Make contact or create directly in create transaction page.
            </DialogDescription>
          </DialogHeader>
          <div className="w-full grid grid-cols-2 gap-4">
            {Object.keys(fields).map((key) => (
              <FormFields
                key={key}
                setValues={setForm as any}
                values={form}
                input={
                  fields[key as keyof typeof fields].type === "text"
                    ? {
                        type: "text",
                        key,
                        inputAttributeType: "text",
                        name: key,
                        title: key,
                        placeholder: (fields as any)[key as keyof typeof fields]
                          .placeholder
                          ? (fields as any)[key as keyof typeof fields]
                              .placeholder
                          : key.substring(0, 1).toUpperCase() +
                            key.substring(1, key.length - 1),
                      }
                    : ({
                        type: "select",
                        key,
                        name: key,
                        options: (fields as any)[key as keyof typeof fields]
                          .options,
                      } as any)
                }
                hideLabel
              />
            ))}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button disabled={creating} onClick={handleCreateContact}>
              {creating ? "Creating..." : "Save contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactPage;
