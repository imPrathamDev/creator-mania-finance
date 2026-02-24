"use client";

import { BanknoteArrowDown, BanknoteArrowUp, Plus, X } from "lucide-react";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { FormFields } from "@/components/custom/custom-form";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { useContacts } from "@/hooks/use-contacts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PaymentMethod,
  PaymentStatus,
  usePaymentMethods,
  usePaymentStatuses,
} from "@/hooks/use-payments-helpers";
import { useTags } from "@/hooks/use-tags";
import { Tag } from "@/types/hooks/use-tags";
import { Contact } from "@/types/hooks/use-contacts";
import { createClient } from "@/lib/supabase/client";
import { goeyToast } from "goey-toast";
import { Spinner } from "@/components/ui/spinner";

// ── Reusable reveal wrapper ──────────────────────────────────────────────────

const RevealItem = ({
  children,
  index = 0,
}: {
  children: ReactNode;
  index?: number;
}) => (
  <motion.div
    className="w-full"
    initial={{ opacity: 0, filter: "blur(8px)", y: 24 }}
    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
    exit={{ opacity: 0, filter: "blur(8px)", y: 24 }}
    transition={{
      duration: 0.4,
      delay: index * 0.12,
      ease: [0.25, 0.46, 0.45, 0.94],
    }}
  >
    {children}
  </motion.div>
);

// ── Reusable stagger group ───────────────────────────────────────────────────

