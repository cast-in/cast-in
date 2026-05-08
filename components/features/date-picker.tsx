"use client";

import * as React from "react";
import { CalendarIcon, Clock } from "lucide-react";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

type DatePickerProps = {
  id: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  startYear?: number;
  endYear?: number;
  disabled?: React.ComponentProps<typeof Calendar>["disabled"];
  className?: string;
};

export function DatePicker({
  id,
  name,
  defaultValue,
  placeholder = "날짜 선택",
  startYear = 1940,
  endYear = new Date().getFullYear(),
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(() =>
    parseDateOnly(defaultValue),
  );
  const value = date ? formatDateOnly(date) : "";

  return (
    <Popover open={open} onOpenChange={(next) => setOpen(next)}>
      <input type="hidden" name={name} value={value} />
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            color="neutral" variant="outline"
            data-empty={!date}
            className={cn(
              "h-10 w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon aria-hidden="true" />
        {date ? dateFormatter.format(date) : <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(nextDate) => {
            setDate(nextDate);
            if (nextDate) setOpen(false);
          }}
          captionLayout="dropdown"
          startMonth={new Date(startYear, 0)}
          endMonth={new Date(endYear, 11)}
          disabled={disabled}
          locale={ko}
        />
      </PopoverContent>
    </Popover>
  );
}

type DateTimePickerProps = {
  id: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  className?: string;
  minDate?: Date;
};

export function DateTimePicker({
  id,
  name,
  defaultValue,
  placeholder = "일시 선택",
  className,
  minDate,
}: DateTimePickerProps) {
  const initial = React.useMemo(() => parseDateTimeValue(defaultValue), [defaultValue]);
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(initial.date);
  const [time, setTime] = React.useState(initial.time ?? "23:59");
  const value = date ? `${formatDateOnly(date)}T${time}` : "";
  const minDay = minDate ? startOfDay(minDate) : undefined;

  return (
    <Popover open={open} onOpenChange={(next) => setOpen(next)}>
      <input type="hidden" name={name} value={value} />
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            color="neutral" variant="outline"
            data-empty={!date}
            className={cn(
              "h-10 w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon aria-hidden="true" />
        {date ? (
          `${dateFormatter.format(date)} ${time}`
        ) : (
          <span>{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={minDay ? { before: minDay } : undefined}
          locale={ko}
        />
        <div className="grid gap-2 border-t p-3">
          <Label htmlFor={`${id}-time`} className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-4 text-muted-foreground" />
            시간
          </Label>
          <Input
            id={`${id}-time`}
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value || "23:59")}
          />
          <Button type="button" size="sm" onClick={() => setOpen(false)}>
            완료
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function parseDateOnly(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return undefined;

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, month, day);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseDateTimeValue(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return { date: undefined, time: undefined };

  const localMatch = raw.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (localMatch) {
    return {
      date: parseDateOnly(localMatch[1]),
      time: localMatch[2],
    };
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return { date: undefined, time: undefined };
  }

  return {
    date: parsed,
    time: `${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`,
  };
}

function formatDateOnly(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}
