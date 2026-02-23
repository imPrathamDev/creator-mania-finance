"use client";

import { InputCardSection, InputSection, InputType } from "@/types/form";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { ChevronDownIcon, Calendar as C, X } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { Textarea } from "../ui/textarea";
import { cn, isStringArray } from "@/lib/utils";
import { Badge } from "../ui/badge";
// import { toast } from "sonner";
import { Switch } from "../ui/switch";
import { goeyToast } from "goey-toast";
import moment from "moment";
interface KeyValue {
  [key: string]: number | string | string[] | File | Date | boolean | null;
}

export function FormFields({
  input,
  setValues,
  values,
  disabled,
  inputClassName,
  hideLabel = false,
}: {
  input: InputType;
  disabled?: boolean;
  values: KeyValue;
  setValues: React.Dispatch<React.SetStateAction<KeyValue>>;
  inputClassName?: string;
  hideLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [tagText, setTagText] = useState("");
  return (
    <div
      className={
        input.type === "switch"
          ? "flex items-center gap-3"
          : "grid w-full items-center gap-3"
      }
    >
      {!hideLabel && <Label htmlFor={input.name}>{input.title}</Label>}
      {input.type === "text" && (
        <Input
          disabled={disabled}
          type={input.inputAttributeType}
          id={input.name}
          placeholder={input.placeholder}
          onChange={(e) => {
            setValues((prev) => ({
              ...prev,
              [input.key]: e.target.value,
            }));
          }}
          value={(values[input.key] as any) ?? ""}
          className={inputClassName}
        />
      )}
      {input.type === "textarea" && (
        <Textarea
          disabled={disabled}
          placeholder={input.placeholder}
          id={input.name}
          onChange={(e) => {
            setValues((prev) => ({
              ...prev,
              [input.key]: e.target.value,
            }));
          }}
          value={values[input.key] as any}
          rows={input.rows}
          cols={input.cols}
          className={inputClassName}
          // defaultValue={input.defaultValue}
        />
      )}
      {input.type === "number" && (
        <Input
          disabled={disabled}
          type={input.inputAttributeType}
          id={input.name}
          onChange={(e) => {
            setValues((prev) => ({
              ...prev,
              [input.key]: Number(e.target.value),
            }));
          }}
          className={inputClassName}
          value={values[input.key] as any}
        />
      )}
      {input.type === "select" && (
        <Select
          disabled={disabled}
          defaultValue={input.defaultValue}
          onValueChange={(value) => {
            setValues((prev) => ({
              ...prev,
              [input.key]: value,
            }));
          }}
        >
          <SelectTrigger className={cn("w-full", inputClassName)}>
            <SelectValue placeholder={input.title} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {input.options.map((option) => (
                <SelectItem
                  key={
                    typeof option === "number" || typeof option === "string"
                      ? option
                      : option.id
                  }
                  value={
                    typeof option === "number" || typeof option === "string"
                      ? option.toString()
                      : option.id
                  }
                  className="capitalize"
                >
                  {typeof option === "number" || typeof option === "string"
                    ? option
                    : option.title}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
      {input.type === "file" && (
        <Input
          disabled={disabled}
          id={input.name}
          type="file"
          accept={input.accept}
          onChange={(e) => {
            setValues((prev) => ({
              ...prev,
              [input.key]: (e as any).target.files[0],
            }));
          }}
          className={inputClassName}
          multiple={input.multiple}
        />
      )}
      {input.type === "date" && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date"
              className="w-full justify-between font-normal bg-muted"
              suppressHydrationWarning
            >
              {values[input.key] && values[input.key] instanceof Date
                ? moment((values as any)[input.key]).format("Do MMMM, YYYY")
                : input.description
                  ? input.description
                  : "Select date"}
              <C />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              disabled={disabled}
              mode="single"
              selected={values[input.key] as any}
              captionLayout="dropdown"
              onSelect={(date) => {
                if (date) {
                  setValues((prev) => ({
                    ...prev,
                    [input.key]: date,
                  }));
                }
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      )}
      {input.type === "tags" && (
        <div className="border-input rounded-md border bg-transparent px-3 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none flex flex-wrap gap-2">
          {(values[input.key] as string[]).map((str, idex) => (
            <Badge
              key={"badge-" + idex}
              variant="secondary"
              className="capitalize"
            >
              {str}{" "}
              <button
                onClick={() => {
                  setValues((prev) => ({
                    ...prev,
                    [input.key]: (prev[input.key] as string[]).filter(
                      (_, _indx) => _indx !== idex,
                    ),
                  }));
                }}
                className="transition-opacity hover:opacity-70"
              >
                <X className="size-4" />
              </button>
            </Badge>
          ))}
          <input
            type="text"
            onChange={(e) => {
              setTagText(e.target.value);
            }}
            value={tagText}
            className="bg-transparent outline-none text-sm"
            placeholder={input.placeholder ?? "tag here..."}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                if (tagText.trim().length > 0) {
                  setValues((prev) => ({
                    ...prev,
                    [input.key]: [
                      ...(prev[input.key] as string[]),
                      tagText.toLowerCase().trim(),
                    ],
                  }));
                  setTagText("");
                } else {
                  goeyToast.warning("Tag can't be empty.");
                }
              }
            }}
          />
        </div>
      )}
      {input.type === "switch" && (
        <Switch
          id={input.name}
          checked={values[input.key] as any}
          onCheckedChange={(e) => {
            setValues((prev) => ({ ...prev, [input.key]: e }));
          }}
          name={input.name}
          defaultChecked={input.defaultValue}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export function FormCard({
  data,
  setValues,
  values,
  disabled,
}: {
  data: InputCardSection;
  disabled?: boolean;
  values: KeyValue;
  setValues: React.Dispatch<React.SetStateAction<KeyValue>>;
}) {
  return (
    <Card className="flex-1">
      <CardHeader className="border-b">
        <CardTitle>{data.heading}</CardTitle>
        {data.description && (
          <CardDescription>{data.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="grid gap-4">
        {data.inputs.map((inputs, iindex) => (
          <div
            key={"inputs-" + iindex}
            className={inputs.length > 1 ? "grid grid-cols-2 gap-2" : ""}
          >
            {inputs.map((input, inputIndex) => (
              <FormFields
                input={input}
                setValues={setValues}
                values={values}
                disabled={disabled ?? input.disabled}
                key={"input-" + inputIndex}
              />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CustomForm({
  data,
  setValues,
  values,
}: {
  data: InputSection;
  values: KeyValue;
  setValues: React.Dispatch<React.SetStateAction<KeyValue>>;
}) {
  return (
    <div className="grid gap-6">
      {data.sections.map((sections, index) => (
        <div key={"section0" + index} className="flex gap-4 items-start">
          {sections.map((innerSection, indx) => (
            <FormCard
              key={"inner-section-" + indx}
              data={innerSection}
              disabled={data.disabledGlobal}
              setValues={setValues}
              values={values}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default CustomForm;
