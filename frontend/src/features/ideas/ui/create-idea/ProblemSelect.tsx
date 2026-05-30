import type { IdeaCreateFormValues } from '@/features/ideas/lib/create-idea';
import {
  type MockProblem,
  formatProblemIds,
  parseProblemIds,
} from '@/features/ideas/lib/problems';
import { type ProblemDraft, useProblemsListQuery } from '@/features/problems';
import { Link } from '@tanstack/react-router';
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { ROUTES } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import { selectClass } from '@/shared/ui/TagsInput';
import { Input } from '@/shared/ui/input';

import { ArrowLink } from '../icons/ArrowLink';
import { AddProblemModal } from '../modals/AddProblemModal';
import { FieldError, FieldGroup, FieldLabel } from './Fields';

interface ProblemSelectProps {
  formId: string;
  control: Control<IdeaCreateFormValues>;
  errors: FieldErrors<IdeaCreateFormValues>;
  createdProblems: MockProblem[];
  onProblemDraftCreated: (problem: ProblemDraft) => void;
}

function ProblemSelect({
  formId,
  control,
  errors,
  createdProblems,
  onProblemDraftCreated,
}: ProblemSelectProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [addProblemOpen, setAddProblemOpen] = useState(false);
  const { data: problemsFeed } = useProblemsListQuery({
    sort: 'newest',
    limit: 50,
  });

  const allProblems = useMemo(() => {
    const publishedProblems = problemsFeed?.data ?? [];
    const seen = new Set<string>();
    const merged: MockProblem[] = [];
    for (const problem of publishedProblems) {
      if (seen.has(problem.id)) continue;
      seen.add(problem.id);
      merged.push({ id: problem.id, label: problem.title });
    }
    for (const problem of createdProblems) {
      if (seen.has(problem.id)) continue;
      seen.add(problem.id);
      merged.push(problem);
    }
    return merged;
  }, [createdProblems, problemsFeed]);

  const resolveProblemLabel = (id: string) =>
    allProblems.find(problem => problem.id === id)?.label;

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
      name="problemId"
      control={control}
      render={({ field }) => {
        const selectedIds = parseProblemIds(field.value);
        const filteredProblems = allProblems.filter(problem =>
          problem.label.toLowerCase().includes(search.trim().toLowerCase()),
        );

        const toggleProblem = (id: string) => {
          const next = selectedIds.includes(id)
            ? selectedIds.filter(selectedId => selectedId !== id)
            : [...selectedIds, id];
          field.onChange(formatProblemIds(next));
        };

        const removeProblem = (id: string) => {
          field.onChange(
            formatProblemIds(
              selectedIds.filter(selectedId => selectedId !== id),
            ),
          );
        };

        return (
          <>
            <FieldGroup>
              <FieldLabel htmlFor={`${formId}-problem`} required>
                Problem this idea solves
              </FieldLabel>

              <div ref={containerRef} className="relative mt-2">
                <div
                  id={`${formId}-problem`}
                  role="combobox"
                  aria-haspopup="listbox"
                  aria-expanded={open}
                  aria-controls={listboxId}
                  aria-invalid={!!errors.problemId}
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
                    errors.problemId && 'border-destructive',
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
                        Choose a problem...
                      </span>
                    ) : (
                      selectedIds.map(id => {
                        const label = resolveProblemLabel(id);
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
                                removeProblem(id);
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
                    {allProblems.length !== 0 && (
                      <div className="mx-2 p-2">
                        <div className="relative">
                          <Input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Search"
                            className="focus-visible:ring-brand-gray-200 text-brand-gray-500 h-8 rounded-xs bg-white pr-9 text-xs focus-visible:ring-1"
                            aria-label="Search problems"
                          />
                          <Search
                            className="text-brand-gray-400 pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
                            aria-hidden
                          />
                        </div>
                      </div>
                    )}

                    <ul className="max-h-52 overflow-y-auto py-1">
                      {filteredProblems.length === 0 ? (
                        <li className="text-brand-gray-600 px-3 py-2 text-sm">
                          No problems found
                        </li>
                      ) : (
                        filteredProblems.map(problem => {
                          const isSelected = selectedIds.includes(problem.id);

                          return (
                            <li
                              key={problem.id}
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
                                onClick={() => toggleProblem(problem.id)}
                                onKeyDown={event => {
                                  if (
                                    event.key === 'Enter' ||
                                    event.key === ' '
                                  ) {
                                    event.preventDefault();
                                    toggleProblem(problem.id);
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                              >
                                <span className="text-brand-gray-900 min-w-0 flex-1 truncate text-left text-sm">
                                  {problem.label}
                                </span>

                                <Link
                                  to={ROUTES.problemDetail(problem.id)}
                                  target="_blank"
                                  className="text-brand-dark-blue inline-flex shrink-0 items-center gap-1 text-xs font-bold"
                                  onClick={event => event.stopPropagation()}
                                >
                                  View
                                  <ArrowLink className="size-3.5" aria-hidden />
                                </Link>

                                {isSelected ? (
                                  <Check
                                    className="text-brand-dark-blue size-4 shrink-0"
                                    aria-hidden
                                  />
                                ) : (
                                  <span
                                    className="size-4 shrink-0"
                                    aria-hidden
                                  />
                                )}
                              </div>
                            </li>
                          );
                        })
                      )}
                    </ul>
                    <hr className="mx-auto w-[95%]" />
                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        setAddProblemOpen(true);
                      }}
                      className="text-brand-dark-blue hover:bg-brand-light-blue/25 flex w-full items-center gap-2 px-3 py-3 text-xs font-bold uppercase transition-colors"
                    >
                      <Plus className="size-4" aria-hidden />
                      Add new problem
                    </button>
                  </div>
                ) : null}
              </div>

              <FieldError message={errors.problemId?.message} />
            </FieldGroup>

            <AddProblemModal
              open={addProblemOpen}
              onOpenChange={setAddProblemOpen}
              onCreated={problem => {
                onProblemDraftCreated(problem);
                setOpen(false);
              }}
            />
          </>
        );
      }}
    />
  );
}

export default ProblemSelect;
