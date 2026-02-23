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

interface KeyValue {
  [key: string]: number | string | string[] | File | Date | boolean | null;
}

// const FileUpload = ({}: {}) => {
//   return (
//     <div className="flex items-center justify-center w-full">
//       <label
//         htmlFor="dropzone-file"
//         className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
//       >
//         <div className="flex flex-col items-center justify-center pt-5 pb-6">
//           <svg
//             className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
//             aria-hidden="true"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 20 16"
//           >
//             <path
//               stroke="currentColor"
//               stroke-linecap="round"
//               stroke-linejoin="round"
//               stroke-width="2"
//               d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
//             />
//           </svg>
//           <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
//             <span className="font-semibold">Click to upload</span> or drag and
//             drop
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400">
//             SVG, PNG, JPG or GIF (MAX. 800x400px)
//           </p>
//         </div>
//         <input id="dropzone-file" type="file" className="hidden" />
//       </label>
//     </div>
//   );
// };

// key={"input-" + inputIndex}

export function FormFields({
  input,
  setValues,
  values,
  disabled,
  inputClassName,
}: {
  input: InputType;
  disabled?: boolean;
  values: KeyValue;
  setValues: React.Dispatch<React.SetStateAction<KeyValue>>;
  inputClassName?: string;
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
      <Label htmlFor={input.name}>{input.title}</Label>
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
              variant="outline"
              id="date"
              className="w-full justify-between font-normal"
              suppressHydrationWarning
            >
              {values[input.key] && values[input.key] instanceof Date
                ? (values as any)[input.key].toLocaleDateString()
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
