"use client";

import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  CalendarClock,
  Dot,
  InfoIcon,
  Plus,
  PlusIcon,
  X,
} from "lucide-react";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RevealGroup } from "@/components/custom/reveal-animation";

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

type TagItem = { id: string; name: string; color?: string; creatable?: string };

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
    tags: { id: string; name: string }[];
    tagsToCreate: { name: string; color: string }[];
    amount?: number;
    reminder_message?: string;
    reminder_date?: Date;
  }>({
    title: "",
    description: "",
    date: new Date(),
    payment_method: "upi",
    payment_status: "paid",
    notes: "",
    tags: [],
    tagsToCreate: [],
  });
  const { contacts, setSearch } = useContacts();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [tagInputValue, setTagInputValue] = useState<string>("");
  const { tags, setSearch: setTagsSearch } = useTags();
  const [openDialog, setOpenDialog] = useState(false);
  const [pendingTagName, setPendingTagName] = useState("");
  const { paymentMethods } = usePaymentMethods();
  const { paymentStatuses } = usePaymentStatuses();
  const anchor = useComboboxAnchor();
  const [createTagForm, setCreateTagForm] = useState<{
    name: string;
    color?: string;
  }>({
    name: "",
  });
  const highlightedItemRef = useRef<TagItem | undefined>(undefined);
  const [wait, setWait] = useState(false);
  const [waitSate, setWaitState] = useState("Please wait...");
  const [cachedTags, setCacheTags] = useState<Tag[]>([]);

  const handleLabel = useCallback(
    (contact: string) => {
      const name = contacts.find((f) => f.id === contact)?.name;
      return name ?? "";
    },
    [contacts],
  );

  const selectedTags = useMemo(
    (): TagItem[] => [
      ...form.tags,
      ...form.tagsToCreate.map((t) => ({
        id: `pending:${t.name}`,
        name: t.name,
        color: t.color,
      })),
    ],
    [form.tags, form.tagsToCreate],
  );

  // Inject creatable sentinel when no exact match
  const trimmed = tagInputValue.trim();
  const lowered = trimmed.toLocaleLowerCase();
  const allKnownNames = [
    ...tags.map((t) => t.name.toLocaleLowerCase()),
    ...form.tagsToCreate.map((t) => t.name.toLocaleLowerCase()),
  ];
  const exactExists = allKnownNames.includes(lowered);

  const itemsForView: any[] =
    trimmed !== "" && !exactExists
      ? [
          ...tags,
          ...form.tagsToCreate.map((t) => ({
            id: `pending:${t.name}`,
            name: t.name,
            color: t.color,
          })),
          {
            id: `create:${lowered}`,
            name: `Create "${trimmed}"`,
            creatable: trimmed,
          },
        ]
      : [
          ...tags,
          ...form.tagsToCreate.map((t) => ({
            id: `pending:${t.name}`,
            name: t.name,
            color: t.color,
          })),
        ];

  function handleTagValueChange(next: TagItem[]) {
    const creatableItem = next.find(
      (item) => item.creatable && !selectedTags.some((s) => s.id === item.id),
    );

    if (creatableItem?.creatable) {
      setPendingTagName(creatableItem.creatable);
      setOpenDialog(true);
      return;
    }

    const clean = next.filter((i) => !i.creatable);

    // Deduplicate by id — last occurrence wins (handles toggle-off too)
    const deduped = clean.filter(
      (item, index, arr) => arr.findIndex((t) => t.id === item.id) === index,
    );

    const existingTags = deduped
      .filter((t) => !t.id.startsWith("pending:"))
      .map(({ id, name, color }) => ({ id, name, color }));

    const pendingTags = deduped
      .filter((t) => t.id.startsWith("pending:"))
      .map((t) => ({
        name: t.name,
        color:
          t.color ??
          form.tagsToCreate.find((p) => p.name === t.name)?.color ??
          "#000000",
      }));

    setForm((prev) => ({
      ...prev,
      tags: existingTags as { id: string; name: string }[],
      tagsToCreate: pendingTags,
    }));
    setTagInputValue("");
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || highlightedItemRef.current) return;

    const currentTrimmed = tagInputValue.trim();
    if (!currentTrimmed) return;

    const normalized = currentTrimmed.toLocaleLowerCase();
    const existing = tags.find(
      (t) => t.name.toLocaleLowerCase() === normalized,
    );

    if (existing) {
      if (!form.tags.some((t) => t.id === existing.id)) {
        setForm((prev) => ({
          ...prev,
          tags: [...prev.tags, { id: existing.id, name: existing.name }],
        }));
      }
      setTagInputValue("");
      return;
    }

    // Check if already in tagsToCreate
    const alreadyPending = form.tagsToCreate.some(
      (t) => t.name.toLocaleLowerCase() === normalized,
    );
    if (alreadyPending) {
      setTagInputValue("");
      return;
    }

    setPendingTagName(currentTrimmed);
    setCreateTagForm((prev) => ({ ...prev, name: currentTrimmed }));
    setOpenDialog(true);
  }

  function handleConfirmCreate() {
    const name = createTagForm.name.trim() ?? pendingTagName.trim();
    const color = createTagForm.color ?? "#3b82f6";
    if (!name) return;
    const normalized = name.toLocaleLowerCase();

    const existing = tags.find(
      (t) => t.name.toLocaleLowerCase() === normalized,
    );
    if (existing) {
      if (!form.tags.some((t) => t.id === existing.id)) {
        setForm((prev) => ({
          ...prev,
          tags: [...prev.tags, { id: existing.id, name: existing.name }],
        }));
      }
      setOpenDialog(false);
      setTagInputValue("");
      return;
    }

    // Prevent duplicate pending tag
    const alreadyPending = form.tagsToCreate.some(
      (t) => t.name.toLocaleLowerCase() === normalized,
    );
    if (alreadyPending) {
      setOpenDialog(false);
      setTagInputValue("");
      return;
    }

    setForm((prev) => ({
      ...prev,
      tagsToCreate: [...prev.tagsToCreate, { name, color }],
    }));

    setOpenDialog(false);
    setTagInputValue("");
    setCreateTagForm({ name: "" });
  }

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
      // const unlinkedTags = form.tags.filter((f) => typeof f === "string");
      // const linkedTags = form.tags.filter((f) => typeof f !== "string");
      console.log(form.tags, form.tagsToCreate);

      const supabase = createClient();
      let c: string;
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
          ...(form.reminder_date && {
            due_date: form.reminder_date.toISOString(),
          }),
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
        form.tagsToCreate.map((t) =>
          supabase
            .from("tags")
            .insert({
              name: t.name,
              color:
                t.color ??
                tagsColors[Math.floor(Math.random() * tagsColors.length)],
            })
            .select("*")
            .single(),
        ),
      );

      const _d = await Promise.all([
        ...newTags
          .filter((f) => f.error === null)
          .map((g) =>
            supabase.from("transaction_tags").insert({
              tag_id: g.data.id,
              transaction_id: tnx.id,
            }),
          ),
        ...form.tags.map((g) =>
          supabase.from("transaction_tags").insert({
            tag_id: g.id,
            transaction_id: tnx.id,
          }),
        ),
      ]);

      console.log(_d);

      if (
        (form.payment_status === "partially_paid" ||
          form.payment_status === "pending") &&
        form.reminder_date
      ) {
        setWaitState("Setting up reminder...");
        await supabase.from("reminders").insert({
          remind_at: form.reminder_date.toISOString(),
          transaction_id: tnx.id,
          ...(form.reminder_message &&
            form.reminder_message.trim().length > 0 && {
              message: form.reminder_message.trim(),
            }),
        });
      }

      setForm({
        date: new Date(),
        description: "",
        notes: "",
        payment_method: "upi",
        payment_status: "paid",
        tags: [],
        title: "",
        tagsToCreate: [],
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

  useEffect(() => {
    console.log("Tags", form.tags);
  }, [form.tags]);

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
          items={itemsForView}
          itemToStringLabel={(item: TagItem) => item.name}
          filter={null} // disable built-in filter since you handle it via setTagsSearch
          value={selectedTags}
          onValueChange={handleTagValueChange}
          inputValue={tagInputValue}
          onInputValueChange={(search) => {
            setTagInputValue(search);
            setTagsSearch(search);
          }}
          onItemHighlighted={(item) => {
            highlightedItemRef.current = item;
          }}
          disabled={wait}
        >
          <ComboboxChips
            ref={anchor}
            className="w-full bg-muted border-transparent rounded-lg"
          >
            <ComboboxValue>
              {(values: TagItem[]) => (
                <React.Fragment>
                  {values.map((tag) => (
                    <ComboboxChip key={tag.id} className="bg-primary">
                      {tag.name}
                    </ComboboxChip>
                  ))}
                  <ComboboxChipsInput
                    placeholder="tags here..."
                    onKeyDown={handleInputKeyDown}
                  />
                </React.Fragment>
              )}
            </ComboboxValue>
          </ComboboxChips>

          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>No tags found.</ComboboxEmpty>
            <ComboboxList>
              {(item: TagItem) =>
                item.creatable ? (
                  <ComboboxItem key={item.id} value={item}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create "{item.creatable}"
                  </ComboboxItem>
                ) : (
                  <ComboboxItem key={item.id} value={item}>
                    {item.name}
                  </ComboboxItem>
                )
              }
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        {form.payment_status === "partially_paid" ||
          (form.payment_status === "pending" && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-1">
                  <CalendarClock className="size-4" /> Set Reminder
                </CardTitle>
                <CardDescription>
                  You can set reminders for income and expenses, we will notify
                  you via email.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <FormFields
                  input={{
                    type: "date",
                    key: "reminder_date",
                    name: "reminder_date",
                    title: "Reminder Date",
                  }}
                  setValues={setForm as any}
                  values={form as any}
                  hideLabel
                  disabled={wait}
                />
                <FormFields
                  disabled={wait}
                  input={{
                    type: "textarea",
                    key: "reminder_message",
                    name: "reminder_message",
                    title: "Reminder Message",
                    placeholder: "Message here (Optional)",
                    rows: 5,
                  }}
                  setValues={setForm as any}
                  values={form as any}
                  hideLabel
                />
                <Alert>
                  <InfoIcon />
                  <AlertTitle>Important Note</AlertTitle>
                  <AlertDescription>
                    There can be few hours difference in reminder notifications
                    because of timezone and cron job interval.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ))}

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
              <Plus /> Add {type === "expense" ? "Expense" : "Income"}
            </>
          )}
        </Button>
      </RevealGroup>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new tag</DialogTitle>
            <DialogDescription>Add a new tag to select.</DialogDescription>
          </DialogHeader>
          <Input
            value={createTagForm.name}
            onChange={(e) =>
              setCreateTagForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Tag name"
            defaultValue={pendingTagName}
            className="my-4"
            autoFocus
          />
          <Select
            defaultValue={tagsColors[0]}
            onValueChange={(value) =>
              setCreateTagForm((prev) => ({
                ...prev,
                color: value,
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {tagsColors.map((tc) => (
                  <SelectItem
                    key={tc}
                    value={tc}
                    style={{
                      color: tc,
                    }}
                  >
                    <Dot
                      style={{
                        color: tc,
                      }}
                      className="size-7"
                    />{" "}
                    {tc}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpenDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AddTransaction;
