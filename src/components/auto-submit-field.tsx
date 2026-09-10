"use client";

import { useState, useTransition } from "react";

export function AutoSubmitField({
  action,
  hidden,
  name,
  defaultValue,
  type = "text",
  placeholder,
  className,
}: {
  action: (formData: FormData) => void;
  hidden: Record<string, string>;
  name: string;
  defaultValue: string;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  return (
    <form action={(fd) => startTransition(() => action(fd))}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
        className={
          className ??
          `w-24 rounded-md border px-2 py-1 text-xs outline-none ${
            isPending ? "bg-slate-50" : ""
          } border-slate-300`
        }
      />
    </form>
  );
}
