import { formatTags, parseTags } from '@/features/ideas/lib/create-idea/tags';
import { selectClass } from '@/features/ideas/lib/styles';
import { X } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';

import { cn } from '@/shared/lib/utils';

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
  const [inputValue, setInputValue] = useState('');
  const tags = parseTags(value);

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

  const removeTag = (tag: string) => {
    commitTags(tags.filter(existing => existing !== tag));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag(inputValue);
      setInputValue('');
      return;
    }

    if (event.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]!);
    }
  };

  return (
    <div
      className={cn(
        selectClass,
        'mt-2 flex h-10 items-center overflow-hidden px-2 py-0',
        ariaInvalid && 'border-destructive',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <div
        className="flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onWheel={event => {
          event.currentTarget.scrollLeft += event.deltaY;
        }}
      >
        {tags.map(tag => (
          <span
            key={tag}
            className="bg-brand-gray-100 text-brand-gray-900 inline-flex shrink-0 items-center gap-1 rounded-full py-0.5 pr-1 pl-2.5 text-xs whitespace-nowrap"
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
          value={inputValue}
          disabled={disabled}
          placeholder={tags.length === 0 ? placeholder : undefined}
          aria-invalid={ariaInvalid}
          onChange={event => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          className="placeholder:text-muted-foreground min-w-[12ch] flex-1 shrink-0 border-0 bg-transparent px-1 text-sm outline-none disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
