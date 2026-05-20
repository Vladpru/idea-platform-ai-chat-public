import { AddProblemModal } from '@/features/ideas/ui/modals/AddProblemModal';
import { ArrowLink } from '@/features/ideas/ui/icons/ArrowLink';
import { FieldLabel } from '@/features/ideas/ui/create-idea/Fields';
import {
  primaryBtnClass,
  publishBtnClass,
  selectClass,
} from '@/features/ideas/lib/styles';
import { useLinkProblemMutation } from '@/features/ideas/hooks/use-idea-mutations';
import { type ProblemDraft, useMyProblemsQuery } from '@/features/problems';
import { cancelOutlineBtn } from '@/features/profile/ui/profile-view-classes';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

const SAVE_TOOLTIP = 'Select at least one problem to link it to this idea.';

type LinkExistingProblemModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideaId: string;
  linkedProblemIds?: string[];
};

export function LinkExistingProblemModal({
  open,
  onOpenChange,
  ideaId,
  linkedProblemIds = [],
}: LinkExistingProblemModalProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Тепер це масив для підтримки кількох проблем
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);

  const [addProblemOpen, setAddProblemOpen] = useState(false);

  const { data: myProblems = [], isLoading } = useMyProblemsQuery();
  const linkMutation = useLinkProblemMutation();

  const linkedSet = useMemo(
    () => new Set(linkedProblemIds),
    [linkedProblemIds],
  );

  const availableProblems = useMemo(() => {
    return myProblems
      .filter(problem => !linkedSet.has(problem.id))
      .map(problem => ({
        id: problem.id,
        label: problem.title,
      }));
  }, [linkedSet, myProblems]);

  const filteredProblems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return availableProblems;
    return availableProblems.filter(problem =>
      problem.label.toLowerCase().includes(query),
    );
  }, [availableProblems, search]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setDropdownOpen(false);
      setSearch('');
      setSelectedProblemIds([]);
      setAddProblemOpen(false);
    }
    onOpenChange(newOpen);
  };

  useEffect(() => {
    if (!dropdownOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (
        document
          .querySelector('[role="dialog"]')
          ?.contains(event.target as Node) &&
        addProblemOpen
      ) {
        return;
      }

      if (!containerRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown, { capture: true });
    return () =>
      document.removeEventListener('mousedown', onPointerDown, {
        capture: true,
      });
  }, [dropdownOpen, addProblemOpen]);

  // Тогл: якщо ID вже є — видаляємо, якщо немає — додаємо
  const handleToggleProblem = (problemId: string) => {
    setSelectedProblemIds(previous =>
      previous.includes(problemId)
        ? previous.filter(id => id !== problemId)
        : [...previous, problemId],
    );
  };

  const handleSave = () => {
    if (selectedProblemIds.length === 0) return;

    // Зверни увагу: мутація тепер має очікувати масив problemIds
    linkMutation.mutate(
      { ideaId, problemIds: selectedProblemIds },
      {
        onSuccess: () => {
          handleOpenChange(false);
        },
      },
    );
  };

  const canSave = selectedProblemIds.length > 0 && !linkMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            'border-brand-gray-200 max-w-lg gap-0 overflow-visible rounded-lg border bg-white p-0 shadow-xl',
            'sm:max-w-[520px]',
          )}
          onOpenAutoFocus={event => event.preventDefault()}
        >
          <div className="relative p-6 md:p-8">
            <button
              type="button"
              className="text-brand-dark-blue hover:bg-muted focus-visible:ring-ring absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
              aria-label="Close"
              onClick={() => handleOpenChange(false)}
            >
              <X className="size-5" aria-hidden />
            </button>

            <DialogHeader className="space-y-2 pr-8 text-left">
              <DialogTitle className="text-brand-gray-900 text-xl font-bold">
                Link problems
              </DialogTitle>
              <DialogDescription className="text-brand-gray-600 text-sm">
                Problem not listed?{' '}
                <button
                  type="button"
                  onClick={() => setAddProblemOpen(true)}
                  className="text-brand-dark-blue font-medium underline-offset-2 hover:underline"
                >
                  Add it here
                </button>
                . You can add more details later.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              <div>
                <FieldLabel htmlFor="link-problem-select">
                  Problems this idea solves
                </FieldLabel>

                <div ref={containerRef} className="relative mt-2">
                  <div
                    id="link-problem-select"
                    role="combobox"
                    aria-haspopup="listbox"
                    aria-expanded={dropdownOpen}
                    aria-controls={listboxId}
                    tabIndex={0}
                    onClick={() => setDropdownOpen(previous => !previous)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setDropdownOpen(previous => !previous);
                      }
                    }}
                    className={cn(
                      selectClass,
                      'relative min-h-10 cursor-pointer rounded-md pr-9 pl-2 text-left',
                      dropdownOpen &&
                        'border-brand-light-blue ring-brand-light-blue/40 ring-2',
                    )}
                  >
                    <div
                      className="flex h-full scrollbar-none flex-nowrap items-center gap-1.5 overflow-x-auto overflow-y-hidden py-1.5 pr-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                      onWheel={event => {
                        event.currentTarget.scrollLeft += event.deltaY;
                      }}
                    >
                      {selectedProblemIds.length === 0 ? (
                        <span className="text-muted-foreground shrink-0 px-1 text-sm">
                          Choose problems...
                        </span>
                      ) : (
                        selectedProblemIds.map(id => {
                          const label = availableProblems.find(
                            p => p.id === id,
                          )?.label;
                          if (!label) return null;

                          return (
                            <span
                              key={id}
                              className="bg-brand-gray-100 text-brand-gray-900 inline-flex shrink-0 items-center gap-1 rounded-full py-0.5 pr-1 pl-2.5 text-xs whitespace-nowrap"
                            >
                              <span className="max-w-[150px] truncate sm:max-w-[200px]">
                                {label}
                              </span>
                              <button
                                type="button"
                                onClick={event => {
                                  event.stopPropagation();
                                  handleToggleProblem(id);
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
                        dropdownOpen && 'rotate-180',
                      )}
                      aria-hidden
                    />
                  </div>

                  {dropdownOpen ? (
                    <div
                      id={listboxId}
                      role="listbox"
                      aria-multiselectable={true}
                      className="border-brand-gray-200 absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-md border bg-white shadow-lg"
                    >
                      <div className="mx-2 p-2">
                        <div className="relative">
                          <Input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Search problems..."
                            className="focus-visible:ring-brand-gray-200 text-brand-gray-500 h-8 rounded-xs bg-white pr-9 text-xs focus-visible:ring-1"
                            aria-label="Search problems"
                          />
                          <Search
                            className="text-brand-gray-400 pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
                            aria-hidden
                          />
                        </div>
                      </div>

                      <ul className="max-h-52 overflow-y-auto py-1">
                        {isLoading ? (
                          <li className="text-brand-gray-600 px-3 py-2 text-sm">
                            Loading problems…
                          </li>
                        ) : filteredProblems.length === 0 ? (
                          <li className="text-brand-gray-600 px-3 py-2 text-sm">
                            No problems found
                          </li>
                        ) : (
                          filteredProblems.map(problem => {
                            const isSelected = selectedProblemIds.includes(
                              problem.id,
                            );

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
                                      : 'hover:bg-brand-light-blue/15',
                                  )}
                                  onClick={() =>
                                    handleToggleProblem(problem.id)
                                  }
                                  onKeyDown={event => {
                                    if (
                                      event.key === 'Enter' ||
                                      event.key === ' '
                                    ) {
                                      event.preventDefault();
                                      handleToggleProblem(problem.id);
                                    }
                                  }}
                                  role="button"
                                  tabIndex={0}
                                >
                                  <span className="text-brand-gray-900 min-w-0 flex-1 truncate text-left text-sm">
                                    {problem.label}
                                  </span>

                                  <button
                                    type="button"
                                    disabled
                                    tabIndex={-1}
                                    onClick={event => event.stopPropagation()}
                                    className="text-brand-dark-blue inline-flex shrink-0 cursor-not-allowed items-center gap-1 text-xs font-bold opacity-60"
                                  >
                                    View
                                    <ArrowLink
                                      className="size-3.5"
                                      aria-hidden
                                    />
                                  </button>

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
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className={cancelOutlineBtn}
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>

                {canSave ? (
                  <Button
                    type="button"
                    className={primaryBtnClass}
                    disabled={linkMutation.isPending}
                    onClick={handleSave}
                  >
                    {linkMutation.isPending
                      ? 'Saving…'
                      : 'Save & link problems'}
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <Button
                          type="button"
                          disabled
                          className={publishBtnClass}
                          tabIndex={-1}
                        >
                          Save &amp; link problems
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">{SAVE_TOOLTIP}</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddProblemModal
        open={addProblemOpen}
        onOpenChange={setAddProblemOpen}
        onCreated={(problem: ProblemDraft) => {
          if (
            !linkedSet.has(problem.id) &&
            !selectedProblemIds.includes(problem.id)
          ) {
            setSelectedProblemIds(prev => [...prev, problem.id]);
          }
          setDropdownOpen(false);
        }}
      />
    </>
  );
}
