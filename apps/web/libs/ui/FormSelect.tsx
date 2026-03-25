import { SelectHTMLAttributes } from "react";
import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import clsx from "clsx";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormSelectProps<T extends FieldValues> extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "type" | "name"
> {
  label: string;
  name: FieldPath<T>;
  control: Control<T>;
  options: SelectOption[];
  placeholder?: string;
}

/**
 * FormSelect component for consistent form select styling and error handling.
 * Integrates with react-hook-form and Zod validation at the component level.
 *
 * Uses Controller for component-level integration, providing better control
 * and automatic error handling from react-hook-form.
 */
export function FormSelect<T extends FieldValues>({
  label,
  name,
  control,
  options,
  placeholder,
  className,
  ...props
}: FormSelectProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <label className="flex flex-col gap-1">
          <div className="text-sm font-medium text-ps-fg">{label}</div>
          <select
            {...field}
            {...props}
            className={clsx(
              "w-full rounded-lg border bg-ps-bg-card px-3 py-2 text-sm text-ps-fg focus:outline-none focus:ring-2 focus:ring-ps-border-focus focus:ring-offset-2",
              error ? "border-rose-500" : "border-ps-primary-muted",
              props.disabled && "opacity-50 cursor-not-allowed",
              className
            )}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          {error ? <div className="text-sm text-rose-400">{error.message}</div> : null}
        </label>
      )}
    />
  );
}
