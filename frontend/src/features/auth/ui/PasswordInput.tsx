import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { Button, Input, Label } from '@/shared/ui';

interface PasswordInputProps {
  id: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  registration: UseFormRegisterReturn;
  error?: string;
  passwordVisible?: boolean;
  onPasswordVisibleChange?: (visible: boolean) => void;
}

export function PasswordInput({
  id,
  label,
  placeholder,
  autoComplete,
  registration,
  error,
  passwordVisible: passwordVisibleProp,
  onPasswordVisibleChange,
}: PasswordInputProps) {
  const [internalVisible, setInternalVisible] = useState(false);
  const controlled =
    passwordVisibleProp !== undefined && onPasswordVisibleChange !== undefined;
  const visible = controlled ? passwordVisibleProp : internalVisible;

  const toggle = () => {
    if (controlled) {
      onPasswordVisibleChange(!passwordVisibleProp);
    } else {
      setInternalVisible(v => !v);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-brand-gray-600 text-xs">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="rounded-sm bg-transparent py-2.5 pr-10"
          {...registration}
        />
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="text-brand-gray-400 hover:text-foreground absolute top-1/2 right-1 h-9 w-9 -translate-y-1/2"
          onClick={toggle}
          aria-label={visible ? 'Hide passwords' : 'Show passwords'}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
      {error && <p className="text-destructive text-xs font-medium">{error}</p>}
    </div>
  );
}
