import { useMyIdeasQuery } from '@/features/ideas/hooks/use-idea-queries';
import { selectClass } from '@/features/ideas/lib/styles';
import {
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/features/ideas/ui/create-idea/Fields';
import {
  type SubmitProblemFormValues,
  formatIdeaIds,
  parseIdeaIds,
} from '@/features/problems/lib/submit-problem';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/input';

type IdeaSelectProps = {
  formId: string;
  control: Control<SubmitProblemFormValues>;
  errors: FieldErrors<SubmitProblemFormValues>;
};

export function IdeaSelect({ formId, control, errors }: IdeaSelectProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useMyIdeasQuery({ limit: 10 });

  const allIdeas = useMemo(
    () =>
      (data?.items ?? []).map(idea => ({
        id: idea.id,
        label: idea.title?.trim() || 'Untitled idea',
      })),
    [data?.items],
  );

  const resolveIdeaLabel = (id: string) =>
    allIdeas.find(idea => idea.id === id)?.label;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <Controller
      name="ideaIds"
      control={control}
      render={({ field }) => {
        const selectedIds = parseIdeaIds(field.value);
        const filteredIdeas = allIdeas.filter(idea =>
          idea.label.toLowerCase().includes(search.trim().toLowerCase()),
        );

        const toggleIdea = (id: string) => {
          const next = selectedIds.includes(id)
            ? selectedIds.filter(selectedId => selectedId !== id)
            : [...selectedIds, id];
          field.onChange(formatIdeaIds(next));
        };

        const removeIdea = (id: string) => {
          field.onChange(
            formatIdeaIds(selectedIds.filter(selectedId => selectedId !== id)),
          );
        };

        return (
          <FieldGroup>
            <FieldLabel htmlFor={`${formId}-ideas`}>
              Ideas that can solve this problem
            </FieldLabel>

            <div ref={containerRef} className="relative mt-2">
              <div
                id={`${formId}-ideas`}
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-invalid={!!errors.ideaIds}
                tabIndex={0}
                onClick={() => setOpen(previous => !previous)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setOpen(previous => !previous);
                  }
                }}
                className={cn(
                  selectClass,
                  'relative h-10 cursor-pointer overflow-hidden pr-9 pl-2 text-left',
                  open &&
                    'border-brand-light-blue ring-brand-light-blue/40 ring-2',
                  errors.ideaIds && 'border-destructive',
                )}
              >
                <div
                  className="flex h-full scrollbar-none flex-nowrap items-center gap-1.5 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  onWheel={event => {
                    event.currentTarget.scrollLeft += event.deltaY;
                  }}
                >
                  {selectedIds.length === 0 ? (
                    <span className="text-muted-foreground shrink-0 px-1 text-sm">
                      Choose an idea...
                    </span>
                  ) : (
                    selectedIds.map(id => {
                      const label = resolveIdeaLabel(id);
                      if (!label) return null;

                      return (
                        <span
                          key={id}
                          className="bg-brand-gray-100 text-brand-gray-900 inline-flex shrink-0 items-center gap-1 rounded-full py-0.5 pr-1 pl-2.5 text-xs whitespace-nowrap"
                        >
                          <span>{label}</span>
                          <button
                            type="button"
                            onClick={event => {
                              event.stopPropagation();
                              removeIdea(id);
                            }}
                            className="text-brand-gray-600 hover:text-brand-gray-900 inline-flex size-4 shrink-0 items-center justify-center rounded-full transition-colors"
                            aria-label={`Remove ${label}`}
                          >
                            <X
                              className="size-3"
                              strokeWidth={2.5}
                              aria-hidden
                            />
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
                <ChevronDown
                  className={cn(
                    'text-brand-gray-600 pointer-events-none absolute top-1/2 right-3 z-10 size-4 -translate-y-1/2 bg-white pl-1 transition-transform',
                    open && 'rotate-180',
                  )}
                  aria-hidden
                />
              </div>

              {open ? (
                <div
                  id={listboxId}
                  role="listbox"
                  aria-multiselectable
                  className="border-brand-gray-200 absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-white shadow-md"
                >
                  {allIdeas.length !== 0 && (
                    <div className="mx-2 p-2">
                      <div className="relative">
                        <Input
                          value={search}
                          onChange={event => setSearch(event.target.value)}
                          placeholder="Search"
                          className="focus-visible:ring-brand-gray-200 text-brand-gray-500 h-8 rounded-xs bg-white pr-9 text-xs focus-visible:ring-1"
                          aria-label="Search ideas"
                        />
                        <Search
                          className="text-brand-gray-400 pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
                          aria-hidden
                        />
                      </div>
                    </div>
                  )}

                  <ul className="max-h-52 overflow-y-auto py-1">
                    {isLoading ? (
                      <li className="text-brand-gray-600 px-3 py-2 text-sm">
                        Loading ideas…
                      </li>
                    ) : filteredIdeas.length === 0 ? (
                      <li className="text-brand-gray-600 px-3 py-2 text-sm">
                        No ideas found
                      </li>
                    ) : (
                      filteredIdeas.map(idea => {
                        const isSelected = selectedIds.includes(idea.id);

                        return (
                          <li
                            key={idea.id}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <div
                              className={cn(
                                'flex cursor-pointer items-center gap-2 px-3 py-2 transition-colors',
                                isSelected
                                  ? 'bg-brand-light-blue/35 hover:bg-brand-light-blue/45'
                                  : 'hover:bg-brand-light-blue/25',
                              )}
                              onClick={() => toggleIdea(idea.id)}
                              onKeyDown={event => {
                                if (
                                  event.key === 'Enter' ||
                                  event.key === ' '
                                ) {
                                  event.preventDefault();
                                  toggleIdea(idea.id);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              <span className="text-brand-gray-900 min-w-0 flex-1 truncate text-left text-sm">
                                {idea.label}
                              </span>
                              {isSelected ? (
                                <Check
                                  className="text-brand-dark-blue size-4 shrink-0"
                                  aria-hidden
                                />
                              ) : (
                                <span className="size-4 shrink-0" aria-hidden />
                              )}
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              ) : null}
            </div>

            <FieldError message={errors.ideaIds?.message} />
          </FieldGroup>
        );
      }}
    />
  );
}
