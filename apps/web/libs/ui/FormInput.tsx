import { InputHTMLAttributes } from "react";
import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import clsx from "clsx";

interface FormInputProps<T extends FieldValues> extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "name"
> {
  label: string;
  name: FieldPath<T>;
  control: Control<T>;
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "date";
}

/**
 * FormInput component for consistent form input styling and error handling.
 * Integrates with react-hook-form and Zod validation at the component level.
 *
 * Uses Controller for component-level integration, providing better control
 * and automatic error handling from react-hook-form.
 */
export function FormInput<T extends FieldValues>({
  label,
  name,
  control,
  type = "text",
  className,
  ...props
}: FormInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const { onBlur: propsOnBlur, onChange: propsOnChange, ...restProps } = props;

        return (
          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-ps-fg">{label}</div>
            <input
              {...restProps}
              {...field}
              type={type}
              onBlur={(e) => {
                field.onBlur();
                propsOnBlur?.(e);
              }}
              onChange={(e) => {
                field.onChange(e);
                propsOnChange?.(e);
              }}
              className={clsx(
                "w-full rounded-lg border bg-ps-bg-card px-3 py-2 text-sm text-ps-fg placeholder:text-ps-fg-subtle/50",
                error ? "border-rose-500" : "border-ps-primary-muted",
                className
              )}
            />
            {error ? <div className="text-sm text-rose-400">{error.message}</div> : null}
          </label>
        );
      }}
    />
  );
}
