import { useEffect, useState } from 'react';
import { format, isValid, parse, startOfToday } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

type DateTimePickerProps = {
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
  minDate?: Date;
  id?: string;
  className?: string;
};

const DISPLAY_FORMAT = 'MMM dd, yyyy HH:mm';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

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

  const isHourDisabled = (h: number): boolean =>
    selectedIsToday && h < nowHour;

  const isMinuteDisabled = (m: number): boolean => {
    if (!selectedIsToday) return false;
    if (hour > nowHour) return false;
    if (hour < nowHour) return true;
    return m < nowMinute;
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

  const handleHourChange = (next: string) => {
    onChange(
      mergeDateAndTime(value ?? getDefaultDateTime(), Number(next), minute),
    );
  };

  const handleMinuteChange = (next: string) => {
    onChange(
      mergeDateAndTime(value ?? getDefaultDateTime(), hour, Number(next)),
    );
  };

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

      <PopoverContent className="w-auto p-3" align="end" sideOffset={6}>
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          disabled={isPastThreshold}
          defaultMonth={value ?? getDefaultDateTime()}
        />

        <div className="mt-3 border-t border-border pt-3">
          <div className="flex flex-row items-center justify-between">
            <span className="text-sm text-muted-foreground">Time</span>
            <div className="flex flex-row items-center gap-1.5">
              <Select value={String(hour)} onValueChange={handleHourChange}>
                <SelectTrigger className="w-[75px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {HOURS.map(h => (
                    <SelectItem
                      key={h}
                      value={String(h)}
                      disabled={isHourDisabled(h)}
                    >
                      {String(h).padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="select-none text-sm font-semibold text-muted-foreground">
                :
              </span>

              <Select value={String(minute)} onValueChange={handleMinuteChange}>
                <SelectTrigger className="w-[75px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {MINUTES.map(m => (
                    <SelectItem
                      key={m}
                      value={String(m)}
                      disabled={isMinuteDisabled(m)}
                    >
                      {String(m).padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
