import { TextareaHTMLAttributes } from "react";
import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import clsx from "clsx";

interface FormTextAreaProps<T extends FieldValues> extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "name"
> {
  label: string;
  name: FieldPath<T>;
  control: Control<T>;
}

/**
 * FormTextArea component for consistent form textarea styling and error handling.
 * Integrates with react-hook-form and Zod validation at the component level.
 */
export function FormTextArea<T extends FieldValues>({
  label,
  name,
  control,
  className,
  rows = 4,
  ...props
}: FormTextAreaProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const { onBlur: propsOnBlur, onChange: propsOnChange, ...restProps } = props;

        return (
          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-ps-fg">{label}</div>
            <textarea
              {...restProps}
              {...field}
              rows={rows}
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
