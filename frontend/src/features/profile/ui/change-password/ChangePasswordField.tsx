import { PASSWORD_MAX_LENGTH } from '@/features/profile/lib/change-password-schema';
import { labelClass } from '@/features/profile/ui/profile-view-classes';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

type ChangePasswordFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  registration: UseFormRegisterReturn;
  error?: string;
  autoFocus?: boolean;
};

export function ChangePasswordField({
  id,
  label,
  placeholder,
  autoComplete,
  registration,
  error,
  autoFocus,
}: ChangePasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const { onChange, ...registrationRest } = registration;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className={cn(labelClass, 'text-brand-gray-600')}>
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="rounded-sm bg-transparent py-2.5 pr-10"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...registrationRest}
          maxLength={PASSWORD_MAX_LENGTH}
          onChange={event => {
            const nextValue = event.target.value.slice(0, PASSWORD_MAX_LENGTH);
            if (nextValue === event.target.value) {
              onChange(event);
              return;
            }
            void onChange({
              target: { ...event.target, value: nextValue },
              type: event.type,
            });
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="text-brand-gray-400 hover:text-foreground absolute top-1/2 right-1 h-9 w-9 -translate-y-1/2"
          onClick={() => setVisible(current => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </Button>
      </div>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-destructive text-xs font-medium"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
