import type { ComponentProps } from "react";

const pickerInputClass =
  "w-full rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2.5 pr-11 text-sm text-ps-fg focus:border-ps-border-focus focus:outline-none focus:ring-2 focus:ring-ps-border-focus [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none";

type Props = {
  type: "date" | "time";
} & Omit<ComponentProps<"input">, "type" | "className">;

/** Native date/time input with calendar icon affordance beside it (pair with `IconButton` + `relative` wrapper). */
export function NativePickerInput({ type, ...rest }: Props) {
  return <input type={type} className={pickerInputClass} {...rest} />;
}
