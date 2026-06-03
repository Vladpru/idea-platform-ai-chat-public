import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { Label } from '@/shared/ui/label';

import {
  fieldErrorClass,
  fieldLabelClass,
  requiredMarkClass,
} from '@/features/ideas/lib/styles';

export function FieldLabel({
  htmlFor,
  children,
  required,
  hint,
}: {
  htmlFor?: string;
  children: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className={fieldLabelClass}>
        {children}
        {required ? <span className={requiredMarkClass}>*</span> : null}
        {!required && (
          <span className="text-brand-gray-600 ml-1 text-xs font-normal normal-case">
            (optional)
          </span>
        )}
      </Label>
      {hint ? (
        <p className="text-brand-gray-600 dark:text-muted-foreground mt-1 text-sm normal-case">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function FieldGroup({
  children,
  ...props
}: { children: ReactNode } & ComponentPropsWithoutRef<'div'>) {
  return (
    <div className="space-y-1" {...props}>
      {children}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className={fieldErrorClass}>{message}</p>;
}
