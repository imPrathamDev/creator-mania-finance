export type SelectOptionObject = {
  id: string;
  title: string;
  description?: string;
};

type BaseInput = {
  key: string;
  title: string;
  name: string;
  disabled?: boolean;
};

type TextInput = BaseInput & {
  type: "text";
  placeholder?: string;
  defaultValue?: string;
  inputAttributeType: React.HTMLInputTypeAttribute;
};

type TextareaInput = BaseInput & {
  type: "textarea";
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
  cols?: number;
};

type NumberInput = BaseInput & {
  type: "number";
  defaultValue?: number;
  inputAttributeType: React.HTMLInputTypeAttribute;
};

type SelectInput = BaseInput & {
  type: "select";
  defaultValue?: string;
  options: (string | number | SelectOptionObject)[];
};

type SwitchInput = BaseInput & {
  type: "switch";
  defaultValue: boolean;
  inputAttributeType: React.HTMLInputTypeAttribute;
};

type FileInput = BaseInput & {
  type: "file";
  description?: string;
  accept?: string;
  multiple?: boolean;
};

type DateInput = BaseInput & {
  type: "date";
  description?: string;
  defaultValue?: Date;
};

type TagsInput = BaseInput & {
  type: "tags";
  defaultValue?: string[];
  placeholder?: string;
};

export type InputType =
  | TextInput
  | TextareaInput
  | NumberInput
  | SelectInput
  | SwitchInput
  | FileInput
  | DateInput
  | TagsInput;

export type InputCardSection = {
  heading: string;
  description?: string;
  inputs: InputType[][];
};

export type InputSection = {
  sections: InputCardSection[][];
  disabledGlobal?: boolean;
};