const RevealGroup = ({
  show,
  children,
}: {
  show: boolean;
  children: ReactNode;
}) => (
  <AnimatePresence initial={false}>
    {show && (
      <motion.div className="flex flex-col items-center gap-4 w-full">
        {React.Children.map(children, (child, i) => (
          <RevealItem index={i}>{child}</RevealItem>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

// ── Type selector ────────────────────────────────────────────────────────────

type TypeKey = "expense" | "income";

const typeOptions: Record<TypeKey, { title: string; icon: React.ElementType }> =
  {
    expense: { title: "Expense", icon: BanknoteArrowUp },
    income: { title: "Income", icon: BanknoteArrowDown },
  };

const TypeSelector = ({
  value,
  onChange,
}: {
  value: TypeKey | null;
  onChange: (v: TypeKey | null) => void;
}) => (
  <motion.div className="flex items-center justify-center gap-3 w-full">
    {(Object.keys(typeOptions) as TypeKey[]).map((key) => {
      const { icon: Icon } = typeOptions[key];
      const isSelected = value === key;
      const isNoneSelected = value === null;

      return (
        <motion.button
          key={key}
          onClick={() => onChange(key)}
          animate={{
            width: isNoneSelected ? "35%" : isSelected ? "100%" : "0%",
            opacity: isNoneSelected ? 1 : isSelected ? 1 : 0,
            marginLeft: isSelected && !isNoneSelected ? "auto" : undefined,
            marginRight: isSelected && !isNoneSelected ? "auto" : undefined,
          }}
          transition={{
            width: {
              duration: isSelected ? 0.5 : 0.2,
              ease: isSelected ? [0.34, 1.56, 0.64, 1] : "easeIn",
            },
            opacity: { duration: 0.15 },
          }}
          className={`relative overflow-hidden cursor-pointer rounded-full h-12 flex gap-2 items-center justify-center shrink-0
            ${isSelected ? "bg-primary" : "bg-accent"}
            ${!isSelected && !isNoneSelected ? "pointer-events-none" : ""}
          `}
        >
          <Icon className="size-5 shrink-0" />
          <span className="text-lg font-medium whitespace-nowrap">
            {typeOptions[key].title}
          </span>

          <AnimatePresence>
            {isSelected && (
              <motion.div
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 30, opacity: 0 }}
                transition={{ duration: 0.25, delay: 0.25 }}
                className="absolute top-1/2 -translate-y-1/2 right-4"
              >
                <X className="size-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      );
    })}
  </motion.div>
);

// ── Main component ───────────────────────────────────────────────────────────

const AddTransaction = () => {
  const [type, setType] = useState<TypeKey | null>(null);
  const [form, setForm] = useState<{
    title: string;
    description: string;
    date: Date;
    contact?:
      | string
      | {
          id: string;
          name: string;
        };
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    notes: string;
    tags: ({ id: string; name: string } | string)[];
    amount: number | undefined;
  }>({
    title: "",
    description: "",
    date: new Date(),
    payment_method: "upi",
    payment_status: "paid",
    notes: "",
    tags: [],
    amount: undefined,
  });
  const { contacts, setSearch } = useContacts();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [tagInputValue, setTagInputValue] = useState<string>("");
  const { paymentMethods } = usePaymentMethods();
  const { paymentStatuses } = usePaymentStatuses();
  const anchor = useComboboxAnchor();
  const { tags, setSearch: setTagsSearch } = useTags();
  const [wait, setWait] = useState(false);
  const [waitSate, setWaitState] = useState("Please wait...");
  const [cachedTags, setCacheTags] = useState<Tag[]>([]);

  const handleLabel = useCallback(
    (contact: string) => {
      console.log(contact);

      const name = contacts.find((f) => f.id === contact)?.name;
      return name ?? "";
    },
    [contacts],
  );

  const handleAddToTags = useCallback(
    ({ id, name }: { id: string; name: string }) => {
      setForm((prev) => ({
        ...prev,
        tags: [
          ...prev.tags,
          ...(prev.tags.some((s) => typeof s !== "string" && s.id !== id)
            ? [{ id, name }]
            : []),
        ],
      }));
    },
    [],
  );

  useEffect(() => {
    if (tags.length > 0) {
      setCacheTags((prev) => {
        const ids = new Set(prev.map((t) => t.id));
        return [...prev, ...tags.filter((t) => !ids.has(t.id))];
      });
    }
  }, [tags]);

  const handleAddTransaction = useCallback(async () => {
    if (
      !(form.title.length > 0) ||
      !form.contact ||
      type == null ||
      form.amount === undefined
    ) {
      goeyToast.error("Invalid Input", {
        description: "Please fill all necessary fields.",
      });
      return;
    }
    try {
      setWait(true);
      const unlinkedTags = form.tags.filter((f) => typeof f === "string");
      const linkedTags = form.tags.filter((f) => typeof f !== "string");
      const supabase = createClient();
      let c: string;
      const tagsColors = [
        "#8ECAE6",
        "#B7E4C7",
        "#E5989B",
        "#B1A7A6",
        "#E9C46A",
        "#93A8AC",
        "#A8DADC",
        "#F4A261",
        "#BC4B51",
        "#8D99AE",
      ];
      setWaitState("Linking contact...");
      if (typeof form.contact === "string") {
        const { data: contactData, error: errContact } = await supabase
          .from("contacts")
          .insert({
            name: form.contact,
            type: type === "expense" ? "vendor" : "client",
          })
          .select("id")
          .single();

        if (errContact) {
          setWait(false);
          goeyToast.error(errContact.message);
          return;
        }

        c = contactData.id;
      } else {
        c = form.contact.id;
      }
      setWaitState("Recording transaction...");
      const { data: tnx, error: errTnx } = await supabase
        .from("transactions")
        .insert({
          amount: form.amount,
          title: form.title,
          description: form.description,
          transaction_date: form.date.toISOString(),
          type,
          contact_id: c,
          payment_method: form.payment_method,
          payment_status: form.payment_status,
          notes: form.notes,
        })
        .select("*")
        .single();

      if (errTnx) {
        setWait(false);
        goeyToast.error(errTnx.message);
        return;
      }
      setWaitState("Linking tags...");
      const newTags = await Promise.all(
        unlinkedTags.map((t) =>
          supabase
            .from("tags")
            .insert({
              name: t,
              color: tagsColors[Math.floor(Math.random() * tagsColors.length)],
            })
            .select("*")
            .single(),
        ),
      );

      await Promise.all([
        ...newTags
          .filter((f) => f.error === null)
          .map((g) =>
            supabase.from("transaction_tags").insert({
              tag_id: g.data.id,
              transaction_id: tnx.id,
            }),
          ),
        ...linkedTags.map((g) =>
          supabase.from("transaction_tags").insert({
            tag_id: g.id,
            transaction_id: tnx.id,
          }),
        ),
      ]);

      setForm({
        amount: undefined,
        date: new Date(),
        description: "",
        notes: "",
        payment_method: "upi",
        payment_status: "paid",
        tags: [],
        title: "",
        contact: undefined,
      });
      setWait(false);
      setWaitState("Please wait...");
      setType(null);

      goeyToast.success("Transaction added successfully.", {
        description: "You can check on dashboard.",
      });
    } catch (error) {
      console.log(error);
      setWait(false);
      goeyToast.error("Something went wrong.");
      return;
    }
  }, [form, type]);

  return (
    <motion.div
      layout
      transition={{
        layout: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
      }}
      className="max-w-xl mx-auto h-full flex flex-col justify-center items-center gap-4 py-8"
    >
      {/* Amount */}
      <motion.div
        layout
        transition={{
          layout: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
        }}
        className="grid gap-1 justify-center items-center text-center"
      >
        <span className="text-xs uppercase font-medium text-primary">
          Amount
        </span>
        <div className="flex items-center justify-center text-5xl w-fit">
          <span>₹</span>
          <input
            type="number"
            className="outline-none field-sizing-content font-semibold font-mono bg-transparent caret-primary"
            placeholder="0000"
            value={form.amount}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                amount: parseInt(e.target.value),
              }))
            }
          />
        </div>
      </motion.div>

      {/* Type selector */}
      <motion.div
        layout
        transition={{
          layout: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
        }}
        className="grid gap-2 w-full text-center"
      >
        {/* <span className="text-xs uppercase font-medium text-primary">
          Select Type
        </span> */}
        <TypeSelector value={type} onChange={setType} />
      </motion.div>

      {/* Revealed fields */}
      <RevealGroup show={type !== null}>
        <FormFields
          input={{
            type: "text",
            key: "title",
            name: "title",
            inputAttributeType: "text",
            title: "Title",
            placeholder: "Title",
          }}
          setValues={setForm as any}
          values={form as any}
          hideLabel
          disabled={wait}
        />
        <FormFields
          input={{
            type: "textarea",
            key: "description",
            name: "description",
            title: "Description",
            placeholder: "Description (optional)",
            rows: 4,
          }}
          setValues={setForm as any}
          values={form as any}
          hideLabel
          disabled={wait}
        />
        <FormFields
          input={{
            type: "date",
            key: "date",
            name: "date",
            title: "Date",
          }}
          setValues={setForm as any}
          values={form as any}
          hideLabel
          disabled={wait}
        />

        <Combobox
          items={contacts}
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
          }}
          disabled={wait}
          // onValueChange={(value) => {
          //   if (value && typeof value === "string") {
          //     setForm((prev) => ({
          //       ...prev,
          //       contact: {
          //         id: value,
          //       },
          //     }));
          //   }
          // }}
          onInputValueChange={(search) => {
            setInputValue(search);
            if (open) {
              setSearch(search); // triggers your useContacts search
            }
          }}
          itemToStringLabel={handleLabel}
        >
          <ComboboxInput
            placeholder={
              typeof form.contact === "string"
                ? form.contact
                : form.contact
                  ? form.contact.name
                  : "Select a contact"
            }
            className="border-transparent bg-muted rounded-lg"
            showClear
          />
          <ComboboxContent>
            <ComboboxEmpty>
              {inputValue.trim().length > 0 ? (
                <Button
                  variant={"ghost"}
                  className="w-full text-left! px-2 py-1.5 text-sm"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, contact: inputValue }));
                    setOpen(false);
                  }}
                >
                  Use "{inputValue}"
                </Button>
              ) : (
                "No contact found."
              )}
            </ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      contact: {
                        id: item.id,
                        name: item.name,
                      },
                    }));
                  }}
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <div className="flex items-center gap-2 w-full">
          <Select
            value={form.payment_method}
            onValueChange={(value) => {
              setForm((prev) => ({
                ...prev,
                payment_method: value as PaymentMethod,
              }));
            }}
          >
            <SelectTrigger disabled={wait} className="w-full">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent className="w-full" position={"item-aligned"}>
              <SelectGroup>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.key} value={method.key}>
                    <method.icon className="size-4" /> {method.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={form.payment_status}
            onValueChange={(value) => {
              setForm((prev) => ({
                ...prev,
                payment_status: value as PaymentStatus,
              }));
            }}
          >
            <SelectTrigger disabled={wait} className="w-full">
              <SelectValue placeholder="Select payment status" />
            </SelectTrigger>
            <SelectContent className="w-full" position={"item-aligned"}>
              <SelectGroup>
                {paymentStatuses.map((status) => (
                  <SelectItem key={status.key} value={status.key}>
                    <status.icon className={`size-4 ${status.color}`} />{" "}
                    {status.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <FormFields
          disabled={wait}
          input={{
            type: "textarea",
            key: "notes",
            name: "notes",
            title: "Notes",
            placeholder: "Notes (Comments)",
            rows: 5,
          }}
          setValues={setForm as any}
          values={form as any}
          hideLabel
        />

        <Combobox
          multiple
          autoHighlight
          items={tags}
          onInputValueChange={(search) => {
            setTagInputValue(search);
            setTagsSearch(search); // triggers your useContacts search
          }}
          disabled={wait}
        >
          <ComboboxChips
            ref={anchor}
            className="w-full bg-muted border-transparent rounded-lg"
          >
            <ComboboxValue>
              {(values) => (
                <React.Fragment>
                  {values.map((value: string) => {
                    const name = cachedTags.find((f) => f.id === value)?.name;
                    return (
                      <ComboboxChip key={value} className="bg-primary">
                        {name}
                      </ComboboxChip>
                    );
                  })}
                  <ComboboxChipsInput placeholder="tags here..." />
                </React.Fragment>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>No tags found.</ComboboxEmpty>
            <ComboboxList>
              {(item: Tag) => (
                <ComboboxItem
                  onClick={() =>
                    handleAddToTags({ id: item.id, name: item.name })
                  }
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        {/* <FormFields input={{
          type: "tags",
          key: "tags",
          name: "tags",
          title: "Notes",
          placeholder: "Notes (Comments)",
          rows: 5
        }} setValues={setForm as any} values={form as any} hideLabel /> */}

        <Button
          onClick={handleAddTransaction}
          disabled={wait}
          className="w-full bg-muted"
        >
          {wait ? (
            <>
              <Spinner /> {waitSate}
            </>
          ) : (
            <>
              <Plus /> Add Transaction
            </>
          )}
        </Button>
      </RevealGroup>
    </motion.div>
  );
};

export default AddTransaction;
