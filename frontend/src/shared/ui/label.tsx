import * as React from "react";
import { cn } from "@/shared/lib/utils";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "text-muted-foreground text-[11px] font-semibold tracking-wider",
        className,
      )}
      {...props}
    />
  );
}

