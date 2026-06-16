import { useEffect, useRef, useState } from 'react';
import { format, isValid, parse, startOfToday } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

type DateTimePickerProps = {
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
  minDate?: Date;
  id?: string;
  className?: string;
};

const DISPLAY_FORMAT = 'MMM dd, yyyy HH:mm';

const pad = (n: number) => String(n).padStart(2, '0');
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

function mergeDateAndTime(date: Date, hour: number, minute: number): Date {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function getDefaultDateTime(): Date {
  const next = new Date(Date.now() + 60 * 60_000);
  next.setMinutes(Math.ceil(next.getMinutes() / 15) * 15, 0, 0);
  return next;
}

export function getDefaultScheduleDateTime(): Date {
  return getDefaultDateTime();
}

export function DateTimePicker({
  value,
  onChange,
  minDate,
  id,
  className,
}: DateTimePickerProps) {
  const [inputValue, setInputValue] = useState(
    value ? format(value, DISPLAY_FORMAT) : '',
  );

  useEffect(() => {
    setInputValue(value ? format(value, DISPLAY_FORMAT) : '');
  }, [value]);

  const now = new Date();
  const hour = value?.getHours() ?? 12;
  const minute = value?.getMinutes() ?? 0;

  const selectedIsToday =
    value !== undefined &&
    value.getFullYear() === now.getFullYear() &&
    value.getMonth() === now.getMonth() &&
    value.getDate() === now.getDate();

  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();

  const isPastThreshold = (date: Date): boolean => {
    const threshold = minDate
      ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
      : startOfToday();
    return (
      new Date(date.getFullYear(), date.getMonth(), date.getDate()) < threshold
    );
  };

  // Keep the existing guard against scheduling a time earlier than "now" when
  // the selected day is today. Applied on blur so it never fights live typing.
  const clampToAllowedTime = (h: number, m: number): [number, number] => {
    if (!selectedIsToday) return [h, m];
    if (h < nowHour) return [nowHour, nowMinute];
    if (h === nowHour && m < nowMinute) return [h, nowMinute];
    return [h, m];
  };

  // Local buffers so a partially typed value (e.g. "1") isn't reformatted to
  // "01" mid-edit. Synced back from `value` only while the field is unfocused.
  const [hourInput, setHourInput] = useState(pad(hour));
  const [minuteInput, setMinuteInput] = useState(pad(minute));
  const hourFocused = useRef(false);
  const minuteFocused = useRef(false);

  useEffect(() => {
    if (!hourFocused.current) setHourInput(pad(hour));
    if (!minuteFocused.current) setMinuteInput(pad(minute));
  }, [hour, minute]);

  const commitTime = (h: number, m: number) => {
    onChange(mergeDateAndTime(value ?? getDefaultDateTime(), h, m));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);

    const parsed = parse(raw, DISPLAY_FORMAT, new Date());
    if (!isValid(parsed)) return;
    if (isPastThreshold(parsed)) return;

    onChange(parsed);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      return;
    }
    onChange(mergeDateAndTime(date, hour, minute));
  };

  // Block letters/symbols at the source while still allowing navigation,
  // editing and clipboard shortcuts.
  const blockNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key.length === 1 &&
      !/[0-9]/.test(e.key) &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault();
    }
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 2);
    setHourInput(digits);
    if (digits === '') return;
    commitTime(clamp(Number(digits), 0, 23), minute);
  };

  const handleHourBlur = () => {
    hourFocused.current = false;
    const [h, m] = clampToAllowedTime(clamp(Number(hourInput) || 0, 0, 23), minute);
    setHourInput(pad(h));
    setMinuteInput(pad(m));
    commitTime(h, m);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMinuteInput(digits);
    if (digits === '') return;
    commitTime(hour, clamp(Number(digits), 0, 59));
  };

  const handleMinuteBlur = () => {
    minuteFocused.current = false;
    const [h, m] = clampToAllowedTime(hour, clamp(Number(minuteInput) || 0, 0, 59));
    setHourInput(pad(h));
    setMinuteInput(pad(m));
    commitTime(h, m);
  };

  const timeInputClassName = 'h-9 w-12 px-1 text-center tabular-nums';

  return (
    <Popover>
      <div className={cn('flex items-center gap-1.5', className)}>
        <Input
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Jun 12, 2026 12:00"
          className="flex-1"
        />
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="icon">
            <CalendarIcon className="size-4" />
          </Button>
        </PopoverTrigger>
      </div>

      <PopoverContent className="w-auto p-4" align="end" sideOffset={6}>
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          disabled={isPastThreshold}
          defaultMonth={value ?? getDefaultDateTime()}
        />

        <div className="border-border mt-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Time</span>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                aria-label="Hours"
                maxLength={2}
                value={hourInput}
                onChange={handleHourChange}
                onKeyDown={blockNonNumericKeys}
                onFocus={e => {
                  hourFocused.current = true;
                  e.currentTarget.select();
                }}
                onBlur={handleHourBlur}
                className={timeInputClassName}
              />

              <span className="text-muted-foreground select-none text-sm font-semibold">
                :
              </span>

              <Input
                type="text"
                inputMode="numeric"
                aria-label="Minutes"
                maxLength={2}
                value={minuteInput}
                onChange={handleMinuteChange}
                onKeyDown={blockNonNumericKeys}
                onFocus={e => {
                  minuteFocused.current = true;
                  e.currentTarget.select();
                }}
                onBlur={handleMinuteBlur}
                className={timeInputClassName}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
