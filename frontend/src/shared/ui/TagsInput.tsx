import type { TagListItem } from '@/shared/api/tags/tags.types';
import { useTagsQuery } from '@/shared/hooks/use-tags-query';
import { X } from 'lucide-react';
import {
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { cn } from '@/shared/lib/utils';

export const selectClass =
  'border-brand-gray-200 bg-white text-foreground focus-visible:ring-ring flex h-10 w-full appearance-none rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

function parseTags(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
}

function formatTags(tags: string[]): string {
  return tags.join(', ');
}

function tagDisplayLabel(tag: TagListItem): string {
  return tag.label?.trim() || tag.name;
}

function matchesTagQuery(tag: TagListItem, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return false;
  return (
    tag.name.toLowerCase().includes(normalized) ||
    (tag.label?.toLowerCase().includes(normalized) ?? false)
  );
}

type TagsInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  'aria-invalid'?: boolean;
};

export function TagsInput({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = 'Start typing to search tags, hit Enter to add',
  'aria-invalid': ariaInvalid,
}: TagsInputProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const tags = parseTags(value);
  const { data: allTags = [], isLoading } = useTagsQuery({ enabled: !disabled });

  const selectedNamesLower = useMemo(
    () => new Set(tags.map(tag => tag.toLowerCase())),
    [tags],
  );

  const filteredSuggestions = useMemo(() => {
    const query = inputValue.trim();
    if (!query) return [];

    return allTags.filter(
      tag =>
        matchesTagQuery(tag, query) &&
        !selectedNamesLower.has(tag.name.toLowerCase()),
    );
  }, [allTags, inputValue, selectedNamesLower]);

  const showSuggestions = open && inputValue.trim().length > 0;

  useEffect(() => {
    if (!showSuggestions) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [showSuggestions]);

  const commitTags = (nextTags: string[]) => {
    onChange(formatTags(nextTags));
  };

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    const exists = tags.some(
      existing => existing.toLowerCase() === tag.toLowerCase(),
    );
    if (exists) return;
    commitTags([...tags, tag]);
  };

  const selectSuggestion = (tag: TagListItem) => {
    addTag(tag.name);
    setInputValue('');
    setOpen(false);
  };

  const removeTag = (tag: string) => {
    commitTags(tags.filter(existingTag => existingTag !== tag));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const firstSuggestion = filteredSuggestions[0];
      if (showSuggestions && firstSuggestion) {
        selectSuggestion(firstSuggestion);
        return;
      }
      addTag(inputValue);
      setInputValue('');
      setOpen(false);
      return;
    }

    if (event.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]!);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          selectClass,
          'mt-2 flex h-10 items-center overflow-hidden px-2 py-0',
          showSuggestions &&
            'border-brand-light-blue ring-brand-light-blue/40 ring-2',
          ariaInvalid && 'border-destructive',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <div
          className="flex min-w-0 flex-1 scrollbar-none flex-nowrap items-center gap-1.5 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          onWheel={event => {
            event.currentTarget.scrollLeft += event.deltaY;
          }}
        >
          {tags.map(tag => (
            <span
              key={tag}
              className="bg-brand-gray-100 text-brand-gray-900 inline-flex shrink-0 cursor-default items-center gap-1 rounded-full py-0.5 pr-1 pl-2.5 text-xs whitespace-nowrap"
            >
              <span>{tag}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeTag(tag)}
                className="text-brand-gray-600 hover:text-brand-gray-900 inline-flex size-4 shrink-0 items-center justify-center rounded-full transition-colors disabled:pointer-events-none"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="size-3" strokeWidth={2.5} aria-hidden />
              </button>
            </span>
          ))}
          <input
            id={id}
            type="text"
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls={listboxId}
            aria-autocomplete="list"
            value={inputValue}
            disabled={disabled}
            placeholder={tags.length === 0 ? placeholder : undefined}
            aria-invalid={ariaInvalid}
            onChange={event => {
              setInputValue(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            className="placeholder:text-muted-foreground min-w-[12ch] flex-1 shrink-0 border-0 bg-transparent px-1 text-sm outline-none disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {showSuggestions ? (
        <div
          id={listboxId}
          role="listbox"
          className="border-brand-gray-200 absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-white shadow-md"
        >
          <ul className="max-h-52 overflow-y-auto py-1">
            {isLoading ? (
              <li className="text-brand-gray-600 px-3 py-2 text-sm">
                Loading tags...
              </li>
            ) : filteredSuggestions.length === 0 ? (
              <li className="text-brand-gray-600 px-3 py-2 text-sm">
                No matching tags. Press Enter to add &ldquo;{inputValue.trim()}
                &rdquo;
              </li>
            ) : (
              filteredSuggestions.map(tag => (
                <li key={tag.id} role="option">
                  <button
                    type="button"
                    className="text-brand-gray-900 hover:bg-brand-light-blue/25 flex w-full px-3 py-2 text-left text-sm transition-colors"
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => selectSuggestion(tag)}
                  >
                    {tagDisplayLabel(tag)}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
